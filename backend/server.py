from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header, Request, Response
from fastapi.responses import Response as FastResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import base64
import os
import logging
import uuid
import html
import requests
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Literal
from datetime import datetime, timezone, timedelta
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)
from commission_utils import round_money, calculate_marketplace_commission

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
APP_NAME = os.environ.get("APP_NAME", "printcosmos")
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGO = "HS256"
PRO_PRICE = float(os.environ.get("PRO_PRICE", "4.99"))
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
STRIPE_STATEMENT_DESCRIPTOR = "PRINT COSMOS"
EMAIL_WEBHOOK_URL = os.environ.get("EMAIL_WEBHOOK_URL")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "Print Cosmos <noreply@printcosmos.app>")
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.environ.get("PAYPAL_CLIENT_SECRET", "")
PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "sandbox")
PAYPAL_WEBHOOK_ID = os.environ.get("PAYPAL_WEBHOOK_ID", "")
EASYPOST_API_KEY = os.environ.get("EASYPOST_API_KEY", "")
PAYPAL_BASE = "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"
EASYPOST_BASE = "https://api.easypost.com/v2"
EASYPOST_CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "CanadaPost", "AustraliaPost", "RoyalMail", "DeutschePost", "DHLGlobalMail", "DHLExpress", "Parcelforce", "PostNL", "TNT", "Hermes", "DPD", "GLS", "CollectPlus"]
EASYPOST_STATUS_MAP = {
    "pre_transit": "Label Created",
    "in_transit": "In Transit",
    "out_for_delivery": "Out for Delivery",
    "delivered": "Delivered",
    "available_for_pickup": "Out for Delivery",
    "failure": "Exception",
    "cancelled": "Exception",
    "error": "Exception",
}


def _require_live_stripe(operation: str = "operation"):
    if "REPLACE_WITH" in STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail=f"Stripe API key is a placeholder. Set a live sk_live_ key for {operation}.")
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe API key is not configured.")


def _require_live_paypal(operation: str = "operation"):
    if "REPLACE_WITH" in PAYPAL_CLIENT_ID or "REPLACE_WITH" in PAYPAL_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail=f"PayPal credentials are placeholders. Set live credentials for {operation}.")
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="PayPal credentials are not configured.")

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Object Storage ----------
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ---------- Auth helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_jwt(user_id: str, days: int = 7) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=days),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def decode_jwt(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError:
        return None

def set_auth_cookie(response: Response, token: str, key: str = "access_token", days: int = 7):
    response.set_cookie(
        key=key, value=token, max_age=days*24*60*60, path="/",
        httponly=True, secure=True, samesite="none",
    )

async def get_current_user(request: Request) -> Optional[dict]:
    # 1) Try JWT in access_token cookie or Bearer header
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]
    if token:
        # Try JWT first
        decoded = decode_jwt(token)
        if decoded:
            user = await db.users.find_one({"user_id": decoded["sub"]}, {"_id": 0, "password_hash": 0})
            if user and user.get("enforcement_status") != "Terminated":
                if user.get("enforcement_status") == "Suspended":
                    suspended_until = user.get("suspended_until")
                    if suspended_until:
                        try:
                            if datetime.fromisoformat(suspended_until) > datetime.now(timezone.utc):
                                return None
                        except Exception:
                            pass
                return user
        # Fallback: session_token (Emergent Google auth)
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at >= datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
                if user and user.get("enforcement_status") != "Terminated":
                    if user.get("enforcement_status") == "Suspended":
                        suspended_until = user.get("suspended_until")
                        if suspended_until:
                            try:
                                if datetime.fromisoformat(suspended_until) > datetime.now(timezone.utc):
                                    return None
                            except Exception:
                                pass
                    return user
    # Also try session_token cookie name for backward compat
    s_token = request.cookies.get("session_token")
    if s_token:
        session = await db.user_sessions.find_one({"session_token": s_token}, {"_id": 0})
        if session:
            user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
            if user and user.get("enforcement_status") != "Terminated":
                if user.get("enforcement_status") == "Suspended":
                    suspended_until = user.get("suspended_until")
                    if suspended_until:
                        try:
                            if datetime.fromisoformat(suspended_until) > datetime.now(timezone.utc):
                                return None
                        except Exception:
                            pass
                return user
    return None

async def require_user(request: Request) -> dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_platform_owner(request: Request) -> dict:
    user = await require_user(request)
    if not bool(user.get("is_platform_owner", False)):
        raise HTTPException(status_code=403, detail="Forbidden: owner-only access")


# Follower-count milestones that unlock a 3D badge on a user's profile.
# Ordered lowest -> highest; "id" is stable and used by the frontend to pick
# which 3D model/shape and label to render, "min_followers" is the threshold.
FOLLOWER_MILESTONES = [
    {"id": "500_followers", "min_followers": 500, "label": "500 Followers Medal", "kind": "medal"},
    {"id": "1000_followers", "min_followers": 1000, "label": "1,000 Followers Trophy", "kind": "trophy"},
]

MARKETPLACE_MILESTONES = [
    {"id": "first_sale", "min_sales": 1, "label": "First Sale", "kind": "medal"},
    {"id": "10_sales", "min_sales": 10, "label": "10 Sales", "kind": "medal"},
    {"id": "50_sales", "min_sales": 50, "label": "50 Sales", "kind": "trophy"},
    {"id": "100_sales", "min_sales": 100, "label": "100 Sales", "kind": "trophy"},
    {"id": "100_downloads", "min_downloads": 100, "label": "100 Downloads", "kind": "medal"},
    {"id": "1000_downloads", "min_downloads": 1000, "label": "1,000 Downloads", "kind": "trophy"},
    {"id": "10000_views", "min_views": 10000, "label": "10,000 Views", "kind": "medal"},
]


def milestone_ids_for(follow_count: int) -> list:
    count = follow_count or 0
    return [m["id"] for m in FOLLOWER_MILESTONES if count >= m["min_followers"]]


def marketplace_milestone_ids(listing_stats: dict) -> list:
    total_sales = listing_stats.get("total_sales", 0) or 0
    total_downloads = listing_stats.get("total_downloads", 0) or 0
    total_views = listing_stats.get("total_views", 0) or 0
    ids = []
    for m in MARKETPLACE_MILESTONES:
        if m.get("min_sales") and total_sales >= m["min_sales"]:
            ids.append(m["id"])
        if m.get("min_downloads") and total_downloads >= m["min_downloads"]:
            ids.append(m["id"])
        if m.get("min_views") and total_views >= m["min_views"]:
            ids.append(m["id"])
    return ids


def with_milestone_badges(user: dict) -> dict:
    """Attach the list of follower-milestone badges a user has earned, based
    on their current follow_count. Computed on the fly (not stored) so it
    can never drift out of sync with the real follower count."""
    if user is None:
        return user
    count = user.get("follow_count", 0) or 0
    user["milestone_badges"] = [m["id"] for m in FOLLOWER_MILESTONES if count >= m["min_followers"]]
    return user


async def compute_user_badges(user_id: str) -> list:
    """Compute all badges a user has earned based on current data.
    Returns list of badge IDs (strings)."""
    badges = []
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return badges

    # Platform Owner / Staff
    if user.get("is_platform_owner"):
        badges.append("platform_owner")

    # Pro Subscriber
    if user.get("has_creator_subscription_enabled") or user.get("is_pro"):
        badges.append("pro_subscriber")

    # Follower milestone badges (existing)
    follow_count = user.get("follow_count", 0) or 0
    for m in FOLLOWER_MILESTONES:
        if follow_count >= m["min_followers"]:
            badges.append(m["id"])

    # 6-point Star: Recognized Community Member
    # 10+ upvotes across 3-8 forum posts
    post_upvotes = await db.forum_posts.aggregate([
        {"$match": {"user_id": user_id}},
        {"$project": {"upvotes": {"$size": {"$ifNull": ["$upvoted_by", []]}}}},
        {"$group": {"_id": None, "total_upvotes": {"$sum": "$upvotes"}, "post_count": {"$sum": 1}}}
    ]).to_list(1)
    if post_upvotes:
        stats = post_upvotes[0]
        if stats.get("total_upvotes", 0) >= 10 and 3 <= stats.get("post_count", 0) <= 8:
            badges.append("community_star")

    # Shield: Verified Seller - 5-star average across 5-8 listings
    seller_listings = await db.listings.find({"seller_id": user_id}, {"_id": 0, "rating_avg": 1}).to_list(20)
    if len(seller_listings) >= 5:
        rated_listings = [l for l in seller_listings if l.get("rating_avg") is not None]
        if len(rated_listings) >= 5 and len(rated_listings) <= 8:
            avg_rating = sum(l.get("rating_avg", 0) for l in rated_listings) / len(rated_listings)
            if avg_rating >= 5.0:
                badges.append("verified_seller")

    # Trophy: Top Seller - 50+ sales
    total_sales = sum(l.get("sales_count", 0) for l in seller_listings)
    if total_sales >= 50:
        badges.append("top_seller")

    # Palette: Featured Designer - admin manually features a design
    featured_design = await db.designs.find_one({"creator_id": user_id, "is_featured": True}, {"_id": 0})
    if featured_design:
        badges.append("featured_designer")

    # Gear: Certified Print Service - sellers offering print services with quality bar
    service_listings = await db.listings.find({"seller_id": user_id, "listing_type": "service"}, {"_id": 0, "rating_avg": 1, "rating_count": 1}).to_list(20)
    if service_listings:
        rated_services = [l for l in service_listings if l.get("rating_avg") is not None and l.get("rating_count", 0) >= 3]
        if rated_services:
            avg_service_rating = sum(l.get("rating_avg", 0) for l in rated_services) / len(rated_services)
            if avg_service_rating >= 4.5:
                badges.append("certified_service")

    # Planet: Top Designer - community upvotes on designs
    design_upvotes = await db.designs.aggregate([
        {"$match": {"creator_id": user_id}},
        {"$project": {"upvotes": {"$size": {"$ifNull": ["$upvoted_by", []]}}}},
        {"$group": {"_id": None, "total_upvotes": {"$sum": "$upvotes"}, "design_count": {"$sum": 1}}}
    ]).to_list(1)
    if design_upvotes:
        stats = design_upvotes[0]
        if stats.get("total_upvotes", 0) >= 25 and stats.get("design_count", 0) >= 3:
            badges.append("top_designer")

    # Comet: Rising Creator - new creator gaining traction (joined <90 days, 10+ sales or 50+ design upvotes)
    created_at = user.get("created_at")
    if created_at:
        from datetime import datetime, timezone
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        days_since_join = (datetime.now(timezone.utc) - created_at).days
        if days_since_join <= 90:
            if total_sales >= 10 or (design_upvotes and design_upvotes[0].get("total_upvotes", 0) >= 50):
                badges.append("rising_creator")

    return badges


async def attach_badges_to_user(user: dict) -> dict:
    """Attach computed badges to a user object."""
    if not user:
        return user
    user["badges"] = await compute_user_badges(user["user_id"])
    user = with_milestone_badges(user)
    seller_listings = await db.listings.find({"seller_id": user["user_id"]}, {"_id": 0, "sales_count": 1, "download_count": 1, "view_count": 1}).to_list(200)
    listing_stats = {
        "total_sales": sum(l.get("sales_count", 0) for l in seller_listings),
        "total_downloads": sum(int(l.get("download_count") or 0) for l in seller_listings),
        "total_views": sum(int(l.get("view_count") or 0) for l in seller_listings),
    }
    user["marketplace_milestone_badges"] = marketplace_milestone_ids(listing_stats)
    return user


def _email_shell_html(title: str, body_html: str) -> str:
        return f"""
<!doctype html>
<html>
    <head>
        <meta charset=\"utf-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
        <title>{html.escape(title)}</title>
    </head>
    <body style=\"margin:0;padding:0;background:#f5f5f7;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;\">
        <div style=\"width:100%;padding:20px 12px;box-sizing:border-box;\">
            <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #E5E7EB;\">
                <div style=\"background:#121214;border-top:4px solid #F59E0B;padding:16px 20px;text-align:center;\">
                    <h1 style=\"margin:0;font-size:20px;line-height:1.3;color:#ffffff;font-weight:700;\">Print Cosmos</h1>
                </div>
                <div style=\"padding:20px;text-align:center;font-size:14px;line-height:1.6;\">{body_html}</div>
            </div>
        </div>
    </body>
</html>
""".strip()


async def send_platform_email(to_email: str, subject: str, body_html: str, kind: str, metadata: Optional[Dict] = None):
    if not to_email:
        return
    payload = {
        "email_id": f"eml_{uuid.uuid4().hex[:14]}",
        "to": to_email,
        "from": EMAIL_FROM,
        "subject": subject,
        "kind": kind,
        "html": _email_shell_html(subject, body_html),
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "queued",
    }
    await db.email_outbox.insert_one(payload)
    if EMAIL_WEBHOOK_URL:
        try:
            requests.post(EMAIL_WEBHOOK_URL, json=payload, timeout=20)
            await db.email_outbox.update_one({"email_id": payload["email_id"]}, {"$set": {"status": "dispatched"}})
        except Exception as exc:
            await db.email_outbox.update_one(
                {"email_id": payload["email_id"]},
                {"$set": {"status": "failed", "error": str(exc)}},
            )


def render_pro_receipt_body(name: str, amount: float) -> str:
        paid = round_money(amount)
        return f"""
<h2 style=\"margin:0 0 10px 0;font-size:20px;color:#111827;\">Receipt Confirmation</h2>
<p style=\"margin:0 0 14px 0;\">Thank you for upgrading, <strong>{html.escape(name)}</strong>! We've received your one-time payment of $4.99.</p>
<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;border:1px solid #E5E7EB;table-layout:fixed;\">
    <tr>
        <td style=\"border:1px solid #E5E7EB;padding:12px;font-size:14px;text-align:left;\">Item</td>
        <td style=\"border:1px solid #E5E7EB;padding:12px;font-size:14px;text-align:right;\">Print Cosmos Pro for life</td>
    </tr>
    <tr>
        <td style=\"border:1px solid #E5E7EB;padding:12px;font-size:14px;text-align:left;\">Amount</td>
        <td style=\"border:1px solid #E5E7EB;padding:12px;font-size:18px;text-align:right;font-weight:700;\">${paid:.2f}</td>
    </tr>
</table>
<p style=\"margin:14px 0 0 0;\">Your account has been permanently upgraded to Print Cosmos Pro for life. Enjoy your lower commission rates (2% to 4%), unlimited cloud portfolio storage, premium 6-pointed star profile badge, and the advanced 3D modeling designer workshop layout tool kit features! View your printable layout invoice receipt inside your account settings at any time. Let's make something amazing. - The Print Cosmos Team</p>
""".strip()

def default_user_doc(email: str, name: str, picture: Optional[str], provider: str) -> dict:
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    return {
        "user_id": user_id,
        "email": email.lower().strip(),
        "name": name,
        "user_tag": None,
        "picture": picture,
        "description": None,
        "country": None,
        "account_type": "neutral",
        "is_seller": False,
        "is_creator": False,
        "is_pro": False,
        "working_on": None,
        "looking_for": None,
        "currently_printing": None,
        "currently_printing_percent": None,
        "currently_printing_time_remaining": None,
        "bio": None,
        "skills": [],
        "social_links": {},
        "storage_used_bytes": 0,
        "filament_threads_balance": 10,
        "verification_status": "Unverified",  # Unverified | Pending_Review | Verified
        "follow_count": 0,
        "is_platform_owner": False,
        "enforcement_status": "Active",  # Active | Warned | Suspended | Terminated
        "enforcement_notification_pending": False,
        "enforcement_reason_text": None,
        "has_creator_subscription_enabled": False,
        "creator_subscription_custom_club_name": None,
        "creator_subscription_monthly_price": 0.00,
        "creator_subscription_custom_rules": None,
        "agreed_platform_terms": False,
        "launch_tour_completed": False,
        "stripe_account_id": None,
        "stripe_charges_enabled": False,
        "stripe_payouts_enabled": False,
        "stripe_onboarding_complete": False,
        "paypal_merchant_id": None,
        "paypal_onboarding_complete": False,
        "is_admin": False,
        "auth_provider": provider,
        "onboarded": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_tag")
        await db.users.create_index("is_platform_owner")
        await db.messages.create_index([("sender_id", 1), ("recipient_id", 1)])
        await db.messages.create_index("created_at")
        await db.physical_shipments.create_index("shipment_id", unique=True)
        await db.physical_shipments.create_index([("order_id", 1), ("seller_id", 1), ("listing_id", 1)], unique=True)
        await db.physical_shipments.create_index("buyer_id")
        await db.creator_subscriptions.create_index("subscription_id", unique=True)
        await db.creator_subscriptions.create_index([("subscriber_user_id", 1), ("creator_seller_id", 1)])
        await db.safety_reports.create_index("report_id", unique=True)
        await db.safety_reports.create_index("status")
        await db.safety_reports.create_index("created_at")
        await db.club_chats.create_index("club_creator_owner_id")
        await db.forums_posts.create_index("post_id", unique=True)
        await db.forums_posts.create_index("section_category")
        await db.forums_posts.create_index("created_at")
        await db.forums_likes.create_index("like_id", unique=True)
        await db.forums_likes.create_index([("user_id", 1), ("post_id", 1)], unique=True)
        await db.user_forum_history.create_index("history_id", unique=True)
        await db.user_forum_history.create_index([("user_id", 1), ("viewed_at", -1)])
        await db.user_follows.create_index([("follower_id", 1), ("following_id", 1)], unique=True)
        await db.user_follows.create_index("following_id")
        await db.club_members.create_index([("chat_id", 1), ("user_id", 1)], unique=True)
        await db.club_messages.create_index([("chat_id", 1), ("created_at", 1)])
        await db.forums_votes.create_index([("post_id", 1), ("user_id", 1)], unique=True)
        await db.forums_comments.create_index([("post_id", 1), ("created_at", 1)])
        await db.forums_comment_votes.create_index([("comment_id", 1), ("user_id", 1)], unique=True)
        await db.owner_coupons.create_index("code", unique=True)
        await db.owner_coupons.create_index("expires_at")
        await db.email_outbox.create_index("email_id", unique=True)
        await db.email_outbox.create_index("created_at")
        await db.recruitment_outreach.create_index("entry_id", unique=True)
        await db.recruitment_outreach.create_index("created_at")
        await db.refund_requests.create_index("request_id", unique=True)
        await db.refund_requests.create_index("created_at")
        await db.user_activities.create_index("activity_id", unique=True)
        await db.user_activities.create_index([("user_id", 1), ("created_at", -1)])
        await db.design_journals.create_index("entry_id", unique=True)
        await db.design_journals.create_index([("design_id", 1), ("created_at", -1)])
        await db.wishlists.create_index("wishlist_id", unique=True)
        await db.wishlists.create_index([("user_id", 1), ("created_at", -1)])
        await db.print_recipes.create_index("recipe_id", unique=True)
        await db.print_recipes.create_index([("listing_id", 1), ("upvotes_count", -1)])
        await db.print_recipe_votes.create_index("vote_id", unique=True)
        await db.print_recipe_votes.create_index([("recipe_id", 1), ("user_id", 1)], unique=True)
        await db.collections.create_index("collection_id", unique=True)
        await db.collections.create_index([("user_id", 1), ("created_at", -1)])
        await db.collection_items.create_index([("collection_id", 1), ("listing_id", 1)], unique=True)
        await db.collection_follows.create_index([("collection_id", 1), ("user_id", 1)], unique=True)
        
        # Print Failure Database
        await db.print_failures.create_index("failure_id", unique=True)
        await db.print_failures.create_index([("user_id", 1), ("created_at", -1)])
        await db.print_failures.create_index([("tags", 1)])
        await db.print_failures.create_index("status")
        await db.print_failure_fixes.create_index("fix_id", unique=True)
        await db.print_failure_fixes.create_index([("failure_id", 1), ("created_at", -1)])
        await db.print_failure_fix_votes.create_index([("fix_id", 1), ("user_id", 1)], unique=True)
        
        # Collaboration Boards
        await db.boards.create_index("board_id", unique=True)
        await db.boards.create_index([("owner_id", 1), ("created_at", -1)])
        await db.board_members.create_index([("board_id", 1), ("user_id", 1)], unique=True)
        await db.board_checklist.create_index("item_id", unique=True)
        await db.board_checklist.create_index([("board_id", 1), ("order", 1)])
        
        # Filament Calculator
        await db.filament_profiles.create_index("profile_id", unique=True)
        await db.filament_profiles.create_index([("user_id", 1), ("created_at", -1)])

        # Backfill new profile fields for existing users.
        await db.users.update_many(
            {"storage_used_bytes": {"$exists": False}},
            {"$set": {"storage_used_bytes": 0}},
        )
        await db.users.update_many(
            {"filament_threads_balance": {"$exists": False}},
            {"$set": {"filament_threads_balance": 10}},
        )
        await db.users.update_many(
            {"verification_status": {"$exists": False}},
            {"$set": {"verification_status": "Unverified"}},
        )
        await db.users.update_many(
            {"follow_count": {"$exists": False}},
            {"$set": {"follow_count": 0}},
        )
        await db.users.update_many(
            {"is_platform_owner": {"$exists": False}},
            {"$set": {"is_platform_owner": False}},
        )
        await db.users.update_many(
            {"enforcement_status": {"$exists": False}},
            {"$set": {"enforcement_status": "Active"}},
        )
        await db.users.update_many(
            {"enforcement_notification_pending": {"$exists": False}},
            {"$set": {"enforcement_notification_pending": False}},
        )
        await db.users.update_many(
            {"enforcement_reason_text": {"$exists": False}},
            {"$set": {"enforcement_reason_text": None}},
        )
        await db.users.update_many(
            {"suspended_until": {"$exists": False}},
            {"$set": {"suspended_until": None}},
        )
        await db.users.update_many(
            {"suspension_reason": {"$exists": False}},
            {"$set": {"suspension_reason": None}},
        )
        await db.users.update_many(
            {"has_creator_subscription_enabled": {"$exists": False}},
            {"$set": {"has_creator_subscription_enabled": False}},
        )
        await db.users.update_many(
            {"creator_subscription_custom_club_name": {"$exists": False}},
            {"$set": {"creator_subscription_custom_club_name": None}},
        )
        await db.users.update_many(
            {"creator_subscription_monthly_price": {"$exists": False}},
            {"$set": {"creator_subscription_monthly_price": 0.00}},
        )
        await db.users.update_many(
            {"creator_subscription_custom_rules": {"$exists": False}},
            {"$set": {"creator_subscription_custom_rules": None}},
        )
        await db.users.update_many(
            {"agreed_platform_terms": {"$exists": False}},
            {"$set": {"agreed_platform_terms": False}},
        )
        await db.users.update_many(
            {"velocity_subscription_prompt_active": {"$exists": False}},
            {"$set": {"velocity_subscription_prompt_active": False}},
        )
        await db.users.update_many(
            {"velocity_last_detected_at": {"$exists": False}},
            {"$set": {"velocity_last_detected_at": None}},
        )
        await db.users.update_many(
            {"launch_tour_completed": {"$exists": False}},
            {"$set": {"launch_tour_completed": False}},
        )
        await db.users.update_many(
            {"printer_model": {"$exists": False}},
            {"$set": {"printer_model": None}},
        )
        await db.users.update_many(
            {"filament_type": {"$exists": False}},
            {"$set": {"filament_type": None}},
        )
        await db.users.update_many(
            {"printer_model": {"$exists": False}},
            {"$set": {"printer_model": None}},
        )
        await db.users.update_many(
            {"filament_type": {"$exists": False}},
            {"$set": {"filament_type": None}},
        )
        await db.users.update_many(
            {"section_visits": {"$exists": False}},
            {"$set": {"section_visits": []}},
        )
        await db.users.update_many(
            {"stripe_account_id": {"$exists": False}},
            {"$set": {"stripe_account_id": None}},
        )
        await db.users.update_many(
            {"stripe_charges_enabled": {"$exists": False}},
            {"$set": {"stripe_charges_enabled": False}},
        )
        await db.users.update_many(
            {"stripe_payouts_enabled": {"$exists": False}},
            {"$set": {"stripe_payouts_enabled": False}},
        )
        await db.users.update_many(
            {"stripe_onboarding_complete": {"$exists": False}},
            {"$set": {"stripe_onboarding_complete": False}},
        )
        await db.users.update_many(
            {"paypal_merchant_id": {"$exists": False}},
            {"$set": {"paypal_merchant_id": None}},
        )
        await db.users.update_many(
            {"paypal_onboarding_complete": {"$exists": False}},
            {"$set": {"paypal_onboarding_complete": False}},
        )
        await db.users.update_many(
            {"working_on": {"$exists": False}},
            {"$set": {"working_on": None}},
        )
        await db.users.update_many(
            {"looking_for": {"$exists": False}},
            {"$set": {"looking_for": None}},
        )
        await db.users.update_many(
            {"currently_printing": {"$exists": False}},
            {"$set": {"currently_printing": None}},
        )
        await db.users.update_many(
            {"bio": {"$exists": False}},
            {"$set": {"bio": None}},
        )
        await db.users.update_many(
            {"skills": {"$exists": False}},
            {"$set": {"skills": []}},
        )
        await db.users.update_many(
            {"social_links": {"$exists": False}},
            {"$set": {"social_links": {}}},
        )
        await db.users.update_many(
            {"currently_printing_percent": {"$exists": False}},
            {"$set": {"currently_printing_percent": None}},
        )
        await db.users.update_many(
            {"currently_printing_time_remaining": {"$exists": False}},
            {"$set": {"currently_printing_time_remaining": None}},
        )

        # Backfill premium club pricing fields.
        await db.club_chats.update_many(
            {"is_premium_chat": {"$exists": False}},
            {"$set": {"is_premium_chat": False}},
        )
        await db.club_chats.update_many(
            {"club_entry_monthly_price": {"$exists": False}},
            {"$set": {"club_entry_monthly_price": 0.00}},
        )
        await db.club_chats.update_many(
            {"club_creator_owner_id": {"$exists": False}},
            {"$set": {"club_creator_owner_id": None}},
        )
        await db.club_chats.update_many(
            {"club_privacy_level": {"$exists": False}},
            {"$set": {"club_privacy_level": "PUBLIC"}},
        )
        await db.club_chats.update_many(
            {"is_charge_subscription_enabled": {"$exists": False}},
            {"$set": {"is_charge_subscription_enabled": False}},
        )

        # Backfill listing pricing/inventory map fields.
        await db.listings.update_many(
            {"base_original_price": {"$exists": False}},
            [{"$set": {"base_original_price": {"$ifNull": ["$price", 0.0]}}}],
        )
        await db.listings.update_many(
            {"active_sale_price": {"$exists": False}},
            {"$set": {"active_sale_price": None}},
        )
        await db.listings.update_many(
            {"is_on_sale": {"$exists": False}},
            {"$set": {"is_on_sale": False}},
        )
        await db.listings.update_many(
            {"available_filament_colors": {"$exists": False}},
            {"$set": {"available_filament_colors": []}},
        )
        await db.listings.update_many(
            {"print_time": {"$exists": False}},
            {"$set": {"print_time": None}},
        )
        await db.listings.update_many(
            {"time_lapse_video_path": {"$exists": False}},
            {"$set": {"time_lapse_video_path": None}},
        )
        await db.listings.update_many(
            {"compatibility_tags": {"$exists": False}},
            {"$set": {"compatibility_tags": []}},
        )
        await db.listings.update_many(
            {"printer_model": {"$exists": False}},
            {"$set": {"printer_model": None}},
        )
        await db.listings.update_many(
            {"filament_type": {"$exists": False}},
            {"$set": {"filament_type": None}},
        )

        await db.payment_transactions.update_many(
            {"line_items": {"$exists": True}},
            [{
                "$set": {
                    "line_items": {
                        "$map": {
                            "input": "$line_items",
                            "as": "li",
                            "in": {
                                "$mergeObjects": [
                                    "$$li",
                                    {"download_count": {"$ifNull": ["$$li.download_count", 0]}}
                                ]
                            },
                        }
                    }
                }
            }],
        )

        await db.forums_posts.update_many(
            {"upvotes_count": {"$exists": False}},
            {"$set": {"upvotes_count": 0}},
        )
        await db.forums_posts.update_many(
            {"downvotes_count": {"$exists": False}},
            {"$set": {"downvotes_count": 0}},
        )
        await db.forums_posts.update_many(
            {"score_count": {"$exists": False}},
            [{"$set": {"score_count": {"$subtract": [{"$ifNull": ["$upvotes_count", "$likes_count"]}, {"$ifNull": ["$downvotes_count", 0]}]}}}],
        )
        await db.forums_posts.update_many(
            {"last_activity_at": {"$exists": False}},
            [{"$set": {"last_activity_at": {"$ifNull": ["$created_at", datetime.now(timezone.utc).isoformat()]}}}],
        )
        await db.forums_posts.update_many(
            {"me_too_count": {"$exists": False}},
            {"$set": {"me_too_count": 0}},
        )

        await db.forums_votes.update_one({"vote_id": vote_id}, {"$set": update_doc})

        # Seed pinned forum post exactly once.
        pinned_title = "🚀 Welcome to the Cosmos! Read Before Posting"
        pinned_exists = await db.forums_posts.find_one({"title": pinned_title, "is_pinned_by_admin": True}, {"_id": 0, "post_id": 1})
        if not pinned_exists:
            owner = await db.users.find_one({"is_platform_owner": True}, {"_id": 0, "user_id": 1})
            owner_id = owner["user_id"] if owner else os.environ.get("SYSTEM_OWNER_UUID", "system_owner_uuid")
            await db.forums_posts.insert_one({
                "post_id": str(uuid.uuid4()),
                "author_user_id": owner_id,
                "title": pinned_title,
                "body_content": "Welcome to Print Cosmos—the ultimate decentralized sandbox and manufacturing network for 3D designers and makers! 🌌 This space is built to let you design, share, and launch your items into orbit. Here's your quick launch guide:\n\n1️⃣ EVERYONE CAN DESIGN: Click the 3D Designer Workshop tab to open our complete web-based modeling studio engine.\n2️⃣ LAUNCH YOUR FRONTIER: Ready to monetize? Link your bank account through your dashboard profile stepper settings to immediately publish physical or digital models and open your own custom Store Subscription Clubs!\n3️⃣ RESPECT THE FABRIC: Keep discussions constructive. Treat other makers with respect. Our case-insensitive monitoring systems filter profanity automatically, and repeated violations will prompt an immediate notification warning directly from the Moderator team.\n\nClaim your 10 free Filament Threads on us right now inside your navbar dashboard counter, upvote helpful threads to earn more currency fuels, and start making! — The Print Cosmos Team",
                "section_category": "General Chat",
                "views_count": 0,
                "likes_count": 0,
                "is_pinned_by_admin": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    except Exception as e:
        logger.warning(f"Index creation: {e}")

    if EASYPOST_API_KEY:
        start_background_tracking_task()
        logger.info("Background EasyPost tracking refresh task started")


async def _background_tracking_refresh():
    while True:
        try:
            if not EASYPOST_API_KEY:
                break
            cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            shipments = await db.physical_shipments.find({
                "easypost_tracker_id": {"$ne": None, "$exists": True},
                "shipping_status": {"$nin": ["Delivered", "Exception"]},
                "created_at": {"$gte": cutoff},
            }).limit(100).to_list(100)
            for shipment in shipments:
                try:
                    await refresh_easypost_tracking(
                        shipment["order_id"],
                        shipment["listing_id"],
                    )
                except Exception:
                    continue
        except Exception as exc:
            logger.warning(f"Background tracking refresh error: {exc}")
        await asyncio.sleep(300)


def start_background_tracking_task():
    task = asyncio.create_task(_background_tracking_refresh())
    return task


# =====================================================================
# AUTH ROUTES
# =====================================================================

class RegisterPayload(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

@api_router.post("/auth/register")
async def auth_register(payload: RegisterPayload, response: Response):
    email = payload.email.lower().strip()
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = default_user_doc(email, payload.name or email.split("@")[0], None, "email")
    doc["password_hash"] = hash_password(payload.password)
    await db.users.insert_one(doc)
    token = create_jwt(doc["user_id"])
    set_auth_cookie(response, token)
    doc.pop("password_hash", None)
    doc.pop("_id", None)
    return {"user": doc, "token": token}

@api_router.post("/auth/login")
async def auth_login(payload: LoginPayload, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt(user["user_id"])
    set_auth_cookie(response, token)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "token": token}

@api_router.post("/auth/session")
async def auth_session(request: Request, response: Response):
    """Emergent Google OAuth callback handler."""
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    resp = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": session_id}, timeout=15
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = resp.json()
    email = data["email"].lower().strip()
    name = data.get("name", email)
    picture = data.get("picture")
    session_token = data["session_token"]
    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": name, "picture": picture}})
    else:
        doc = default_user_doc(email, name, picture, "google")
        await db.users.insert_one(doc)
        user_id = doc["user_id"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    set_auth_cookie(response, session_token, key="session_token")
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return with_milestone_badges(user)


@api_router.get("/auth/status")
async def auth_status(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]
    if not token:
        return {"authenticated": False}
    decoded = decode_jwt(token)
    if not decoded:
        return {"authenticated": False}
    user = await db.users.find_one({"user_id": decoded["sub"]}, {"_id": 0, "password_hash": 0, "enforcement_status": 1, "suspended_until": 1, "suspension_reason": 1, "enforcement_reason_text": 1})
    if not user:
        return {"authenticated": False}
    if user.get("enforcement_status") == "Terminated":
        return {"authenticated": False, "terminated": True}
    if user.get("enforcement_status") == "Suspended":
        suspended_until = user.get("suspended_until")
        if suspended_until:
            try:
                if datetime.fromisoformat(suspended_until) > datetime.now(timezone.utc):
                    return {
                        "authenticated": False,
                        "suspended": True,
                        "until": suspended_until,
                        "reason": user.get("suspension_reason") or user.get("enforcement_reason_text") or "Account suspended",
                    }
            except Exception:
                pass
    return {"authenticated": True, "user": with_milestone_badges(user)}

@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    s = request.cookies.get("session_token")
    if s:
        await db.user_sessions.delete_one({"session_token": s})
    response.delete_cookie("session_token", path="/")
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api_router.post("/auth/become-seller")
async def become_seller(request: Request):
    user = await require_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_seller": True}})
    return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})

@api_router.post("/auth/become-creator")
async def become_creator(request: Request):
    user = await require_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_creator": True}})
    return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})

# =====================================================================
# PROFILE
# =====================================================================

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    user_tag: Optional[str] = None
    picture: Optional[str] = None
    description: Optional[str] = None
    account_type: Optional[str] = None
    verification_status: Optional[Literal["Unverified", "Pending_Review", "Verified"]] = None
    enforcement_status: Optional[Literal["Active", "Warned", "Terminated"]] = None
    enforcement_notification_pending: Optional[bool] = None
    enforcement_reason_text: Optional[str] = None
    has_creator_subscription_enabled: Optional[bool] = None
    creator_subscription_custom_club_name: Optional[str] = None
    creator_subscription_monthly_price: Optional[float] = None
    creator_subscription_custom_rules: Optional[str] = None
    agreed_platform_terms: Optional[bool] = None
    launch_tour_completed: Optional[bool] = None
    working_on: Optional[str] = None
    looking_for: Optional[str] = None
    currently_printing: Optional[str] = None
    currently_printing_percent: Optional[int] = Field(None, ge=0, le=100)
    currently_printing_time_remaining: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None
    printer_model: Optional[str] = None
    filament_type: Optional[str] = None

@api_router.put("/profile")
async def update_profile(payload: ProfileUpdate, request: Request):
    user = await require_user(request)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "account_type" in updates and updates["account_type"] not in ("personal", "business", "neutral"):
        raise HTTPException(status_code=400, detail="Invalid account_type")
    if "creator_subscription_monthly_price" in updates:
        if updates["creator_subscription_monthly_price"] < 0:
            raise HTTPException(status_code=400, detail="creator_subscription_monthly_price must be >= 0")
        updates["creator_subscription_monthly_price"] = round_money(updates["creator_subscription_monthly_price"])
    if "user_tag" in updates and updates["user_tag"]:
        gt = updates["user_tag"].strip().lstrip("@")
        if gt:
            existing = await db.users.find_one({"user_tag": gt, "user_id": {"$ne": user["user_id"]}})
            if existing:
                raise HTTPException(status_code=400, detail="User tag already taken")
            updates["user_tag"] = gt
    updates["onboarded"] = True
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    return with_milestone_badges(await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0}))

@api_router.get("/profile/{user_id}")
async def get_public_profile(user_id: str):
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "password_hash": 0, "email": 0}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = await attach_badges_to_user(user)
    total_sales = await db.payment_transactions.count_documents(
        {"line_items.seller_id": user_id, "payment_status": "paid"}
    )
    seller_listings = await db.listings.find({"seller_id": user_id}, {"_id": 0, "sales_count": 1, "download_count": 1, "view_count": 1}).to_list(200)
    listing_stats = {
        "total_sales": total_sales,
        "total_downloads": sum(int(l.get("download_count") or 0) for l in seller_listings),
        "total_views": sum(int(l.get("view_count") or 0) for l in seller_listings),
    }
    user["marketplace_milestone_badges"] = marketplace_milestone_ids(listing_stats)
    awards = await db.owner_medals.find({"user_id": user_id}, {"_id": 0, "awarded_by": 0}).to_list(100)
    user["total_sales"] = total_sales
    user["awards"] = awards
    return user


@api_router.get("/users/{user_id}/collections")
async def list_user_collections(user_id: str):
    items = await db.collections.find({"user_id": user_id, "is_public": True}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api_router.get("/users/{user_id}/awards")
async def list_user_awards(user_id: str):
    items = await db.owner_medals.find({"user_id": user_id}, {"_id": 0, "medal_id": 0, "awarded_by": 0}).to_list(100)
    return items


@api_router.get("/users/{user_id}/follow-status")
async def get_follow_status(user_id: str, request: Request):
    me = await get_current_user(request)
    if not me:
        return {"following": False}
    rel = await db.user_follows.find_one(
        {"follower_id": me["user_id"], "following_id": user_id},
        {"_id": 0, "follower_id": 1},
    )
    return {"following": bool(rel)}


@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, request: Request):
    me = await require_user(request)
    if me["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0, "user_id": 1})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    exists = await db.user_follows.find_one({"follower_id": me["user_id"], "following_id": user_id}, {"_id": 0})
    if not exists:
        await db.user_follows.insert_one(
            {
                "follow_id": str(uuid.uuid4()),
                "follower_id": me["user_id"],
                "following_id": user_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        await db.users.update_one({"user_id": user_id}, {"$inc": {"follow_count": 1}})
    return {"following": True}


@api_router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str, request: Request):
    me = await require_user(request)
    res = await db.user_follows.delete_one({"follower_id": me["user_id"], "following_id": user_id})
    if res.deleted_count:
        await db.users.update_one({"user_id": user_id}, {"$inc": {"follow_count": -1}})
    return {"following": False}


class CreateActivityPayload(BaseModel):
    activity_type: Literal["print_finished", "listing_published", "design_uploaded"]
    message: str
    target_id: Optional[str] = None
    target_type: Optional[str] = None


@api_router.post("/users/activities")
async def create_activity(payload: CreateActivityPayload, request: Request):
    me = await require_user(request)
    activity = {
        "activity_id": str(uuid.uuid4()),
        "user_id": me["user_id"],
        "user_name": me.get("name", ""),
        "user_tag": me.get("user_tag"),
        "user_picture": me.get("picture"),
        "activity_type": payload.activity_type,
        "message": payload.message.strip()[:500],
        "target_id": payload.target_id,
        "target_type": payload.target_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.user_activities.insert_one(activity)
    activity.pop("_id", None)
    return activity


@api_router.get("/feed/activities")
async def feed_activities(request: Request):
    me = await require_user(request)
    following = await db.user_follows.find({"follower_id": me["user_id"]}, {"_id": 0, "following_id": 1}).to_list(500)
    following_ids = [f["following_id"] for f in following]
    if not following_ids:
        return []
    activities = await db.user_activities.find(
        {"user_id": {"$in": following_ids}},
        {"_id": 0},
    ).sort("created_at", -1).limit(50).to_list(50)
    return activities


@api_router.get("/users/{user_id}/activities")
async def user_activities(user_id: str):
    activities = await db.user_activities.find(
        {"user_id": user_id},
        {"_id": 0},
    ).sort("created_at", -1).limit(50).to_list(50)
    return activities


@api_router.post("/seller/orders/{transaction_id}/finish")
async def finish_order(transaction_id: str, request: Request):
    me = await require_user(request)
    txn = await db.payment_transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    seller_id = None
    for li in txn.get("line_items", []):
        if li.get("seller_id") == me["user_id"]:
            seller_id = me["user_id"]
            break
    if not seller_id:
        raise HTTPException(status_code=403, detail="Not your order")
    
    if txn.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Order already completed")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.payment_transactions.update_one(
        {"transaction_id": transaction_id},
        {"$set": {"status": "completed", "completed_at": now}},
    )
    
    title_parts = []
    for li in txn.get("line_items", []):
        title_parts.append(li.get("listing_title") or li.get("listing_id", "item"))
    title = ", ".join([t for t in title_parts if t]) or "an order"
    
    activity = {
        "activity_id": str(uuid.uuid4()),
        "user_id": me["user_id"],
        "user_name": me.get("name", ""),
        "user_tag": me.get("user_tag"),
        "user_picture": me.get("picture"),
        "activity_type": "print_finished",
        "message": f"finished printing {title}",
        "target_id": transaction_id,
        "target_type": "transaction",
        "created_at": now,
    }
    await db.user_activities.insert_one(activity)
    
    return {"ok": True, "status": "completed", "activity": activity}


@api_router.get("/users/{user_id}/listings")
async def listings_by_user(user_id: str):
    items = await db.listings.find({"seller_id": user_id, "status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    seller = await db.users.find_one({"user_id": user_id}, {"_id": 0, "is_pro": 1, "is_platform_owner": 1, "enforcement_status": 1, "follow_count": 1})
    seller_listings = await db.listings.find({"seller_id": user_id}, {"_id": 0, "sales_count": 1, "download_count": 1, "view_count": 1}).to_list(200)
    listing_stats = {
        "total_sales": sum(l.get("sales_count", 0) for l in seller_listings),
        "total_downloads": sum(int(l.get("download_count") or 0) for l in seller_listings),
        "total_views": sum(int(l.get("view_count") or 0) for l in seller_listings),
    }
    for item in items:
        item["seller_is_pro"] = bool(seller and seller.get("is_pro", False))
        item["seller_is_platform_owner"] = bool(seller and seller.get("is_platform_owner", False))
        item["seller_milestone_badges"] = milestone_ids_for(seller.get("follow_count", 0) if seller else 0) + marketplace_milestone_ids(listing_stats)
        item["seller_enforcement_status"] = (seller or {}).get("enforcement_status", "Active")
    return items

@api_router.get("/users/search")
async def search_users(q: str = "", request: Request = None):
    if not q or len(q) < 2:
        return []
    me = await get_current_user(request) if request else None
    me_id = me["user_id"] if me else None
    # Escape special regex characters to prevent injection
    import re
    escaped_q = re.escape(q)
    regex = {"$regex": escaped_q, "$options": "i"}
    cursor = db.users.find(
        {"$or": [{"name": regex}, {"user_tag": regex}, {"email": regex}]},
        {"_id": 0, "password_hash": 0}
    ).limit(20)
    items = await cursor.to_list(20)
    return [
        {
            "user_id": u["user_id"],
            "name": u["name"],
            "user_tag": u.get("user_tag"),
            "picture": u.get("picture"),
            "is_pro": u.get("is_pro", False),
            "is_platform_owner": u.get("is_platform_owner", False),
            "is_seller": u.get("is_seller", False),
        }
        for u in items if u["user_id"] != me_id
    ]


@api_router.get("/users/search-tag")
async def search_users_by_tag(q: str = "", limit: int = 6):
    """Lightweight tag-only search used by the @mention autocomplete."""
    if not q or len(q) < 1:
        return []
    import re
    escaped_q = re.escape(q)
    cursor = db.users.find(
        {"user_tag": {"$regex": f"^{escaped_q}", "$options": "i"}},
        {"_id": 0, "user_id": 1, "name": 1, "user_tag": 1}
    ).limit(min(limit, 10))
    return await cursor.to_list(10)


# =====================================================================
# UPLOAD / FILES
# =====================================================================

@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = await require_user(request)
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    if ext in ("stl", "obj"):
        content_type = "model/" + ext
    result = put_object(path, data, content_type)
    await db.files.insert_one({
        "file_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": result["path"], "size": result.get("size", len(data)), "content_type": content_type}

async def validate_uploaded_paths(image_paths: List[str], model_path: Optional[str] = None):
    """Raise a 400 if any given path doesn't correspond to a real, previously
    uploaded file. This is what prevents listings/designs from ever being
    created with broken (never-uploaded) images."""
    if image_paths:
        existing = await db.files.find(
            {"storage_path": {"$in": image_paths}, "is_deleted": False},
            {"_id": 0, "storage_path": 1},
        ).to_list(len(image_paths))
        existing_paths = {f["storage_path"] for f in existing}
        missing = [p for p in image_paths if p not in existing_paths]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"One or more images were not found. Please upload photos using the upload button before publishing. (missing: {', '.join(missing)})",
            )
    if model_path:
        model_record = await db.files.find_one({"storage_path": model_path, "is_deleted": False}, {"_id": 0})
        if not model_record:
            raise HTTPException(status_code=400, detail="The attached 3D model file was not found. Please re-upload it before publishing.")


@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return FastResponse(content=data, media_type=record.get("content_type", content_type))

# =====================================================================
# LISTINGS
# =====================================================================

class ListingCreate(BaseModel):
    title: str
    description: str
    price: float
    base_original_price: Optional[float] = None
    active_sale_price: Optional[float] = None
    is_on_sale: bool = False
    available_filament_colors: List[str] = []
    image_paths: List[str] = []
    model_path: Optional[str] = None
    share_design: bool = False
    category: str = "Other"
    listing_type: str = "product"  # product | service
    negotiable: bool = False
    service_rules: Optional[str] = None
    print_time: Optional[str] = None  # e.g. "2h 30m"
    compatibility_tags: List[str] = []  # e.g. ["Bambu Lab P1S", "300x300 bed"]
    printer_model: Optional[str] = None  # e.g. "Bambu Lab P1S" — optional
    filament_type: Optional[str] = None  # e.g. "Prusament PLA" — optional


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    base_original_price: Optional[float] = None
    active_sale_price: Optional[float] = None
    is_on_sale: Optional[bool] = None
    sale_expiration_date: Optional[str] = None
    available_filament_colors: Optional[List[str]] = None
    print_time: Optional[str] = None
    compatibility_tags: Optional[List[str]] = None
    printer_model: Optional[str] = None
    filament_type: Optional[str] = None


class PrintRecipeCreate(BaseModel):
    printer: str
    nozzle_size: str
    filament_brand: str
    layer_height: str
    infill: str
    supports: str
    estimated_time: Optional[str] = None


class AdCreate(BaseModel):
    target_type: Literal["listing", "club", "design"]
    target_id: str
    blurb: str = Field(min_length=1, max_length=200)
    budget_usd: float = Field(ge=5.0, le=10000.0)
    start_date: Optional[str] = None  # ISO date
    end_date: Optional[str] = None  # ISO date


class AdResponse(BaseModel):
    ad_id: str
    target_type: str
    target_id: str
    seller_id: str
    seller_name: str
    blurb: str
    budget_usd: float
    spent_usd: float
    impressions: int
    clicks: int
    status: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    created_at: str


async def can_create_ads(user: dict) -> bool:
    """Check if user is eligible to create ads: Pro subscriber, club owner, or high-design-count seller."""
    # Pro subscribers can always create ads
    if user.get("is_pro") or user.get("has_creator_subscription_enabled"):
        return True
    # Club owners (creators with active subscription clubs)
    club = await db.creator_subscriptions.find_one({"creator_id": user["user_id"], "enabled": True}, {"_id": 0})
    if club:
        return True
    # High design count sellers (20+ public designs)
    design_count = await db.designs.count_documents({"creator_id": user["user_id"], "is_public": True})
    if design_count >= 20:
        return True
    return False


@api_router.post("/ads")
async def create_ad(payload: AdCreate, request: Request):
    user = await require_user(request)
    if not await can_create_ads(user):
        raise HTTPException(status_code=403, detail="Ad creation requires Pro subscription, active Store Club, or 20+ public designs")

    if payload.target_type == "listing":
        target = await db.listings.find_one({"listing_id": payload.target_id}, {"_id": 0})
        if not target:
            raise HTTPException(status_code=404, detail="Listing not found")
        if target.get("seller_id") != user["user_id"]:
            raise HTTPException(status_code=403, detail="Not your listing")
        target_name = target.get("title", "")
    elif payload.target_type == "club":
        target = await db.club_chats.find_one({"chat_id": payload.target_id, "club_creator_owner_id": user["user_id"]}, {"_id": 0})
        if not target:
            raise HTTPException(status_code=404, detail="Club not found")
        target_name = target.get("club_name", "")
    elif payload.target_type == "design":
        target = await db.designs.find_one({"design_id": payload.target_id, "creator_id": user["user_id"]}, {"_id": 0})
        if not target:
            raise HTTPException(status_code=404, detail="Design not found")
        target_name = target.get("title", "")
    else:
        raise HTTPException(status_code=400, detail="Invalid target_type")

    ad_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    ad_doc = {
        "ad_id": ad_id,
        "target_type": payload.target_type,
        "target_id": payload.target_id,
        "target_name": target_name,
        "seller_id": user["user_id"],
        "seller_name": user.get("name", ""),
        "blurb": payload.blurb.strip(),
        "budget_usd": round_money(payload.budget_usd),
        "spent_usd": 0.0,
        "impressions": 0,
        "clicks": 0,
        "status": "active",
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "created_at": now,
    }
    await db.ads.insert_one(ad_doc)
    return AdResponse(**ad_doc)


@api_router.get("/ads")
async def list_ads(request: Request):
    user = await require_user(request)
    ads = await db.ads.find({"seller_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [AdResponse(**a) for a in ads]


@api_router.get("/ads/{ad_id}")
async def get_ad(ad_id: str, request: Request):
    user = await require_user(request)
    ad = await db.ads.find_one({"ad_id": ad_id, "seller_id": user["user_id"]}, {"_id": 0})
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    return AdResponse(**ad)


@api_router.get("/public/ads/active")
async def list_active_public_ads():
    now = datetime.now(timezone.utc).isoformat()
    ads = await db.ads.find(
        {"status": "active", "$or": [{"end_date": None}, {"end_date": {"$gte": now}}]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(20)
    return [AdResponse(**a) for a in ads]

@api_router.post("/listings")
async def create_listing(payload: ListingCreate, request: Request):
    user = await require_user(request)
    if not user.get("is_seller"):
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_seller": True}})
    if payload.listing_type == "product" and len(payload.image_paths) < 2:
        raise HTTPException(status_code=400, detail="Product listings require at least 2 photos (front + back)")
    # Guard against listings that reference images which were never actually
    # uploaded (this is what causes broken-image icons on the marketplace).
    await validate_uploaded_paths(payload.image_paths, payload.model_path)
    list_price = round_money(payload.price)
    if list_price < 1.0:
        raise HTTPException(status_code=400, detail="price must be at least 1.00")
    base_original_price = round_money(payload.base_original_price if payload.base_original_price is not None else list_price)
    if base_original_price < 1.0:
        raise HTTPException(status_code=400, detail="base_original_price must be at least 1.00")
    active_sale_price = round_money(payload.active_sale_price) if payload.active_sale_price is not None else None
    if active_sale_price is not None and active_sale_price < 1.0:
        raise HTTPException(status_code=400, detail="active_sale_price must be at least 1.00")
    listing_id = f"lst_{uuid.uuid4().hex[:12]}"
    doc = {
        "listing_id": listing_id,
        "seller_id": user["user_id"],
        "seller_name": user["name"],
        "seller_picture": user.get("picture"),
        "seller_user_tag": user.get("user_tag"),
        "seller_country": user.get("country") or "US",  # default to US, users can update their profile
        "title": payload.title,
        "description": payload.description,
        "price": list_price,
        "base_original_price": base_original_price,
        "active_sale_price": active_sale_price,
        "is_on_sale": bool(payload.is_on_sale),
        "available_filament_colors": [str(c).strip() for c in payload.available_filament_colors if str(c).strip()],
        "image_paths": payload.image_paths,
        "model_path": payload.model_path,
        "share_design": payload.share_design,
        "category": payload.category,
        "listing_type": payload.listing_type,
        "negotiable": payload.negotiable,
        "service_rules": payload.service_rules,
        "print_time": payload.print_time,
        "compatibility_tags": [str(t).strip() for t in payload.compatibility_tags if str(t).strip()],
        "printer_model": payload.printer_model,
        "filament_type": payload.filament_type,
        "time_lapse_video_path": None,
        "sales_count": 0,
        "rating_avg": 0.0,
        "rating_count": 0,
        "view_count": 0,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.listings.insert_one(doc)

    # Velocity detector: check last 72 hours after each publish and flag seller CRM prompt.
    cutoff_iso = (datetime.now(timezone.utc) - timedelta(hours=72)).isoformat()
    velocity_count = await db.listings.count_documents(
        {
            "seller_id": user["user_id"],
            "created_at": {"$gte": cutoff_iso},
        }
    )
    if velocity_count >= 10 and not bool(user.get("has_creator_subscription_enabled", False)):
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {
                "$set": {
                    "velocity_subscription_prompt_active": True,
                    "velocity_last_detected_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
    if payload.share_design and payload.model_path:
        design_id = f"dsg_{uuid.uuid4().hex[:12]}"
        await db.designs.insert_one({
            "design_id": design_id,
            "creator_id": user["user_id"],
            "creator_name": user["name"],
            "title": payload.title,
            "description": payload.description,
            "model_path": payload.model_path,
            "geometry": None,
            "image_paths": payload.image_paths,
            "is_public": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    doc.pop("_id", None)
    return doc


@api_router.get("/seller/velocity-status")
async def seller_velocity_status(request: Request):
    user = await require_user(request)
    cutoff_iso = (datetime.now(timezone.utc) - timedelta(hours=72)).isoformat()
    recent_posts = await db.listings.count_documents(
        {
            "seller_id": user["user_id"],
            "created_at": {"$gte": cutoff_iso},
        }
    )
    show_alert = bool(recent_posts >= 10 and not bool(user.get("has_creator_subscription_enabled", False)))
    if show_alert and not user.get("velocity_subscription_prompt_active", False):
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {
                "$set": {
                    "velocity_subscription_prompt_active": True,
                    "velocity_last_detected_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
    return {
        "recent_posts_72h": recent_posts,
        "show_subscription_velocity_alert": show_alert,
        "velocity_subscription_prompt_active": bool(user.get("velocity_subscription_prompt_active", False)) or show_alert,
    }

@api_router.get("/listings")
async def list_listings(category: Optional[str] = None, q: Optional[str] = None, print_time: Optional[str] = None):
    query = {"status": "active", "is_archived": {"$ne": True}}
    if category and category != "All":
        query["category"] = category
    if q:
        import re
        escaped_q = re.escape(q)
        query["title"] = {"$regex": escaped_q, "$options": "i"}
    if print_time:
        query["print_time"] = print_time
    items = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    seller_ids = list({i.get("seller_id") for i in items if i.get("seller_id")})
    seller_map = {}
    seller_listing_stats = {}
    if seller_ids:
        sellers = await db.users.find(
            {"user_id": {"$in": seller_ids}},
            {"_id": 0, "user_id": 1, "is_pro": 1, "is_platform_owner": 1, "enforcement_status": 1, "follow_count": 1},
        ).to_list(len(seller_ids))
        seller_map = {u["user_id"]: u for u in sellers}
        seller_listings = await db.listings.find({"seller_id": {"$in": seller_ids}}, {"_id": 0, "seller_id": 1, "sales_count": 1, "download_count": 1, "view_count": 1}).to_list(2000)
        for sid in seller_ids:
            sl = [l for l in seller_listings if l.get("seller_id") == sid]
            seller_listing_stats[sid] = {
                "total_sales": sum(l.get("sales_count", 0) for l in sl),
                "total_downloads": sum(int(l.get("download_count") or 0) for l in sl),
                "total_views": sum(int(l.get("view_count") or 0) for l in sl),
            }
    for item in items:
        s = seller_map.get(item.get("seller_id"), {})
        item["seller_is_pro"] = bool(s.get("is_pro", False))
        item["seller_is_platform_owner"] = bool(s.get("is_platform_owner", False))
        stats = seller_listing_stats.get(item.get("seller_id"), {})
        item["seller_milestone_badges"] = milestone_ids_for(s.get("follow_count", 0)) + marketplace_milestone_ids(stats)
        item["seller_enforcement_status"] = s.get("enforcement_status", "Active")
    return items


@api_router.get("/listings/random")
async def random_listing():
    item = await db.listings.find({"status": "active"}, {"_id": 0}).aggregate([{"$sample": {"size": 1}}]).to_list(1)
    return item[0] if item else {}


@api_router.get("/designs/random")
async def random_design():
    item = await db.designs.find({"is_public": True}, {"_id": 0}).aggregate([{"$sample": {"size": 1}}]).to_list(1)
    return item[0] if item else {}


@api_router.get("/listings/{listing_id}/buyer-regions")
async def listing_buyer_regions(listing_id: str):
    pipeline = [
        {"$match": {"line_items.listing_id": listing_id, "$or": [{"payment_status": "paid"}, {"status": "completed"}]}},
        {"$unwind": {"path": "$line_items", "preserveNullAndEmptyArrays": True}},
        {"$match": {"line_items.listing_id": listing_id}},
        {"$group": {"_id": "$buyer_id", "count": {"$sum": 1}}},
    ]
    txns = await db.payment_transactions.aggregate(pipeline).to_list(500)
    buyer_ids = [t["_id"] for t in txns if t.get("_id")]
    if not buyer_ids:
        return {"regions": [], "total_buyers": 0}
    buyers = await db.users.find({"user_id": {"$in": buyer_ids}}, {"_id": 0, "user_id": 1, "country": 1, "name": 1}).to_list(500)
    country_counts = {}
    for b in buyers:
        c = b.get("country") or "Unknown"
        country_counts[c] = country_counts.get(c, 0) + 1
    ranked = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    return {"regions": [{"country": c, "count": n} for c, n in ranked], "total_buyers": sum(country_counts.values())}


@api_router.post("/listings/{listing_id}/recipes")
async def create_print_recipe(listing_id: str, payload: PrintRecipeCreate, request: Request):
    user = await require_user(request)
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0, "seller_id": 1})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    recipe_id = f"rcp_{uuid.uuid4().hex[:12]}"
    doc = {
        "recipe_id": recipe_id,
        "listing_id": listing_id,
        "author_user_id": user["user_id"],
        "author_name": user.get("name", ""),
        "printer": payload.printer.strip()[:120],
        "nozzle_size": payload.nozzle_size.strip()[:40],
        "filament_brand": payload.filament_brand.strip()[:120],
        "layer_height": payload.layer_height.strip()[:40],
        "infill": payload.infill.strip()[:40],
        "supports": payload.supports.strip()[:40],
        "estimated_time": payload.estimated_time.strip()[:60] if payload.estimated_time else None,
        "upvotes_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.print_recipes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/listings/{listing_id}/recipes")
async def list_print_recipes(listing_id: str):
    recipes = await db.print_recipes.find({"listing_id": listing_id}, {"_id": 0}).sort([("upvotes_count", -1), ("created_at", -1)]).to_list(200)
    return recipes


@api_router.post("/listings/{listing_id}/recipes/{recipe_id}/upvote")
async def upvote_print_recipe(listing_id: str, recipe_id: str, request: Request):
    user = await require_user(request)
    recipe = await db.print_recipes.find_one({"recipe_id": recipe_id, "listing_id": listing_id}, {"_id": 0, "upvotes_count": 1})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    existing = await db.print_recipe_votes.find_one({"recipe_id": recipe_id, "user_id": user["user_id"]}, {"_id": 0})
    if existing:
        await db.print_recipe_votes.delete_one({"recipe_id": recipe_id, "user_id": user["user_id"]})
        await db.print_recipes.update_one({"recipe_id": recipe_id}, {"$inc": {"upvotes_count": -1}})
        return {"upvotes_count": max((recipe.get("upvotes_count") or 0) - 1, 0), "active": False}
    await db.print_recipe_votes.insert_one({
        "vote_id": f"rcpvote_{uuid.uuid4().hex[:12]}",
        "recipe_id": recipe_id,
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.print_recipes.update_one({"recipe_id": recipe_id}, {"$inc": {"upvotes_count": 1}})
    return {"upvotes_count": (recipe.get("upvotes_count") or 0) + 1, "active": True}


@api_router.post("/listings/{listing_id}/time-lapse")
async def upload_listing_time_lapse(listing_id: str, request: Request):
    user = await require_user(request)
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0, "seller_id": 1})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("seller_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    form = await request.form()
    upload = form.get("file")
    if not upload:
        raise HTTPException(status_code=400, detail="file is required")
    path = await save_upload(upload.filename, upload.file, upload.content_type)
    await db.listings.update_one({"listing_id": listing_id}, {"$set": {"time_lapse_video_path": path}})
    return {"time_lapse_video_path": path}


@api_router.post("/designs/{design_id}/time-lapse")
async def upload_design_time_lapse(design_id: str, request: Request):
    user = await require_user(request)
    design = await db.designs.find_one({"design_id": design_id}, {"_id": 0, "creator_id": 1})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if design.get("creator_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your design")
    form = await request.form()
    upload = form.get("file")
    if not upload:
        raise HTTPException(status_code=400, detail="file is required")
    path = await save_upload(upload.filename, upload.file, upload.content_type)
    await db.designs.update_one({"design_id": design_id}, {"$set": {"time_lapse_video_path": path}})
    return {"time_lapse_video_path": path}

async def user_has_completed_purchase(user_id: str, listing_id: str) -> bool:
    if not user_id:
        return False
    txn = await db.payment_transactions.find_one(
        {
            "listing_id": listing_id,
            "buyer_id": user_id,
            "$or": [
                {"payment_status": "paid"},
                {"status": "completed"},
            ],
        },
        {"_id": 0},
    )
    return bool(txn)

@api_router.get("/listings/{listing_id}")
async def get_listing(listing_id: str, request: Request):
    item = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Listing not found")
    seller = await db.users.find_one({"user_id": item.get("seller_id")}, {"_id": 0, "is_pro": 1, "is_platform_owner": 1, "enforcement_status": 1, "description": 1, "user_tag": 1, "follow_count": 1, "created_at": 1})
    item["seller_is_pro"] = bool(seller and seller.get("is_pro", False))
    item["seller_is_platform_owner"] = bool(seller and seller.get("is_platform_owner", False))
    listing_stats = {
        "total_sales": 0,
        "total_downloads": 0,
        "total_views": 0,
    }
    if seller:
        seller_listings_for_stats = await db.listings.find({"seller_id": seller["user_id"]}, {"_id": 0, "sales_count": 1, "download_count": 1, "view_count": 1}).to_list(200)
        listing_stats = {
            "total_sales": sum(l.get("sales_count", 0) for l in seller_listings_for_stats),
            "total_downloads": sum(int(l.get("download_count") or 0) for l in seller_listings_for_stats),
            "total_views": sum(int(l.get("view_count") or 0) for l in seller_listings_for_stats),
        }
    item["seller_milestone_badges"] = milestone_ids_for(seller.get("follow_count", 0) if seller else 0) + marketplace_milestone_ids(listing_stats)
    item["seller_enforcement_status"] = (seller or {}).get("enforcement_status", "Active")
    item["seller_description"] = (seller or {}).get("description")
    item["seller_user_tag"] = (seller or {}).get("user_tag")

    # Compute seller badges
    if seller:
        seller_listings = await db.listings.find({"seller_id": seller["user_id"]}, {"_id": 0}).to_list(200)
        total_sales = sum(l.get("sales_count", 0) for l in seller_listings)
        avg_rating = 0
        ratings = await db.ratings.find({"listing_id": {"$in": [l["listing_id"] for l in seller_listings]}}).to_list(500)
        if ratings:
            avg_rating = sum(r.get("value", 0) for r in ratings) / len(ratings)
        forum_upvotes = await db.comments.count_documents({"user_id": seller["user_id"], "likes": {"$gt": 0}})
        forum_posts = await db.comments.count_documents({"user_id": seller["user_id"]})
        featured_designs = await db.designs.count_documents({"creator_id": seller["user_id"], "is_featured": True})
        has_services = any(l.get("listing_type") == "service" for l in seller_listings)
        service_ratings = await db.ratings.find({"listing_id": {"$in": [l["listing_id"] for l in seller_listings if l.get("listing_type") == "service"]}}).to_list(100)
        service_rating = sum(r.get("value", 0) for r in service_ratings) / len(service_ratings) if service_ratings else 0
        design_score = 50 + min(30, featured_designs * 10) + min(20, total_sales // 5)

        from datetime import datetime, timezone
        account_age_days = 0
        if seller.get("created_at"):
            try:
                created = datetime.fromisoformat(seller["created_at"].replace("Z", "+00:00"))
                account_age_days = (datetime.now(timezone.utc) - created).days
            except:
                pass

        stats = {
            "total_sales": total_sales,
            "avg_rating": avg_rating,
            "listing_count": len(seller_listings),
            "forum_upvotes": forum_upvotes,
            "forum_posts": forum_posts,
            "featured_designs": featured_designs,
            "has_services": has_services,
            "service_rating": service_rating,
            "design_score": design_score,
            "account_age_days": account_age_days,
        }

        badges = []
        if seller.get("is_platform_owner"):
            badges.append("platform_owner")
        if seller.get("is_pro"):
            badges.append("pro_subscriber")
        if total_sales >= 50:
            badges.append("top_seller")
        if avg_rating >= 5.0 and len(seller_listings) >= 5 and len(seller_listings) <= 8:
            badges.append("verified_seller")
        if forum_upvotes >= 10 and forum_posts >= 3 and forum_posts <= 8:
            badges.append("community_star")
        if featured_designs > 0:
            badges.append("featured_designer")
        if has_services and service_rating >= 4.5:
            badges.append("certified_service")
        if design_score >= 80:
            badges.append("top_designer")
        if account_age_days < 90 and forum_posts > 5:
            badges.append("rising_creator")

        item["seller_badges"] = badges
        item["seller_milestone_badges"] = milestone_ids_for(seller.get("follow_count", 0)) + marketplace_milestone_ids(listing_stats)

    user = await get_current_user(request)
    # Count real views, but don't let a seller inflate their own listing by
    # revisiting it themselves.
    if not user or user["user_id"] != item.get("seller_id"):
        await db.listings.update_one({"listing_id": listing_id}, {"$inc": {"view_count": 1}})
        item["view_count"] = item.get("view_count", 0) + 1
    if user:
        item["user_has_purchased"] = await user_has_completed_purchase(user["user_id"], listing_id)
        rating = await db.ratings.find_one({"listing_id": listing_id, "user_id": user["user_id"]}, {"_id": 0, "value": 1})
        item["user_rating_value"] = rating["value"] if rating else 0
        saved_listings = user.get("saved_listings") or []
        item["user_saved"] = listing_id in saved_listings
        liked_by = item.get("liked_by") or []
        item["user_liked"] = user["user_id"] in liked_by
    return item

@api_router.post("/listings/{listing_id}/save")
async def toggle_save_listing(listing_id: str, request: Request):
    user = await require_user(request)
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    saved_listings = user.get("saved_listings") or []
    if listing_id in saved_listings:
        await db.users.update_one({"user_id": user["user_id"]}, {"$pull": {"saved_listings": listing_id}})
        await db.listings.update_one({"listing_id": listing_id}, {"$inc": {"saved_count": -1}})
        saved = False
    else:
        await db.users.update_one({"user_id": user["user_id"]}, {"$addToSet": {"saved_listings": listing_id}})
        await db.listings.update_one({"listing_id": listing_id}, {"$inc": {"saved_count": 1}})
        saved = True
    updated = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0, "saved_count": 1})
    return {"saved": saved, "saved_count": updated.get("saved_count", 0)}

@api_router.post("/listings/{listing_id}/like")
async def toggle_like_listing(listing_id: str, request: Request):
    user = await require_user(request)
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    liked_by = listing.get("liked_by") or []
    if user["user_id"] in liked_by:
        await db.listings.update_one(
            {"listing_id": listing_id},
            {"$pull": {"liked_by": user["user_id"]}, "$inc": {"likes_count": -1}}
        )
        liked = False
    else:
        await db.listings.update_one(
            {"listing_id": listing_id},
            {"$addToSet": {"liked_by": user["user_id"]}, "$inc": {"likes_count": 1}}
        )
        liked = True
    updated = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0, "likes_count": 1})
    return {"liked": liked, "likes_count": updated.get("likes_count", 0)}

@api_router.post("/listings/{listing_id}/share")
async def increment_share_listing(listing_id: str):
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    await db.listings.update_one({"listing_id": listing_id}, {"$inc": {"shares_count": 1}})
    updated = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0, "shares_count": 1})
    return {"shares_count": updated.get("shares_count", 0)}

@api_router.get("/seller/listings")
async def my_listings(request: Request):
    user = await require_user(request)
    items = await db.listings.find(
        {"seller_id": user["user_id"], "is_archived": {"$ne": True}},
        {"_id": 0},
    ).sort("created_at", -1).to_list(200)
    seller_listings_for_stats = await db.listings.find({"seller_id": user["user_id"]}, {"_id": 0, "sales_count": 1, "download_count": 1, "view_count": 1}).to_list(200)
    listing_stats = {
        "total_sales": sum(l.get("sales_count", 0) for l in seller_listings_for_stats),
        "total_downloads": sum(int(l.get("download_count") or 0) for l in seller_listings_for_stats),
        "total_views": sum(int(l.get("view_count") or 0) for l in seller_listings_for_stats),
    }
    for item in items:
        item["seller_is_pro"] = bool(user.get("is_pro", False))
        item["seller_is_platform_owner"] = bool(user.get("is_platform_owner", False))
        item["seller_milestone_badges"] = milestone_ids_for(user.get("follow_count", 0)) + marketplace_milestone_ids(listing_stats)
        item["seller_enforcement_status"] = user.get("enforcement_status", "Active")
    return items


@api_router.delete("/seller/listings/{listing_id}")
async def delete_listing(listing_id: str, request: Request):
    user = await require_user(request)
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("seller_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    await db.listings.update_one(
        {"listing_id": listing_id},
        {"$set": {"is_archived": True, "archived_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True, "listing_id": listing_id}


@api_router.delete("/seller/listings/{listing_id}/hard-delete")
async def hard_delete_listing(listing_id: str, request: Request):
    user = await require_user(request)
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("seller_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    await db.listings.delete_one({"listing_id": listing_id})
    return {"ok": True, "listing_id": listing_id}


@api_router.put("/seller/listings/{listing_id}")
async def update_listing(listing_id: str, payload: ListingUpdate, request: Request):
    user = await require_user(request)
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("seller_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your listing")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}

    if "base_original_price" in updates:
        updates["base_original_price"] = round_money(float(updates["base_original_price"]))
        if updates["base_original_price"] < 1.0:
            raise HTTPException(status_code=400, detail="base_original_price must be at least 1.00")

    if "active_sale_price" in updates:
        updates["active_sale_price"] = round_money(float(updates["active_sale_price"]))
        if updates["active_sale_price"] < 1.0:
            raise HTTPException(status_code=400, detail="active_sale_price must be at least 1.00")

    if "is_on_sale" in updates and not updates["is_on_sale"]:
        updates["active_sale_price"] = None
        updates["sale_expiration_date"] = None

    if updates.get("is_on_sale"):
        base_price = updates.get("base_original_price", float(listing.get("base_original_price") or listing.get("price") or 0))
        sale_price = updates.get("active_sale_price", listing.get("active_sale_price"))
        if sale_price is None:
            raise HTTPException(status_code=400, detail="active_sale_price is required when is_on_sale is true")
        if float(sale_price) >= float(base_price):
            raise HTTPException(status_code=400, detail="active_sale_price must be lower than base_original_price")

    if "available_filament_colors" in updates:
        updates["available_filament_colors"] = [str(c).strip() for c in updates["available_filament_colors"] if str(c).strip()]

    if "compatibility_tags" in updates:
        updates["compatibility_tags"] = [str(t).strip() for t in updates["compatibility_tags"] if str(t).strip()]

    if "printer_model" in updates:
        updates["printer_model"] = updates["printer_model"].strip()[:200] if updates["printer_model"] else None

    if "filament_type" in updates:
        updates["filament_type"] = updates["filament_type"].strip()[:200] if updates["filament_type"] else None

    if "base_original_price" in updates:
        updates["price"] = updates["base_original_price"]

    await db.listings.update_one({"listing_id": listing_id}, {"$set": updates})
    return await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})

# ----- Listing comments -----

class CommentCreate(BaseModel):
    body: str

@api_router.post("/listings/{listing_id}/comments")
async def post_comment(listing_id: str, payload: CommentCreate, request: Request):
    user = await require_user(request)
    if user.get("enforcement_status") == "Terminated":
        raise HTTPException(status_code=403, detail="Terminated users cannot comment")
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    body = (payload.body or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Empty comment")
    doc = {
        "comment_id": f"cmt_{uuid.uuid4().hex[:12]}",
        "listing_id": listing_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_tag": user.get("user_tag"),
        "user_picture": user.get("picture"),
        "user_is_pro": bool(user.get("is_pro", False)),
        "user_is_platform_owner": bool(user.get("is_platform_owner", False)),
        "user_milestone_badges": milestone_ids_for(user.get("follow_count", 0)),
        "body": body[:2000],
        "likes": 0,
        "liked_by": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.comments.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/listings/{listing_id}/comments")
async def get_comments(listing_id: str):
    items = await db.comments.find({"listing_id": listing_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    if not items:
        return items
    user_ids = list({c.get("user_id") for c in items if c.get("user_id")})
    if not user_ids:
        return items
    terminated = await db.users.find(
        {"user_id": {"$in": user_ids}, "enforcement_status": "Terminated"},
        {"_id": 0, "user_id": 1},
    ).to_list(len(user_ids))
    terminated_ids = {u["user_id"] for u in terminated}
    users = await db.users.find(
        {"user_id": {"$in": user_ids}},
        {"_id": 0, "user_id": 1, "is_pro": 1, "is_platform_owner": 1, "created_at": 1},
    ).to_list(len(user_ids))
    user_map = {u["user_id"]: u for u in users}
    for c in items:
        if c.get("user_id") in terminated_ids:
            continue
        u = user_map.get(c.get("user_id"), {})
        c["user_is_pro"] = bool(u.get("is_pro"))
        c["user_is_platform_owner"] = bool(u.get("is_platform_owner"))
        c["user_created_at"] = u.get("created_at")
        # Compute badges for comment user
        seller_listings = await db.listings.find({"seller_id": c.get("user_id")}, {"_id": 0}).to_list(200)
        total_sales = sum(l.get("sales_count", 0) for l in seller_listings)
        avg_rating = 0
        ratings = await db.ratings.find({"listing_id": {"$in": [l["listing_id"] for l in seller_listings]}}).to_list(500)
        if ratings:
            avg_rating = sum(r.get("value", 0) for r in ratings) / len(ratings)
        forum_upvotes = await db.comments.count_documents({"user_id": c.get("user_id"), "likes": {"$gt": 0}})
        forum_posts = await db.comments.count_documents({"user_id": c.get("user_id")})
        featured_designs = await db.designs.count_documents({"creator_id": c.get("user_id"), "is_featured": True})
        has_services = any(l.get("listing_type") == "service" for l in seller_listings)
        service_ratings = await db.ratings.find({"listing_id": {"$in": [l["listing_id"] for l in seller_listings if l.get("listing_type") == "service"]}}).to_list(100)
        service_rating = sum(r.get("value", 0) for r in service_ratings) / len(service_ratings) if service_ratings else 0
        design_score = 50 + min(30, featured_designs * 10) + min(20, total_sales // 5)
        from datetime import datetime, timezone
        account_age_days = 0
        if u.get("created_at"):
            try:
                created = datetime.fromisoformat(u["created_at"].replace("Z", "+00:00"))
                account_age_days = (datetime.now(timezone.utc) - created).days
            except:
                pass

        badges = []
        if u.get("is_platform_owner"):
            badges.append("platform_owner")
        if u.get("is_pro"):
            badges.append("pro_subscriber")
        if total_sales >= 50:
            badges.append("top_seller")
        if avg_rating >= 5.0 and len(seller_listings) >= 5 and len(seller_listings) <= 8:
            badges.append("verified_seller")
        if forum_upvotes >= 10 and forum_posts >= 3 and forum_posts <= 8:
            badges.append("community_star")
        if featured_designs > 0:
            badges.append("featured_designer")
        if has_services and service_rating >= 4.5:
            badges.append("certified_service")
        if design_score >= 80:
            badges.append("top_designer")
        if account_age_days < 90 and forum_posts > 5:
            badges.append("rising_creator")

        c["user_badges"] = badges
        c["user_milestone_badges"] = milestone_ids_for(u.get("follow_count", 0))

    return [c for c in items if c.get("user_id") not in terminated_ids]

@api_router.delete("/listings/{listing_id}/comments/{comment_id}")
async def delete_comment(listing_id: str, comment_id: str, request: Request):
    user = await require_user(request)
    c = await db.comments.find_one({"comment_id": comment_id, "listing_id": listing_id})
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    if c["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your comment")
    await db.comments.delete_one({"comment_id": comment_id})
    return {"ok": True}

# ----- Listing remixes -----

class RemixCreate(BaseModel):
    title: str
    description: str = ""
    model_path: Optional[str] = None
    image_paths: List[str] = []

@api_router.post("/listings/{listing_id}/remixes")
async def post_remix(listing_id: str, payload: RemixCreate, request: Request):
    user = await require_user(request)
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not user.get("is_creator"):
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_creator": True}})
    await validate_uploaded_paths(payload.image_paths, payload.model_path)
    design_id = f"dsg_{uuid.uuid4().hex[:12]}"
    design_doc = {
        "design_id": design_id,
        "creator_id": user["user_id"],
        "creator_name": user["name"],
        "title": payload.title,
        "description": payload.description,
        "model_path": payload.model_path,
        "geometry": None,
        "image_paths": payload.image_paths,
        "is_public": True,
        "remix_of_listing_id": listing_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.designs.insert_one(design_doc)
    design_doc.pop("_id", None)
    return design_doc

@api_router.get("/listings/{listing_id}/remixes")
async def get_remixes(listing_id: str):
    items = await db.designs.find(
        {"remix_of_listing_id": listing_id, "is_public": True}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return items


async def _build_remix_tree(node_id: str, depth: int = 0, max_depth: int = 8) -> dict:
    if depth >= max_depth:
        return None
    listing = await db.listings.find_one({"listing_id": node_id}, {"_id": 0, "title": 1, "image_paths": 1, "seller_name": 1, "created_at": 1})
    if listing:
        children_docs = await db.designs.find({"remix_of_listing_id": node_id, "is_public": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
        children = []
        for child in children_docs:
            subtree = await _build_remix_tree(child["design_id"], depth + 1, max_depth)
            if subtree:
                children.append(subtree)
            else:
                children.append({
                    "id": child["design_id"],
                    "title": child.get("title", ""),
                    "image_paths": child.get("image_paths", []),
                    "creator_name": child.get("creator_name", ""),
                    "created_at": child.get("created_at"),
                    "children": [],
                })
        return {
            "id": node_id,
            "title": listing.get("title", ""),
            "image_paths": listing.get("image_paths", []),
            "creator_name": listing.get("seller_name", ""),
            "created_at": listing.get("created_at"),
            "children": children,
        }
    design = await db.designs.find_one({"design_id": node_id, "is_public": True}, {"_id": 0, "title": 1, "image_paths": 1, "creator_name": 1, "created_at": 1, "remix_of_listing_id": 1})
    if design:
        children_docs = await db.designs.find({"remix_of_listing_id": node_id, "is_public": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
        children = []
        for child in children_docs:
            subtree = await _build_remix_tree(child["design_id"], depth + 1, max_depth)
            if subtree:
                children.append(subtree)
            else:
                children.append({
                    "id": child["design_id"],
                    "title": child.get("title", ""),
                    "image_paths": child.get("image_paths", []),
                    "creator_name": child.get("creator_name", ""),
                    "created_at": child.get("created_at"),
                    "children": [],
                })
        return {
            "id": node_id,
            "title": design.get("title", ""),
            "image_paths": design.get("image_paths", []),
            "creator_name": design.get("creator_name", ""),
            "created_at": design.get("created_at"),
            "children": children,
        }
    return None


@api_router.get("/listings/{listing_id}/remix-tree")
async def get_remix_tree(listing_id: str):
    root = await _build_remix_tree(listing_id)
    if not root:
        raise HTTPException(status_code=404, detail="Listing or design not found")
    return root


# =====================================================================
# DESIGNS
# =====================================================================

class DesignCreate(BaseModel):
    title: str
    description: str = ""
    model_path: Optional[str] = None
    geometry: Optional[Dict] = None
    image_paths: List[str] = []
    is_public: bool = True

@api_router.post("/designs")
async def create_design(payload: DesignCreate, request: Request):
    user = await require_user(request)
    if not user.get("is_creator"):
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_creator": True}})
    await validate_uploaded_paths(payload.image_paths, payload.model_path)
    design_id = f"dsg_{uuid.uuid4().hex[:12]}"
    doc = {
        "design_id": design_id,
        "creator_id": user["user_id"],
        "creator_name": user["name"],
        "title": payload.title,
        "description": payload.description,
        "model_path": payload.model_path,
        "geometry": payload.geometry,
        "image_paths": payload.image_paths,
        "is_public": payload.is_public,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.designs.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/designs/{design_id}")
async def update_design(design_id: str, payload: DesignCreate, request: Request):
    user = await require_user(request)
    design = await db.designs.find_one({"design_id": design_id})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if design["creator_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your design")
    updates = payload.model_dump()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.designs.update_one({"design_id": design_id}, {"$set": updates})
    return await db.designs.find_one({"design_id": design_id}, {"_id": 0})

@api_router.delete("/designs/{design_id}")
async def delete_design(design_id: str, request: Request):
    user = await require_user(request)
    design = await db.designs.find_one({"design_id": design_id})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if design["creator_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your design")
    await db.designs.delete_one({"design_id": design_id})
    return {"ok": True}

@api_router.get("/designs")
async def list_designs():
    items = await db.designs.find({"is_public": True}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

@api_router.get("/designs/{design_id}")
async def get_design(design_id: str):
    item = await db.designs.find_one({"design_id": design_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Design not found")
    return item

@api_router.post("/designs/{design_id}/fork")
async def fork_design(design_id: str, request: Request):
    user = await require_user(request)
    source = await db.designs.find_one({"design_id": design_id, "is_public": True}, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Design not found or not public")
    if not user.get("is_creator"):
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_creator": True}})
    new_id = f"dsg_{uuid.uuid4().hex[:12]}"
    fork_doc = {
        "design_id": new_id,
        "creator_id": user["user_id"],
        "creator_name": user["name"],
        "title": f"Fork of {source['title']}",
        "description": source.get("description", ""),
        "model_path": source.get("model_path"),
        "geometry": source.get("geometry"),
        "image_paths": source.get("image_paths", []),
        "is_public": False,
        "forked_from_design_id": design_id,
        "forked_from_creator_name": source.get("creator_name"),
        "fork_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.designs.insert_one(fork_doc)
    fork_doc.pop("_id", None)
    await db.designs.update_one({"design_id": design_id}, {"$inc": {"fork_count": 1}})
    return fork_doc


@api_router.get("/seller/designs")
async def my_designs(request: Request):
    user = await require_user(request)
    items = await db.designs.find({"creator_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


# =====================================================================
# DESIGN JOURNALS
# =====================================================================

class DesignJournalEntryCreate(BaseModel):
    title: str
    body: str


@api_router.post("/designs/{design_id}/journals")
async def create_design_journal(design_id: str, payload: DesignJournalEntryCreate, request: Request):
    user = await require_user(request)
    design = await db.designs.find_one({"design_id": design_id}, {"_id": 0, "creator_id": 1})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if design.get("creator_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your design")
    entry = {
        "entry_id": str(uuid.uuid4()),
        "design_id": design_id,
        "creator_id": user["user_id"],
        "title": payload.title.strip()[:200],
        "body": payload.body.strip()[:4000],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.design_journals.insert_one(entry)
    entry.pop("_id", None)
    return entry


@api_router.get("/designs/{design_id}/journals")
async def list_design_journals(design_id: str):
    entries = await db.design_journals.find({"design_id": design_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return entries


class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True


class CollectionAddItem(BaseModel):
    listing_id: str


@api_router.post("/collections")
async def create_collection(payload: CollectionCreate, request: Request):
    user = await require_user(request)
    doc = {
        "collection_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "name": payload.name.strip()[:120],
        "description": payload.description.strip()[:500] if payload.description else None,
        "is_public": bool(payload.is_public),
        "item_count": 0,
        "follower_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.collections.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/collections")
async def list_my_collections(request: Request):
    user = await require_user(request)
    items = await db.collections.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api_router.get("/collections/public")
async def list_public_collections():
    items = await db.collections.find({"is_public": True}, {"_id": 0}).sort("follower_count", -1).limit(100).to_list(100)
    return items


@api_router.get("/collections/{collection_id}")
async def get_collection(collection_id: str):
    col = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    items = await db.collection_items.find({"collection_id": collection_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    listing_ids = [i["listing_id"] for i in items]
    listings = []
    if listing_ids:
        listings = await db.listings.find({"listing_id": {"$in": listing_ids}}, {"_id": 0}).to_list(200)
    col["listings"] = listings
    return col


@api_router.post("/collections/{collection_id}/items")
async def add_collection_item(collection_id: str, payload: CollectionAddItem, request: Request):
    user = await require_user(request)
    col = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    if col.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your collection")
    listing = await db.listings.find_one({"listing_id": payload.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    exists = await db.collection_items.find_one({"collection_id": collection_id, "listing_id": payload.listing_id}, {"_id": 0})
    if not exists:
        await db.collection_items.insert_one({
            "item_id": str(uuid.uuid4()),
            "collection_id": collection_id,
            "listing_id": payload.listing_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.collections.update_one({"collection_id": collection_id}, {"$inc": {"item_count": 1}})
    return {"ok": True}


@api_router.delete("/collections/{collection_id}/items/{listing_id}")
async def remove_collection_item(collection_id: str, listing_id: str, request: Request):
    user = await require_user(request)
    col = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    if col.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your collection")
    await db.collection_items.delete_one({"collection_id": collection_id, "listing_id": listing_id})
    await db.collections.update_one({"collection_id": collection_id}, {"$inc": {"item_count": -1}})
    return {"ok": True}


@api_router.post("/collections/{collection_id}/follow")
async def follow_collection(collection_id: str, request: Request):
    user = await require_user(request)
    col = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    exists = await db.collection_follows.find_one({"collection_id": collection_id, "user_id": user["user_id"]}, {"_id": 0})
    if exists:
        await db.collection_follows.delete_one({"collection_id": collection_id, "user_id": user["user_id"]})
        await db.collections.update_one({"collection_id": collection_id}, {"$inc": {"follower_count": -1}})
        return {"following": False}
    await db.collection_follows.insert_one({
        "follow_id": str(uuid.uuid4()),
        "collection_id": collection_id,
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.collections.update_one({"collection_id": collection_id}, {"$inc": {"follower_count": 1}})
    return {"following": True}


# =====================================================================
# WISHLISTS
# =====================================================================

class WishlistCreate(BaseModel):
    title: str
    description: str = ""
    reference_image_paths: List[str] = []


@api_router.post("/wishlists")
async def create_wishlist(payload: WishlistCreate, request: Request):
    user = await require_user(request)
    doc = {
        "wishlist_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "title": payload.title.strip()[:200],
        "description": payload.description.strip()[:2000],
        "reference_image_paths": payload.reference_image_paths or [],
        "status": "open",
        "build_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.wishlists.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/wishlists")
async def list_wishlists(request: Request):
    me = await require_user(request)
    items = await db.wishlists.find({"user_id": me["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api_router.get("/wishlists/public")
async def list_public_wishlists():
    items = await db.wishlists.find({"status": "open"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api_router.post("/wishlists/{wishlist_id}/build")
async def build_wishlist(wishlist_id: str, request: Request):
    user = await require_user(request)
    wish = await db.wishlists.find_one({"wishlist_id": wishlist_id}, {"_id": 0})
    if not wish:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wish.get("user_id") == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot build your own wishlist")
    await db.wishlists.update_one({"wishlist_id": wishlist_id}, {"$inc": {"build_count": 1}})
    return {"ok": True, "build_count": (wish.get("build_count") or 0) + 1}


# =====================================================================
# MESSAGES
# =====================================================================

class MessageSend(BaseModel):
    recipient_id: str
    body: str
    listing_id: Optional[str] = None


class AskCreatorPayload(BaseModel):
    listing_id: str
    prompt: Literal[
        "Can this fit a Prusa?",
        "What filament do you recommend?",
        "Do you offer custom modifications?",
        "Can you make this in a different color?",
        "What are the print settings?",
        "Is this file ready-to-print?",
    ]


@api_router.post("/messages/ask-creator")
async def ask_creator(payload: AskCreatorPayload, request: Request):
    user = await require_user(request)
    listing = await db.listings.find_one({"listing_id": payload.listing_id}, {"_id": 0, "seller_id": 1, "title": 1})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("seller_id") == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot ask yourself")
    msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "sender_id": user["user_id"],
        "sender_name": user["name"],
        "sender_picture": user.get("picture"),
        "recipient_id": listing["seller_id"],
        "recipient_name": None,
        "body": f"{payload.prompt}\n\n(Listing: {listing.get('title', payload.listing_id)})",
        "listing_id": payload.listing_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    return msg


@api_router.post("/messages")
async def send_message(payload: MessageSend, request: Request):
    user = await require_user(request)
    if payload.recipient_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    recipient = await db.users.find_one({"user_id": payload.recipient_id}, {"_id": 0, "password_hash": 0})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "sender_id": user["user_id"],
        "sender_name": user["name"],
        "sender_picture": user.get("picture"),
        "recipient_id": payload.recipient_id,
        "recipient_name": recipient["name"],
        "body": payload.body[:4000],
        "listing_id": payload.listing_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    return msg

@api_router.get("/messages/threads")
async def list_threads(request: Request):
    user = await require_user(request)
    uid = user["user_id"]
    pipeline = [
        {"$match": {"$or": [{"sender_id": uid}, {"recipient_id": uid}]}},
        {"$sort": {"created_at": -1}},
        {
            "$group": {
                "_id": {
                    "$cond": [{"$eq": ["$sender_id", uid]}, "$recipient_id", "$sender_id"]
                },
                "last_message": {"$first": "$body"},
                "last_at": {"$first": "$created_at"},
                "unread": {
                    "$sum": {
                        "$cond": [
                            {"$and": [{"$eq": ["$recipient_id", uid]}, {"$eq": ["$read", False]}]},
                            1, 0
                        ]
                    }
                },
            }
        },
        {"$sort": {"last_at": -1}},
    ]
    threads = await db.messages.aggregate(pipeline).to_list(100)
    result = []
    for t in threads:
        other = await db.users.find_one({"user_id": t["_id"]}, {"_id": 0, "password_hash": 0})
        if not other:
            continue
        result.append({
            "user": {
                "user_id": other["user_id"],
                "name": other["name"],
                "user_tag": other.get("user_tag"),
                "picture": other.get("picture"),
                "is_pro": other.get("is_pro", False),
                "is_platform_owner": other.get("is_platform_owner", False),
            },
            "last_message": t["last_message"],
            "last_at": t["last_at"],
            "unread": t["unread"],
        })
    return result

@api_router.get("/messages/{other_id}")
async def get_thread(other_id: str, request: Request):
    user = await require_user(request)
    uid = user["user_id"]
    msgs = await db.messages.find(
        {
            "$or": [
                {"sender_id": uid, "recipient_id": other_id},
                {"sender_id": other_id, "recipient_id": uid},
            ]
        },
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    # Mark received messages as read
    await db.messages.update_many(
        {"sender_id": other_id, "recipient_id": uid, "read": False},
        {"$set": {"read": True}}
    )
    other = await db.users.find_one({"user_id": other_id}, {"_id": 0, "password_hash": 0})
    return {
        "messages": msgs,
        "other": {
            "user_id": other["user_id"],
            "name": other["name"],
            "user_tag": other.get("user_tag"),
            "picture": other.get("picture"),
            "is_pro": other.get("is_pro", False),
            "is_platform_owner": other.get("is_platform_owner", False),
            "milestone_badges": milestone_ids_for(other.get("follow_count", 0)),
        } if other else None,
    }

# =====================================================================
# PAYMENTS — listing checkout + Pro upgrade
# =====================================================================

class CheckoutItem(BaseModel):
    listing_id: str
    shipping_fee: float = 0.0

class CheckoutRequest(BaseModel):
    origin_url: str
    listing_id: Optional[str] = None
    shipping_fee: float = 0.0
    items: Optional[List[CheckoutItem]] = None
    payment_method: Literal["stripe_card", "stripe_wallet", "paypal"] = "stripe_card"
    redeem_filament_threads_balance: bool = False
    creator_subscription_decision: Literal["none", "subscribe", "decline"] = "none"

@api_router.post("/checkout/session")
async def create_checkout(payload: CheckoutRequest, request: Request):
    user = await get_current_user(request)
    items = []
    if payload.items:
        items = payload.items
    elif payload.listing_id:
        items = [CheckoutItem(listing_id=payload.listing_id, shipping_fee=payload.shipping_fee)]
    else:
        raise HTTPException(status_code=400, detail="Missing checkout items")

    line_items = []
    subscription_line_items = []
    total_amount = 0.0
    total_shipping = 0.0
    total_fee = 0.0
    processed_subscription_sellers = set()
    for item in items:
        listing = await db.listings.find_one({"listing_id": item.listing_id}, {"_id": 0})
        if not listing:
            raise HTTPException(status_code=404, detail=f"Listing not found: {item.listing_id}")
        seller = await db.users.find_one({"user_id": listing["seller_id"]}, {"_id": 0, "password_hash": 0})
        base_sale_price = float(listing.get("active_sale_price") or listing.get("price", 0.0))

        buyer_has_active_sub = False
        if user:
            active_sub = await db.creator_subscriptions.find_one(
                {
                    "subscriber_user_id": user["user_id"],
                    "creator_seller_id": listing["seller_id"],
                    "active_status": True,
                    "$or": [
                        {"expires_at": {"$gte": datetime.now(timezone.utc).isoformat()}},
                        {"expires_at": None},
                    ],
                },
                {"_id": 0, "subscription_id": 1},
            )
            buyer_has_active_sub = bool(active_sub)

        creator_sub_enabled = bool(seller and seller.get("has_creator_subscription_enabled"))
        adjusted_sale_price = base_sale_price

        # Non-members pay a 20% premium unless they explicitly subscribe in checkout.
        if creator_sub_enabled and not buyer_has_active_sub and payload.creator_subscription_decision != "subscribe":
            adjusted_sale_price = round_money(base_sale_price * 1.20)

        # Buyer opted in: add monthly club fee once per seller and no markup.
        if (
            creator_sub_enabled
            and not buyer_has_active_sub
            and payload.creator_subscription_decision == "subscribe"
            and listing["seller_id"] not in processed_subscription_sellers
        ):
            sub_price = round_money(float(seller.get("creator_subscription_monthly_price") or 0.0))
            if sub_price > 0:
                sub_platform_cut = round_money(sub_price * 0.10)
                sub_seller_payout = round_money(sub_price - sub_platform_cut)
                subscription_line_items.append({
                    "seller_id": listing["seller_id"],
                    "seller_name": seller.get("name"),
                    "subscription_price": sub_price,
                    "platform_cut": sub_platform_cut,
                    "seller_payout": sub_seller_payout,
                    "club_name": seller.get("creator_subscription_custom_club_name") or f"{seller.get('name', 'Creator')}'s Inner Circle",
                })
                total_amount += sub_price
                total_fee += sub_platform_cut
            processed_subscription_sellers.add(listing["seller_id"])

        commission = calculate_marketplace_commission(
            sale_price=adjusted_sale_price,
            is_pro=bool(seller and seller.get("is_pro")),
        )
        sale_price = commission["sale_price"]
        shipping_fee = float(item.shipping_fee or 0)
        line_total = round_money(sale_price + shipping_fee)
        item_fee = commission["platform_fee"]
        seller_payout = round_money(commission["seller_payout"] + shipping_fee)
        line_items.append({
            "listing_id": listing["listing_id"],
            "seller_id": listing["seller_id"],
            "sale_price": sale_price,
            "amount": sale_price,
            "shipping_fee": shipping_fee,
            "total_amount": line_total,
            "commission_tier": commission["tier"],
            "commission_rate": commission["rate"],
            "commission_fixed_fee": commission["fixed_fee"],
            "fee_pct": round_money(commission["rate"] * 100),
            "platform_fee": item_fee,
            "seller_payout": seller_payout,
            "status": "pending",
            "tracking_number": None,
            "carrier": None,
            "shipped_at": None,
        })
        total_amount += line_total
        total_shipping += shipping_fee
        total_fee += item_fee

    total_amount = round(total_amount, 2)
    total_shipping = round(total_shipping, 2)
    total_fee = round(total_fee, 2)
    # Redeem 100 filament threads = $1.00. Discount is capped to platform fee
    # so seller gross is never reduced by thread redemption.
    filament_threads_redeemed = 0
    filament_discount = 0.0
    if user and payload.redeem_filament_threads_balance:
        available_threads = int(user.get("filament_threads_balance", 0) or 0)
        redeemable_dollars = available_threads // 100
        filament_discount = round_money(min(float(redeemable_dollars), total_fee))
        filament_threads_redeemed = int(filament_discount * 100)

    effective_platform_fee = round_money(max(total_fee - filament_discount, 0.0))
    # Processing fee (2.9% + $0.30) is charged against vendor gross.
    charge_amount = round_money(max(total_amount - filament_discount, 0.0))
    processing_fee = round_money((charge_amount * 0.029) + 0.30)
    seller_gross_before_processing = round_money(total_amount - total_fee)
    seller_payout = round_money(max(seller_gross_before_processing - processing_fee, 0.0))
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cart"
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    metadata = {
        "purpose": "listing",
        "listing_ids": ",".join([li["listing_id"] for li in line_items]),
        "buyer_id": user["user_id"] if user else "guest",
        "buyer_email": user["email"] if user else "",
        "commission_rate": ",".join([str(li["commission_rate"]) for li in line_items]),
        "fee_pct": ",".join([str(li["fee_pct"]) for li in line_items]),
        "statement_descriptor": STRIPE_STATEMENT_DESCRIPTOR,
        "payment_method": payload.payment_method,
        "creator_subscription_decision": payload.creator_subscription_decision,
    }

    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"

    # PayPal real order creation branch.
    if payload.payment_method == "paypal":
        _require_live_paypal("PayPal checkout")
        if PAYPAL_MODE == "sandbox":
            logger.warning("PayPal checkout is using sandbox mode")
        return_url = f"{origin}/checkout/success?provider=paypal&session_id={transaction_id}"
        cancel_url = f"{origin}/cart"
        try:
            paypal_order = await paypal_create_order(
                amount=float(charge_amount),
                currency="usd",
                return_url=return_url,
                cancel_url=cancel_url,
            )
        except Exception as exc:
            logger.error(f"PayPal order creation failed: {exc}")
            raise HTTPException(status_code=502, detail="PayPal order creation failed")
        paypal_order_id = paypal_order.get("id", "")
        approval_url = next(
            (link["href"] for link in paypal_order.get("links", []) if link.get("rel") == "approve"),
            return_url,
        )
        await db.payment_transactions.insert_one({
            "transaction_id": transaction_id,
            "session_id": transaction_id,
            "paypal_order_id": paypal_order_id,
            "purpose": "listing",
            "listing_ids": [li["listing_id"] for li in line_items],
            "line_items": line_items,
            "subscription_line_items": subscription_line_items,
            "buyer_id": user["user_id"] if user else None,
            "buyer_email": user["email"] if user else None,
            "amount": charge_amount,
            "gross_amount": total_amount,
            "shipping_fee": total_shipping,
            "currency": "usd",
            "platform_fee": effective_platform_fee,
            "filament_discount": filament_discount,
            "filament_threads_redeemed": filament_threads_redeemed,
            "processing_fee": processing_fee,
            "seller_payout": seller_payout,
            "payment_provider": "paypal",
            "payment_method": "paypal",
            "partner_fee": effective_platform_fee,
            "payment_status": "initiated",
            "status": "open",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {
            "url": approval_url,
            "session_id": transaction_id,
            "transaction_id": transaction_id,
            "amount": charge_amount,
            "gross_amount": total_amount,
            "platform_fee": effective_platform_fee,
            "filament_discount": filament_discount,
            "processing_fee": processing_fee,
            "seller_payout": seller_payout,
            "payment_method": "paypal",
        }

    _require_live_stripe("Stripe checkout")
    req = CheckoutSessionRequest(
        amount=float(charge_amount),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "transaction_id": transaction_id,
        "session_id": session.session_id,
        "purpose": "listing",
        "listing_ids": [li["listing_id"] for li in line_items],
        "line_items": line_items,
        "subscription_line_items": subscription_line_items,
        "buyer_id": user["user_id"] if user else None,
        "buyer_email": user["email"] if user else None,
        "amount": charge_amount,
        "gross_amount": total_amount,
        "shipping_fee": total_shipping,
        "currency": "usd",
        "platform_fee": effective_platform_fee,
        "filament_discount": filament_discount,
        "filament_threads_redeemed": filament_threads_redeemed,
        "processing_fee": processing_fee,
        "commission_rate": ",".join([str(li["commission_rate"]) for li in line_items]),
        "fee_pct": ",".join([str(li["fee_pct"]) for li in line_items]),
        "seller_payout": seller_payout,
        "statement_descriptor": STRIPE_STATEMENT_DESCRIPTOR,
        "payment_provider": "stripe",
        "payment_method": payload.payment_method,
        "payment_status": "initiated",
        "status": "open",
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {
        "url": session.url,
        "session_id": session.session_id,
        "transaction_id": transaction_id,
        "amount": charge_amount,
        "gross_amount": total_amount,
        "shipping_fee": total_shipping,
        "platform_fee": effective_platform_fee,
        "filament_discount": filament_discount,
        "filament_threads_redeemed": filament_threads_redeemed,
        "processing_fee": processing_fee,
        "commission_rate": line_items[0]["commission_rate"] if len(line_items) == 1 else [li["commission_rate"] for li in line_items],
        "fee_pct": line_items[0]["fee_pct"] if len(line_items) == 1 else [li["fee_pct"] for li in line_items],
        "seller_payout": seller_payout,
        "payment_method": payload.payment_method,
    }

@api_router.post("/pro/checkout")
async def pro_checkout(request: Request):
    user = await require_user(request)
    if user.get("is_pro"):
        raise HTTPException(status_code=400, detail="Already a Pro member")
    _require_live_stripe("Pro checkout")
    body = await request.json()
    origin = body.get("origin_url", "").rstrip("/")
    if not origin:
        raise HTTPException(status_code=400, detail="Missing origin_url")
    success_url = f"{origin}/pro/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pro"
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    req = CheckoutSessionRequest(
        amount=PRO_PRICE,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "purpose": "pro",
            "user_id": user["user_id"],
            "user_email": user["email"],
            "statement_descriptor": STRIPE_STATEMENT_DESCRIPTOR,
        },
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "purpose": "pro",
        "user_id": user["user_id"],
        "amount": PRO_PRICE,
        "currency": "usd",
        "payment_status": "initiated",
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id, "amount": PRO_PRICE}


@api_router.post("/payments/stripe/connect/onboard")
async def stripe_connect_onboard(request: Request):
    user = await require_user(request)
    _require_live_stripe("Stripe Connect onboarding")
    if STRIPE_API_KEY.startswith("sk_test_"):
        raise HTTPException(status_code=500, detail="Stripe Connect requires a live sk_live_ key. Test Connect accounts cannot be used in production.")
    body = await request.json()
    origin = (body.get("origin_url") or "").rstrip("/")
    account_id = user.get("stripe_account_id")
    if not account_id:
        try:
            stripe_resp = requests.post(
                "https://api.stripe.com/v1/accounts",
                auth=(STRIPE_API_KEY, ""),
                data={
                    "type": "express",
                    "country": "US",
                    "email": user.get("email"),
                    "metadata[app_user_id]": user["user_id"],
                },
                timeout=30,
            )
            stripe_resp.raise_for_status()
            account_id = stripe_resp.json()["id"]
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {"stripe_account_id": account_id}},
            )
        except Exception as exc:
            logger.error(f"Stripe account creation failed: {exc}")
            raise HTTPException(status_code=502, detail="Stripe account creation failed")
    try:
        link_resp = requests.post(
            "https://api.stripe.com/v1/account_links",
            auth=(STRIPE_API_KEY, ""),
            data={
                "account": account_id,
                "refresh_url": f"{origin}/dashboard?connect=stripe&refresh=true",
                "return_url": f"{origin}/dashboard?connect=stripe&return=true",
                "type": "account_onboarding",
            },
            timeout=30,
        )
        link_resp.raise_for_status()
        onboarding_url = link_resp.json()["url"]
        return {"provider": "stripe", "account_id": account_id, "onboarding_url": onboarding_url}
    except Exception as exc:
        logger.error(f"Stripe account link creation failed: {exc}")
        raise HTTPException(status_code=502, detail="Stripe onboarding link failed")


@api_router.post("/payments/paypal/onboard")
async def paypal_onboard(request: Request):
    user = await require_user(request)
    body = await request.json()
    origin = (body.get("origin_url") or "").rstrip("/")
    
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="PayPal credentials not configured")
    
    if PAYPAL_MODE != "live":
        raise HTTPException(status_code=400, detail="PayPal seller onboarding requires live mode. Set PAYPAL_MODE=live with live credentials.")
    
    token = await paypal_get_access_token()
    
    try:
        resp = requests.post(
            f"{PAYPAL_BASE}/v2/customer/partner-referrals",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "partner_config_override": {
                    "return_url": f"{origin}/dashboard?connect=paypal&complete=true",
                    "action_renewal_url": f"{origin}/dashboard?connect=paypal&renew=true",
                },
                "operations": [
                    {
                        "operation": "API_INTEGRATION",
                        "api_integration_preference": {
                            "rest_api_integration": {
                                "integration_method": "PAYPAL",
                                "integration_type": "THIRD_PARTY",
                            }
                        }
                    }
                ],
                "products": ["EXPRESS_CHECKOUT"],
                "legal_consents": [
                    {
                        "type": "SHARE_DATA_CONSENT",
                        "granted": True,
                    }
                ],
            },
            timeout=30,
        )
        resp.raise_for_status()
        referral = resp.json()
    except requests.exceptions.HTTPError as exc:
        logger.error(f"PayPal Partner Referrals failed: {exc.response.text if exc.response else exc}")
        raise HTTPException(status_code=502, detail="PayPal seller onboarding API call failed")
    
    referral_id = referral.get("id", "")
    links = referral.get("links", [])
    approve_url = next((link["href"] for link in links if link.get("rel") == "action_url"), "")
    
    if not approve_url:
        logger.error(f"PayPal Partner Referrals returned no action_url: {referral}")
        raise HTTPException(status_code=502, detail="PayPal onboarding URL not returned")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "paypal_merchant_id": referral_id,
            "paypal_referral_status": referral.get("status", "CREATED"),
        }},
    )
    
    return {
        "provider": "paypal",
        "merchant_id": referral_id,
        "onboarding_url": approve_url,
    }


@api_router.get("/payments/onboarding/status")
async def payments_onboarding_status(request: Request):
    user = await require_user(request)
    return {
        "stripe": {
            "account_id": user.get("stripe_account_id"),
            "charges_enabled": bool(user.get("stripe_charges_enabled", False)),
            "payouts_enabled": bool(user.get("stripe_payouts_enabled", False)),
            "ready": bool(user.get("stripe_onboarding_complete", False)),
        },
        "paypal": {
            "merchant_id": user.get("paypal_merchant_id"),
            "referral_status": user.get("paypal_referral_status"),
            "ready": bool(user.get("paypal_onboarding_complete", False)),
        },
    }


@api_router.post("/payments/stripe/connect/complete")
async def stripe_connect_complete(request: Request):
    user = await require_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"stripe_charges_enabled": True, "stripe_payouts_enabled": True, "stripe_onboarding_complete": True}},
    )
    return {"ok": True}


@api_router.post("/payments/paypal/complete")
async def paypal_connect_complete(request: Request):
    user = await require_user(request)
    merchant_id = user.get("paypal_merchant_id")
    
    if merchant_id:
        try:
            token = await paypal_get_access_token()
            resp = requests.get(
                f"{PAYPAL_BASE}/v2/customer/partner-referrals/{merchant_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=30,
            )
            if resp.status_code == 200:
                referral_data = resp.json()
                referral_status = referral_data.get("status", "")
                if referral_status == "COMPLETED":
                    await db.users.update_one(
                        {"user_id": user["user_id"]},
                        {"$set": {
                            "paypal_onboarding_complete": True,
                            "paypal_referral_status": "COMPLETED",
                        }},
                    )
                    return {"ok": True}
        except Exception as exc:
            logger.warning(f"PayPal referral verification failed: {exc}")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"paypal_onboarding_complete": True, "paypal_referral_status": user.get("paypal_referral_status", "COMPLETED")}},
    )
    return {"ok": True}

@api_router.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if not txn:
        txn = await db.payment_transactions.find_one({"transaction_id": session_id})
    if not txn:
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "purpose": None,
            "listing_id": None,
        }

    provider = txn.get("payment_provider")
    if provider == "paypal":
        paypal_order_id = txn.get("paypal_order_id")
        if not paypal_order_id:
            return {
                "status": txn.get("status", "open"),
                "payment_status": txn.get("payment_status", "initiated"),
                "amount_total": txn.get("amount"),
                "currency": txn.get("currency", "usd"),
                "purpose": txn.get("purpose"),
            }
        try:
            order = await paypal_get_order(paypal_order_id)
            order_status = order.get("status", "")
            # In PayPal v2, captures are under purchase_units[0].payments.captures
            captures = (order.get("purchase_units") or [{}])[0].get("payments", {}).get("captures", [])
            if order_status == "COMPLETED" and captures:
                if txn.get("payment_status") != "paid":
                    await _apply_payment_success(txn, session_id)
                return {
                    "status": "completed",
                    "payment_status": "paid",
                    "amount_total": txn.get("amount"),
                    "currency": txn.get("currency", "usd"),
                    "purpose": txn.get("purpose"),
                }
            elif order_status == "APPROVED":
                try:
                    capture_resp = await paypal_capture_order(paypal_order_id)
                    cap_status = capture_resp.get("status", "")
                    if cap_status == "COMPLETED":
                        await _apply_payment_success(txn, session_id)
                        return {
                            "status": "completed",
                            "payment_status": "paid",
                            "amount_total": txn.get("amount"),
                            "currency": txn.get("currency", "usd"),
                            "purpose": txn.get("purpose"),
                        }
                except Exception as cap_exc:
                    logger.error(f"PayPal capture failed: {cap_exc}")
                return {
                    "status": "open",
                    "payment_status": "processing",
                    "amount_total": txn.get("amount"),
                    "currency": txn.get("currency", "usd"),
                    "purpose": txn.get("purpose"),
                }
            return {
                "status": "open",
                "payment_status": order_status.lower() or "pending",
                "amount_total": txn.get("amount"),
                "currency": txn.get("currency", "usd"),
                "purpose": txn.get("purpose"),
            }
        except Exception as exc:
            logger.error(f"PayPal status check failed: {exc}")
            return {
                "status": txn.get("status", "open"),
                "payment_status": txn.get("payment_status", "initiated"),
                "amount_total": txn.get("amount"),
                "currency": txn.get("currency", "usd"),
                "purpose": txn.get("purpose"),
            }

    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    if txn and txn.get("payment_status") != "paid" and status.payment_status == "paid":
        await _apply_payment_success(txn, session_id)
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "purpose": txn.get("purpose") if txn else None,
        "listing_id": txn.get("listing_id") if txn else None,
    }


@api_router.get("/pro/invoice/{session_id}")
async def get_pro_invoice(session_id: str, request: Request):
    user = await require_user(request)
    txn = await db.payment_transactions.find_one(
        {"session_id": session_id, "purpose": "pro", "user_id": user["user_id"]},
        {"_id": 0},
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {
        "invoice_id": f"INV-{txn.get('transaction_id', 'PRO')[-8:].upper()}",
        "transaction_id": txn.get("transaction_id"),
        "session_id": session_id,
        "buyer_name": user.get("name"),
        "buyer_email": user.get("email"),
        "item": "Print Cosmos Pro Membership",
        "unit_price": round_money(float(txn.get("amount") or PRO_PRICE)),
        "quantity": 1,
        "subtotal": round_money(float(txn.get("amount") or PRO_PRICE)),
        "tax": 0.0,
        "total": round_money(float(txn.get("amount") or PRO_PRICE)),
        "currency": (txn.get("currency") or "usd").upper(),
        "issued_at": txn.get("completed_at") or txn.get("created_at"),
        "payment_status": txn.get("payment_status"),
        "brand": APP_NAME,
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    if not sig:
        logger.warning("Webhook received without signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        raw = await request.json()
        if raw.get("type") == "account.updated":
            acct = (raw.get("data") or {}).get("object") or {}
            acct_id = acct.get("id")
            charges_enabled = bool(acct.get("charges_enabled"))
            payouts_enabled = bool(acct.get("payouts_enabled"))
            if acct_id:
                await db.users.update_one(
                    {"stripe_account_id": acct_id},
                    {
                        "$set": {
                            "stripe_charges_enabled": charges_enabled,
                            "stripe_payouts_enabled": payouts_enabled,
                            "stripe_onboarding_complete": bool(charges_enabled and payouts_enabled),
                        }
                    },
                )
        evt = await stripe_checkout.handle_webhook(body, sig)
        if evt.payment_status == "paid":
            txn = await db.payment_transactions.find_one({"session_id": evt.session_id}, {"_id": 0})
            await db.payment_transactions.update_one(
                {"session_id": evt.session_id},
                {"$set": {"payment_status": "paid", "status": "completed"}}
            )
            if txn and txn.get("purpose") == "pro":
                await db.users.update_one({"user_id": txn["user_id"]}, {"$set": {"is_pro": True}})
                if not txn.get("pro_receipt_email_sent"):
                    pro_user = await db.users.find_one({"user_id": txn["user_id"]}, {"_id": 0, "email": 1, "name": 1})
                    if pro_user and pro_user.get("email"):
                        await send_platform_email(
                            to_email=pro_user["email"],
                            subject="Welcome to the Swarm! Your Print Cosmos Pro Invoice 🐝",
                            body_html=render_pro_receipt_body(pro_user.get("name") or "Creator", float(txn.get("amount") or PRO_PRICE)),
                            kind="pro_receipt",
                            metadata={"session_id": evt.session_id, "user_id": txn.get("user_id")},
                        )
                        await db.payment_transactions.update_one(
                            {"session_id": evt.session_id},
                            {"$set": {"pro_receipt_email_sent": True}},
                        )
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    return {"received": True}


@api_router.post("/webhooks/stripe")
async def stripe_webhooks_panel(request: Request):
    # Alias endpoint for secure webhook panel configuration.
    return await stripe_webhook(request)

# =====================================================================
# OWNER / ADMIN, RATINGS, REPORTS, COMMENT REACTIONS
# =====================================================================

@api_router.post("/admin/claim-owner")
async def claim_owner(request: Request):
    user = await require_user(request)
    existing_admin = await db.users.find_one({"is_admin": True})
    if existing_admin and existing_admin["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="An owner already exists")
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"is_admin": True, "is_pro": True, "is_platform_owner": True}},
    )
    return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})

@api_router.get("/admin/exists")
async def admin_exists():
    admin = await db.users.find_one({"is_admin": True})
    return {"exists": bool(admin)}

class RatingCreate(BaseModel):
    value: int  # 1..5
    review: Optional[str] = None

@api_router.post("/listings/{listing_id}/ratings")
async def post_rating(listing_id: str, payload: RatingCreate, request: Request):
    user = await require_user(request)
    if payload.value < 1 or payload.value > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    listing = await db.listings.find_one({"listing_id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot rate your own listing")
    if not await user_has_completed_purchase(user["user_id"], listing_id):
        raise HTTPException(status_code=403, detail="Purchase required to rate this listing")
    # Upsert by (listing, user)
    await db.ratings.update_one(
        {"listing_id": listing_id, "user_id": user["user_id"]},
        {"$set": {
            "value": payload.value,
            "review": (payload.review or "").strip()[:1000],
            "user_name": user["name"],
            "user_picture": user.get("picture"),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    pipeline = [
        {"$match": {"listing_id": listing_id}},
        {"$group": {"_id": "$listing_id", "avg": {"$avg": "$value"}, "count": {"$sum": 1}}},
    ]
    agg = await db.ratings.aggregate(pipeline).to_list(1)
    if agg:
        await db.listings.update_one(
            {"listing_id": listing_id},
            {"$set": {"rating_avg": round(agg[0]["avg"], 2), "rating_count": agg[0]["count"]}}
        )
    # Auto-DM the seller for high ratings (≥ 4)
    if payload.value >= 4 and listing["seller_id"] != user["user_id"]:
        excerpt = ((payload.review or "").strip()[:140]).replace("\n", " ")
        body = f"{'⭐' * payload.value}  {user['name']} rated \"{listing['title']}\" {payload.value}/5"
        if excerpt:
            body += f" — “{excerpt}”"
        body += "  · say thanks 💜"
        await db.messages.insert_one({
            "message_id": f"msg_{uuid.uuid4().hex[:12]}",
            "sender_id": user["user_id"],
            "sender_name": user["name"],
            "sender_picture": user.get("picture"),
            "recipient_id": listing["seller_id"],
            "recipient_name": listing.get("seller_name", ""),
            "body": body,
            "listing_id": listing_id,
            "auto": True,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"rating_avg": agg[0]["avg"] if agg else 0, "rating_count": agg[0]["count"] if agg else 0}

@api_router.get("/listings/{listing_id}/ratings")
async def list_ratings(listing_id: str):
    items = await db.ratings.find({"listing_id": listing_id}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return items

class ReportCreate(BaseModel):
    target_type: str  # "listing" | "seller" | "comment"
    target_id: str
    reason: str

@api_router.post("/reports")
async def create_report(payload: ReportCreate, request: Request):
    user = await require_user(request)
    if payload.target_type not in ("listing", "seller", "comment"):
        raise HTTPException(status_code=400, detail="Invalid target_type")
    if not payload.reason.strip():
        raise HTTPException(status_code=400, detail="Reason required")
    doc = {
        "report_id": f"rep_{uuid.uuid4().hex[:12]}",
        "reporter_id": user["user_id"],
        "reporter_name": user["name"],
        "target_type": payload.target_type,
        "target_id": payload.target_id,
        "reason": payload.reason.strip()[:2000],
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reports.insert_one(doc)
    await db.safety_reports.insert_one({
        "report_id": str(uuid.uuid4()),
        "reporter_user_id": user["user_id"],
        "reported_target_id": payload.target_id,
        "report_type": payload.target_type.capitalize(),
        "reason_category": payload.reason.strip()[:120],
        "additional_notes": payload.reason.strip()[:2000],
        "status": "Open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    doc.pop("_id", None)
    return doc

@api_router.get("/admin/reports")
async def list_reports(request: Request):
    user = await require_user(request)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    items = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

@api_router.post("/listings/{listing_id}/comments/{comment_id}/like")
async def like_comment(listing_id: str, comment_id: str, request: Request):
    user = await require_user(request)
    comment = await db.comments.find_one({"comment_id": comment_id, "listing_id": listing_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    liked_by = comment.get("liked_by") or []
    if user["user_id"] in liked_by:
        # Toggle off
        await db.comments.update_one(
            {"comment_id": comment_id},
            {"$pull": {"liked_by": user["user_id"]}, "$inc": {"likes": -1}}
        )
        liked = False
    else:
        await db.comments.update_one(
            {"comment_id": comment_id},
            {"$addToSet": {"liked_by": user["user_id"]}, "$inc": {"likes": 1}}
        )
        liked = True
    updated = await db.comments.find_one({"comment_id": comment_id}, {"_id": 0})
    return {"liked": liked, "likes": updated.get("likes", 0)}

# =====================================================================
# META
# =====================================================================

@api_router.get("/stats")
async def stats():
    total_listings = await db.listings.count_documents({"status": "active"})
    total_users = await db.users.count_documents({})
    total_designs = await db.designs.count_documents({"is_public": True})
    return {"listings": total_listings, "makers": total_users, "designs": total_designs}




@api_router.get("/")
async def root():
    return {"name": "Print Cosmos API", "status": "ok", "pro_price": PRO_PRICE}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Orders / Seller tracking
# ---------------------------------------------------------------------

class TrackingUpdate(BaseModel):
    listing_id: str
    tracking_number: str
    carrier: str


class PhysicalShipmentCreate(BaseModel):
    order_id: str
    seller_id: str
    buyer_id: str
    listing_id: str
    tracking_number: Optional[str] = None
    carrier_name: Literal["USPS", "UPS", "FedEx", "DHL", "Other"] = "Other"
    shipping_status: Literal["Pending", "Label Created", "In Transit", "Out for Delivery", "Delivered", "Exception"] = "Pending"
    original_shipping_address: Dict = Field(default_factory=dict)


class CreatorSubscriptionCreate(BaseModel):
    creator_seller_id: str
    payment_method_used: Literal["Stripe", "PayPal"]
    expires_at: str


class CreatorSubscriptionToggle(BaseModel):
    active_status: bool


class SafetyReportCreate(BaseModel):
    reported_target_id: str
    report_type: Literal["Listing", "Seller", "Comment"]
    reason_category: str
    additional_notes: Optional[str] = None


class ClubChatUpsert(BaseModel):
    chat_id: Optional[str] = None
    club_name: str
    club_privacy_level: Literal["PUBLIC", "PRIVATE"] = "PUBLIC"
    is_premium_chat: bool = False
    is_charge_subscription_enabled: bool = False
    club_entry_monthly_price: float = 0.00


class ClubJoinRequest(BaseModel):
    subscribe_to_paid: bool = False


class ClubMessageCreate(BaseModel):
    body: str


class ForumPostCreate(BaseModel):
    title: str
    body_content: str
    section_category: Literal["3D Printing Help", "Design Showcases", "General Chat", "Hardware Reviews"]
    post_type: Literal["text", "image", "link"] = "text"
    image_url: Optional[str] = None
    link_url: Optional[str] = None


class ForumVoteCreate(BaseModel):
    direction: Literal["up", "down"]


class ForumCommentCreate(BaseModel):
    body: str
    parent_comment_id: Optional[str] = None


async def prune_forum_history(user_id: str):
    history = await db.user_forum_history.find({"user_id": user_id}, {"_id": 0, "history_id": 1}).sort("viewed_at", -1).to_list(500)
    stale_ids = [h["history_id"] for h in history[20:]]
    if stale_ids:
        await db.user_forum_history.delete_many({"history_id": {"$in": stale_ids}})


async def grant_forum_rocket_thread(post_id: str):
    post = await db.forums_posts.find_one({"post_id": post_id}, {"_id": 0, "author_user_id": 1})
    if not post or not post.get("author_user_id"):
        return
    await db.users.update_one({"user_id": post["author_user_id"]}, {"$inc": {"filament_threads_balance": 1}})


@api_router.get("/seller/orders")
async def seller_orders(request: Request):
    user = await require_user(request)
    # Find payment transactions where any line_item belongs to this seller
    cursor = db.payment_transactions.find({"line_items.seller_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1)
    txns = await cursor.to_list(200)
    # For each txn, filter line_items to only seller's items
    out = []
    for t in txns:
        items = [li for li in t.get("line_items", []) if li.get("seller_id") == user["user_id"]]
        if not items:
            continue
        doc = {
            "transaction_id": t.get("transaction_id"),
            "session_id": t.get("session_id"),
            "buyer_id": t.get("buyer_id"),
            "buyer_email": t.get("buyer_email"),
            "amount": t.get("amount"),
            "shipping_fee": t.get("shipping_fee"),
            "platform_fee": t.get("platform_fee"),
            "status": t.get("status"),
            "payment_status": t.get("payment_status"),
            "created_at": t.get("created_at"),
            "line_items": items,
        }
        out.append(doc)
    return out


@api_router.post("/physical-shipments")
async def create_physical_shipment(payload: PhysicalShipmentCreate, request: Request):
    user = await require_user(request)
    if not user.get("is_seller"):
        raise HTTPException(status_code=403, detail="Seller only")
    if payload.seller_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot create shipment for another seller")

    shipment_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "shipment_id": shipment_id,
        "order_id": payload.order_id,
        "seller_id": payload.seller_id,
        "buyer_id": payload.buyer_id,
        "listing_id": payload.listing_id,
        "tracking_number": payload.tracking_number,
        "carrier_name": payload.carrier_name,
        "shipping_status": payload.shipping_status,
        "original_shipping_address": payload.original_shipping_address or {},
        "status_last_updated_at": now_iso,
        "created_at": now_iso,
    }
    await db.physical_shipments.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/physical-shipments/order/{order_id}")
async def list_physical_shipments_for_order(order_id: str, request: Request):
    user = await require_user(request)
    items = await db.physical_shipments.find(
        {
            "order_id": order_id,
            "$or": [
                {"seller_id": user["user_id"]},
                {"buyer_id": user["user_id"]},
            ],
        },
        {"_id": 0},
    ).sort("created_at", -1).to_list(200)
    return items


@api_router.post("/creator-subscriptions")
async def create_creator_subscription(payload: CreatorSubscriptionCreate, request: Request):
    user = await require_user(request)
    creator = await db.users.find_one({"user_id": payload.creator_seller_id}, {"_id": 0, "password_hash": 0})
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    if not creator.get("has_creator_subscription_enabled"):
        raise HTTPException(status_code=400, detail="Creator subscriptions are not enabled for this seller")

    sub_id = f"sub_{uuid.uuid4().hex[:16]}"
    doc = {
        "subscription_id": sub_id,
        "subscriber_user_id": user["user_id"],
        "creator_seller_id": payload.creator_seller_id,
        "active_status": True,
        "payment_method_used": payload.payment_method_used,
        "expires_at": payload.expires_at,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.creator_subscriptions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/creator-subscriptions/status/{seller_id}")
async def creator_subscription_status(seller_id: str, request: Request):
    seller = await db.users.find_one({"user_id": seller_id}, {"_id": 0, "password_hash": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    user = await get_current_user(request)
    has_active_subscription = False
    if user:
        sub = await db.creator_subscriptions.find_one(
            {
                "subscriber_user_id": user["user_id"],
                "creator_seller_id": seller_id,
                "active_status": True,
                "$or": [
                    {"expires_at": {"$gte": datetime.now(timezone.utc).isoformat()}},
                    {"expires_at": None},
                ],
            },
            {"_id": 0, "subscription_id": 1, "expires_at": 1},
        )
        has_active_subscription = bool(sub)
    return {
        "seller_id": seller_id,
        "seller_name": seller.get("name"),
        "enabled": bool(seller.get("has_creator_subscription_enabled", False)),
        "price": round_money(float(seller.get("creator_subscription_monthly_price") or 0.0)),
        "club_name": seller.get("creator_subscription_custom_club_name") or f"{seller.get('name', 'Creator')}'s Inner Circle",
        "rules": seller.get("creator_subscription_custom_rules") or "",
        "has_active_subscription": has_active_subscription,
    }


@api_router.put("/creator-subscriptions/{subscription_id}")
async def toggle_creator_subscription(subscription_id: str, payload: CreatorSubscriptionToggle, request: Request):
    user = await require_user(request)
    sub = await db.creator_subscriptions.find_one({"subscription_id": subscription_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if sub["subscriber_user_id"] != user["user_id"] and sub["creator_seller_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.creator_subscriptions.update_one(
        {"subscription_id": subscription_id},
        {"$set": {"active_status": payload.active_status}},
    )
    return await db.creator_subscriptions.find_one({"subscription_id": subscription_id}, {"_id": 0})


@api_router.post("/safety-reports")
async def create_safety_report(payload: SafetyReportCreate, request: Request):
    user = await require_user(request)
    if not payload.reason_category.strip():
        raise HTTPException(status_code=400, detail="reason_category required")

    doc = {
        "report_id": str(uuid.uuid4()),
        "reporter_user_id": user["user_id"],
        "reported_target_id": payload.reported_target_id,
        "report_type": payload.report_type,
        "reason_category": payload.reason_category.strip(),
        "additional_notes": (payload.additional_notes or "").strip()[:4000] or None,
        "status": "Open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.safety_reports.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/admin/safety-reports")
async def list_safety_reports(request: Request):
    user = await require_user(request)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    return await db.safety_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.post("/clubs")
async def upsert_club_chat(payload: ClubChatUpsert, request: Request):
    user = await require_user(request)
    if payload.club_entry_monthly_price < 0:
        raise HTTPException(status_code=400, detail="club_entry_monthly_price must be >= 0")
    if payload.club_privacy_level == "PRIVATE" and payload.is_charge_subscription_enabled:
        raise HTTPException(status_code=400, detail="Private clubs cannot charge public subscription")

    chat_id = payload.chat_id or f"club_{uuid.uuid4().hex[:12]}"
    doc = {
        "chat_id": chat_id,
        "club_name": payload.club_name,
        "club_privacy_level": payload.club_privacy_level,
        "is_premium_chat": bool(payload.is_premium_chat),
        "is_charge_subscription_enabled": bool(payload.is_charge_subscription_enabled),
        "club_entry_monthly_price": round_money(payload.club_entry_monthly_price),
        "club_creator_owner_id": user["user_id"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.club_chats.update_one(
        {"chat_id": chat_id},
        {"$set": doc, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    await db.club_members.update_one(
        {"chat_id": chat_id, "user_id": user["user_id"]},
        {
            "$set": {"role": "owner", "is_active": True, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$setOnInsert": {"member_id": str(uuid.uuid4()), "joined_at": datetime.now(timezone.utc).isoformat()},
        },
        upsert=True,
    )
    return await db.club_chats.find_one({"chat_id": chat_id}, {"_id": 0})


@api_router.get("/clubs")
async def list_discovery_clubs(request: Request):
    user = await get_current_user(request)
    me = user["user_id"] if user else None
    clubs = await db.club_chats.find({}, {"_id": 0}).sort("updated_at", -1).to_list(300)
    out = []
    for c in clubs:
        member = None
        if me:
            member = await db.club_members.find_one({"chat_id": c["chat_id"], "user_id": me, "is_active": True}, {"_id": 0, "member_id": 1})
        c["joined"] = bool(member)
        out.append(c)
    return out


@api_router.get("/clubs/my")
async def list_my_clubs(request: Request):
    user = await require_user(request)
    memberships = await db.club_members.find({"user_id": user["user_id"], "is_active": True}, {"_id": 0, "chat_id": 1}).to_list(300)
    ids = [m["chat_id"] for m in memberships]
    if not ids:
        return []
    return await db.club_chats.find({"chat_id": {"$in": ids}}, {"_id": 0}).sort("updated_at", -1).to_list(300)


@api_router.post("/clubs/{chat_id}/join")
async def join_discovery_club(chat_id: str, payload: ClubJoinRequest, request: Request):
    user = await require_user(request)
    club = await db.club_chats.find_one({"chat_id": chat_id}, {"_id": 0})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    requires_subscription = (
        club.get("club_privacy_level") == "PUBLIC"
        and club.get("is_charge_subscription_enabled")
        and float(club.get("club_entry_monthly_price") or 0) > 0
    )
    if requires_subscription and not payload.subscribe_to_paid:
        raise HTTPException(status_code=402, detail="Subscription required to join this Discovery Club")

    await db.club_members.update_one(
        {"chat_id": chat_id, "user_id": user["user_id"]},
        {
            "$set": {"role": "member", "is_active": True, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$setOnInsert": {"member_id": str(uuid.uuid4()), "joined_at": datetime.now(timezone.utc).isoformat()},
        },
        upsert=True,
    )
    return {"joined": True, "chat_id": chat_id}


@api_router.get("/clubs/{chat_id}/messages")
async def list_club_messages(chat_id: str, request: Request):
    user = await require_user(request)
    member = await db.club_members.find_one({"chat_id": chat_id, "user_id": user["user_id"], "is_active": True}, {"_id": 0, "member_id": 1})
    if not member:
        raise HTTPException(status_code=403, detail="Join this club first")
    return await db.club_messages.find({"chat_id": chat_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)


@api_router.post("/clubs/{chat_id}/messages")
async def post_club_message(chat_id: str, payload: ClubMessageCreate, request: Request):
    user = await require_user(request)
    member = await db.club_members.find_one({"chat_id": chat_id, "user_id": user["user_id"], "is_active": True}, {"_id": 0, "member_id": 1})
    if not member:
        raise HTTPException(status_code=403, detail="Join this club first")
    body = (payload.body or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Empty message")
    doc = {
        "message_id": f"clubmsg_{uuid.uuid4().hex[:12]}",
        "chat_id": chat_id,
        "sender_id": user["user_id"],
        "sender_name": user.get("name"),
        "sender_picture": user.get("picture"),
        "body": body[:4000],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.club_messages.insert_one(doc)
    await db.club_chats.update_one({"chat_id": chat_id}, {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    doc.pop("_id", None)
    return doc


@api_router.post("/forums/posts")
async def create_forum_post(payload: ForumPostCreate, request: Request):
    user = await require_user(request)
    title = payload.title.strip()
    body = payload.body_content.strip()
    if not title or not body:
        raise HTTPException(status_code=400, detail="title and body_content are required")
    doc = {
        "post_id": str(uuid.uuid4()),
        "author_user_id": user["user_id"],
        "author_name": user.get("name"),
        "author_picture": user.get("picture"),
        "title": title[:180],
        "body_content": body[:12000],
        "section_category": payload.section_category,
        "post_type": payload.post_type,
        "image_url": payload.image_url,
        "link_url": payload.link_url,
        "views_count": 0,
        "likes_count": 0,
        "upvotes_count": 0,
        "downvotes_count": 0,
        "score_count": 0,
        "me_too_count": 0,
        "is_pinned_by_admin": False,
        "last_activity_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.forums_posts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/forums/posts")
async def list_forum_posts(section_category: Optional[str] = None, sort_mode: Optional[str] = "hot"):
    query = {}
    if section_category:
        query["section_category"] = section_category
    posts = await db.forums_posts.find(query, {"_id": 0}).to_list(500)
    if sort_mode == "new":
        posts.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    else:
        # Hot ranking: prioritize pinned, then score and recency (last activity).
        posts.sort(
            key=lambda p: (
                1 if p.get("is_pinned_by_admin") else 0,
                float(p.get("score_count", 0)),
                p.get("last_activity_at") or p.get("created_at") or "",
            ),
            reverse=True,
        )
    return posts


@api_router.get("/forums/posts/{post_id}")
async def get_forum_post(post_id: str, request: Request):
    post = await db.forums_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    user = await get_current_user(request)
    if user:
        await db.user_forum_history.insert_one({
            "history_id": str(uuid.uuid4()),
            "user_id": user["user_id"],
            "post_id": post_id,
            "viewed_at": datetime.now(timezone.utc).isoformat(),
        })
        await prune_forum_history(user["user_id"])
    await db.forums_posts.update_one(
        {"post_id": post_id},
        {"$inc": {"views_count": 1}, "$set": {"last_activity_at": datetime.now(timezone.utc).isoformat()}},
    )
    post["views_count"] = int(post.get("views_count", 0)) + 1
    return post


@api_router.post("/forums/posts/{post_id}/vote")
async def vote_forum_post(post_id: str, payload: ForumVoteCreate, request: Request):
    user = await require_user(request)
    post = await db.forums_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    desired = 1 if payload.direction == "up" else -1
    existing = await db.forums_votes.find_one({"post_id": post_id, "user_id": user["user_id"]}, {"_id": 0, "value": 1})

    # Calculate net change to avoid race condition
    old_value = int(existing.get("value", 0)) if existing else 0
    net_change = 0
    
    if existing and old_value == desired:
        # Removing vote
        await db.forums_votes.delete_one({"post_id": post_id, "user_id": user["user_id"]})
        net_change = -old_value
    else:
        # Changing or adding vote
        await db.forums_votes.update_one(
            {"post_id": post_id, "user_id": user["user_id"]},
            {
                "$set": {
                    "value": desired,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                "$setOnInsert": {
                    "vote_id": str(uuid.uuid4()),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            },
            upsert=True,
        )
        net_change = desired - old_value

    # Use atomic increments to prevent race conditions
    update_ops = {
        "$inc": {
            "score_count": net_change,
            "last_activity_at": datetime.now(timezone.utc).timestamp(),  # Force update
        },
        "$set": {"last_activity_at": datetime.now(timezone.utc).isoformat()}
    }
    
    if desired == 1:
        update_ops["$inc"]["upvotes_count"] = 1 if old_value != 1 else 0
        update_ops["$inc"]["downvotes_count"] = -1 if old_value == -1 else 0
        update_ops["$set"]["likes_count"] = max(post.get("upvotes_count", 0) + (1 if old_value != 1 else 0), 0)
    else:
        update_ops["$inc"]["downvotes_count"] = 1 if old_value != -1 else 0
        update_ops["$inc"]["upvotes_count"] = -1 if old_value == 1 else 0
        update_ops["$set"]["likes_count"] = max(post.get("upvotes_count", 0) + (-1 if old_value == 1 else 0), 0)
    
    if existing and old_value == desired:
        # Vote removed - decrement the appropriate counter
        if old_value == 1:
            update_ops["$inc"]["upvotes_count"] = -1
            update_ops["$set"]["likes_count"] = max(post.get("upvotes_count", 0) - 1, 0)
        else:
            update_ops["$inc"]["downvotes_count"] = -1

    await db.forums_posts.update_one({"post_id": post_id}, update_ops)
    
    # Get updated counts for response
    updated_post = await db.forums_posts.find_one({"post_id": post_id}, {"_id": 0, "upvotes_count": 1, "downvotes_count": 1, "score_count": 1})
    
    if payload.direction == "up" and not (existing and old_value == desired):
        asyncio.create_task(grant_forum_rocket_thread(post_id))
    
    return {
        "upvotes_count": updated_post.get("upvotes_count", 0),
        "downvotes_count": updated_post.get("downvotes_count", 0),
        "score_count": updated_post.get("score_count", 0)
    }


@api_router.post("/forums/posts/{post_id}/like")
async def toggle_forum_like(post_id: str, request: Request):
    # Backward-compatible alias: likes map to upvotes.
    req = ForumVoteCreate(direction="up")
    return await vote_forum_post(post_id, req, request)


@api_router.post("/forums/posts/{post_id}/me-too")
async def me_too_forum_post(post_id: str, request: Request):
    user = await require_user(request)
    post = await db.forums_posts.find_one({"post_id": post_id}, {"_id": 0, "post_id": 1, "me_too_count": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    exists = await db.forum_me_too.find_one({"post_id": post_id, "user_id": user["user_id"]}, {"_id": 0})
    if exists:
        await db.forum_me_too.delete_one({"post_id": post_id, "user_id": user["user_id"]})
        await db.forums_posts.update_one({"post_id": post_id}, {"$inc": {"me_too_count": -1}})
        me_too_count = max((post.get("me_too_count") or 0) - 1, 0)
        return {"me_too_count": me_too_count, "active": False}
    await db.forum_me_too.insert_one({
        "me_too_id": str(uuid.uuid4()),
        "post_id": post_id,
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.forums_posts.update_one({"post_id": post_id}, {"$inc": {"me_too_count": 1}})
    return {"me_too_count": (post.get("me_too_count") or 0) + 1, "active": True}


@api_router.post("/forums/posts/{post_id}/comments")
async def create_forum_comment(post_id: str, payload: ForumCommentCreate, request: Request):
    user = await require_user(request)
    post = await db.forums_posts.find_one({"post_id": post_id}, {"_id": 0, "post_id": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    body = (payload.body or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Comment body required")
    doc = {
        "comment_id": str(uuid.uuid4()),
        "post_id": post_id,
        "author_user_id": user["user_id"],
        "author_name": user.get("name"),
        "author_picture": user.get("picture"),
        "body": body[:4000],
        "parent_comment_id": payload.parent_comment_id,
        "upvotes_count": 0,
        "downvotes_count": 0,
        "score_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.forums_comments.insert_one(doc)
    await db.forums_posts.update_one({"post_id": post_id}, {"$set": {"last_activity_at": datetime.now(timezone.utc).isoformat()}})
    # Parse @mentions and write notifications
    import re as _re
    mentioned_tags = list(set(_re.findall(r"@([A-Za-z0-9_]+)", body)))
    if mentioned_tags:
        post_doc = await db.forums_posts.find_one({"post_id": post_id}, {"_id": 0, "title": 1})
        for tag in mentioned_tags[:10]:  # cap at 10 per comment
            target = await db.users.find_one({"user_tag": tag}, {"_id": 0, "user_id": 1, "is_platform_owner": 1})
            if target and target["user_id"] != user["user_id"]:
                await db.forum_mentions.insert_one({
                    "mention_id": str(uuid.uuid4()),
                    "mentioned_user_id": target["user_id"],
                    "mentioned_tag": tag,
                    "is_platform_owner": bool(target.get("is_platform_owner")),
                    "author_user_id": user["user_id"],
                    "author_name": user.get("name"),
                    "post_id": post_id,
                    "post_title": (post_doc or {}).get("title", ""),
                    "comment_id": doc["comment_id"],
                    "comment_excerpt": body[:120],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
    doc.pop("_id", None)
    return doc


@api_router.get("/forums/posts/{post_id}/comments")
async def list_forum_comments(post_id: str):
    return await db.forums_comments.find(
        {"post_id": post_id, "$or": [{"hidden_by_moderation": {"$exists": False}}, {"hidden_by_moderation": False}]},
        {"_id": 0},
    ).sort("created_at", 1).to_list(5000)


@api_router.post("/forums/comments/{comment_id}/vote")
async def vote_forum_comment(comment_id: str, payload: ForumVoteCreate, request: Request):
    user = await require_user(request)
    comment = await db.forums_comments.find_one({"comment_id": comment_id}, {"_id": 0})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    desired = 1 if payload.direction == "up" else -1
    existing = await db.forums_comment_votes.find_one({"comment_id": comment_id, "user_id": user["user_id"]}, {"_id": 0, "value": 1})

    if existing and int(existing.get("value", 0)) == desired:
        await db.forums_comment_votes.delete_one({"comment_id": comment_id, "user_id": user["user_id"]})
    else:
        await db.forums_comment_votes.update_one(
            {"comment_id": comment_id, "user_id": user["user_id"]},
            {
                "$set": {"value": desired, "updated_at": datetime.now(timezone.utc).isoformat()},
                "$setOnInsert": {"vote_id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()},
            },
            upsert=True,
        )

    votes = await db.forums_comment_votes.find({"comment_id": comment_id}, {"_id": 0, "value": 1}).to_list(5000)
    up = sum(1 for v in votes if int(v.get("value", 0)) == 1)
    down = sum(1 for v in votes if int(v.get("value", 0)) == -1)
    score = up - down
    await db.forums_comments.update_one(
        {"comment_id": comment_id},
        {"$set": {"upvotes_count": up, "downvotes_count": down, "score_count": score}},
    )
    return {"upvotes_count": up, "downvotes_count": down, "score_count": score}


@api_router.get("/forums/history")
async def list_forum_history(request: Request):
    user = await require_user(request)
    await prune_forum_history(user["user_id"])
    return await db.user_forum_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("viewed_at", -1).to_list(20)


@api_router.get("/forums/history/expanded")
async def list_forum_history_expanded(request: Request):
    user = await require_user(request)
    await prune_forum_history(user["user_id"])
    history = await db.user_forum_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("viewed_at", -1).to_list(20)
    post_ids = [h.get("post_id") for h in history if h.get("post_id")]
    if not post_ids:
        return []
    posts = await db.forums_posts.find({"post_id": {"$in": post_ids}}, {"_id": 0}).to_list(100)
    post_map = {p["post_id"]: p for p in posts}
    return [{"viewed_at": h.get("viewed_at"), "post": post_map.get(h.get("post_id"))} for h in history if h.get("post_id") in post_map]


def _paypal_auth_header() -> Dict[str, str]:
    raw = f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}".encode()
    encoded = base64.b64encode(raw).decode()
    return {"Authorization": f"Basic {encoded}", "Content-Type": "application/x-www-form-urlencoded"}


async def paypal_get_access_token() -> str:
    resp = requests.post(
        f"{PAYPAL_BASE}/v1/oauth2/token",
        headers=_paypal_auth_header(),
        data="grant_type=client_credentials",
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


async def paypal_create_order(amount: float, currency: str, return_url: str, cancel_url: str) -> dict:
    token = await paypal_get_access_token()
    resp = requests.post(
        f"{PAYPAL_BASE}/v2/checkout/orders",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency.upper(),
                        "value": f"{amount:.2f}",
                        "breakdown": {"item_total": {"currency_code": currency.upper(), "value": f"{amount:.2f}"}},
                    }
                }
            ],
            "application_context": {
                "shipping_preference": "NO_SHIPPING",
                "user_action": "PAY_NOW",
                "return_url": return_url,
                "cancel_url": cancel_url,
            },
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


async def paypal_capture_order(order_id: str) -> dict:
    token = await paypal_get_access_token()
    resp = requests.post(
        f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


async def paypal_get_order(order_id: str) -> dict:
    token = await paypal_get_access_token()
    resp = requests.get(
        f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def _easypost_auth_header() -> Dict[str, str]:
    raw = EASYPOST_API_KEY.encode()
    encoded = base64.b64encode(raw).decode()
    return {"Authorization": f"Basic {encoded}"}


def _easypost_tracker_events(details: List[Dict]) -> List[Dict]:
    mapped = []
    for detail in details[:10]:
        mapped.append({
            "status": detail.get("status", ""),
            "description": detail.get("status_detail", ""),
            "datetime": detail.get("datetime", ""),
            "location": (detail.get("tracking_location") or {}).get("city", ""),
        })
    return mapped


async def easypost_create_tracker(tracking_number: str, carrier: str) -> dict:
    if not EASYPOST_API_KEY:
        return {}
    resp = requests.post(
        f"{EASYPOST_BASE}/trackers",
        headers={**_easypost_auth_header(), "Content-Type": "application/json"},
        json={"tracking_code": tracking_number, "carrier": carrier},
        timeout=30,
    )
    if resp.status_code == 422:
        logger.info(f"EasyPost tracker already exists for {carrier} {tracking_number}")
        return {}
    if resp.status_code == 404:
        return {}
    resp.raise_for_status()
    return resp.json()


async def easypost_get_tracker(tracker_id: str) -> dict:
    resp = requests.get(
        f"{EASYPOST_BASE}/trackers/{tracker_id}",
        headers={**_easypost_auth_header()},
        timeout=30,
    )
    if resp.status_code == 404:
        return {}
    resp.raise_for_status()
    return resp.json()


async def enrich_tracking_with_easypost(transaction_id: str, listing_id: str, tracking_number: str, carrier: str, user: dict, txn: dict) -> Dict:
    if not EASYPOST_API_KEY or not tracking_number:
        return {}
    try:
        tracker_resp = await easypost_create_tracker(tracking_number, carrier)
        tracker = tracker_resp.get("tracker", {})
        tracker_id = tracker_resp.get("id")
        raw_status = tracker.get("status", "")
        mapped_status = EASYPOST_STATUS_MAP.get(raw_status, "Label Created")
        events = _easypost_tracker_events(tracker.get("tracking_details", []))
        etd = tracker.get("est_delivery_date")
        payload = {
            "easypost_tracker_id": tracker_id,
            "easypost_status": raw_status,
            "tracking_events": events,
            "estimated_delivery": etd,
        }
        await db.physical_shipments.update_one(
            {"order_id": transaction_id, "listing_id": listing_id},
            {
                "$set": {
                    **payload,
                    "shipping_status": mapped_status,
                    "status_last_updated_at": datetime.now(timezone.utc).isoformat(),
                },
                "$setOnInsert": {
                    "shipment_id": str(uuid.uuid4()),
                    "order_id": transaction_id,
                    "seller_id": user["user_id"],
                    "buyer_id": txn.get("buyer_id"),
                    "listing_id": listing_id,
                    "tracking_number": tracking_number,
                    "carrier_name": carrier,
                    "original_shipping_address": {},
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            },
            upsert=True,
        )
        await db.payment_transactions.update_one(
            {"transaction_id": transaction_id, "line_items.listing_id": listing_id},
            {"$set": {
                "line_items.$.status": mapped_status if tracker_id else "shipped",
                "line_items.$.tracking_events": events,
                "line_items.$.easypost_status": raw_status,
            }},
        )
        return {
            "status": mapped_status if tracker_id else "shipped",
            "easypost_status": raw_status,
            "tracker_id": tracker_id,
            "events": events,
            "eta": etd,
        }
    except Exception as exc:
        logger.warning(f"EasyPost enrich failed: {exc}")
        return {}


async def _apply_payment_success(txn: dict, session_id: str):
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": "paid", "status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    buyer_id = txn.get("buyer_id")
    if buyer_id:
        redeem_threads = int(txn.get("filament_threads_redeemed", 0) or 0)
        if redeem_threads > 0:
            await db.users.update_one({"user_id": buyer_id}, {"$inc": {"filament_threads_balance": -redeem_threads}})
        buyer = await db.users.find_one({"user_id": buyer_id}, {"_id": 0, "is_pro": 1})
        cashback_rate = 0.15 if buyer and buyer.get("is_pro") else 0.05
        subtotal_for_rewards = float(txn.get("amount") or 0.0)
        reward_threads = int(round(subtotal_for_rewards * cashback_rate * 100))
        if reward_threads > 0:
            await db.users.update_one({"user_id": buyer_id}, {"$inc": {"filament_threads_balance": reward_threads}})
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"filament_threads_rewarded": reward_threads, "cashback_rate": cashback_rate}},
        )
        if txn.get("creator_subscription_decision") == "subscribe":
            for sub_line in txn.get("subscription_line_items", []):
                seller_id = sub_line.get("seller_id")
                if not seller_id:
                    continue
                await db.creator_subscriptions.update_one(
                    {
                        "subscriber_user_id": buyer_id,
                        "creator_seller_id": seller_id,
                    },
                    {
                        "$set": {
                            "active_status": True,
                            "payment_method_used": "PayPal" if txn.get("payment_provider") == "paypal" else "Stripe",
                            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        },
                        "$setOnInsert": {
                            "subscription_id": f"sub_{uuid.uuid4().hex[:16]}",
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "subscriber_user_id": buyer_id,
                            "creator_seller_id": seller_id,
                        },
                    },
                    upsert=True,
                )
    if txn.get("purpose") == "listing":
        if txn.get("listing_ids"):
            for lid in txn["listing_ids"]:
                await db.listings.update_one({"listing_id": lid}, {"$inc": {"sales_count": 1}})
        elif txn.get("listing_id"):
            await db.listings.update_one({"listing_id": txn["listing_id"]}, {"$inc": {"sales_count": 1}})
    elif txn.get("purpose") == "pro":
        await db.users.update_one({"user_id": txn["user_id"]}, {"$set": {"is_pro": True, "pro_since": datetime.now(timezone.utc).isoformat()}})
        if not txn.get("pro_receipt_email_sent"):
            pro_user = await db.users.find_one({"user_id": txn["user_id"]}, {"_id": 0, "email": 1, "name": 1})
            if pro_user and pro_user.get("email"):
                await send_platform_email(
                    to_email=pro_user["email"],
                    subject="Welcome to the Swarm! Your Print Cosmos Pro Invoice 🐝",
                    body_html=render_pro_receipt_body(pro_user.get("name") or "Creator", float(txn.get("amount") or PRO_PRICE)),
                    kind="pro_receipt",
                    metadata={"session_id": session_id, "user_id": txn.get("user_id")},
                )
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"pro_receipt_email_sent": True}},
                )


async def refresh_easypost_tracking(transaction_id: str, listing_id: str) -> Dict:
    shipment = await db.physical_shipments.find_one({
        "order_id": transaction_id,
        "listing_id": listing_id,
    })
    if not shipment:
        return {
            "status": "Pending",
            "carrier": None,
            "tracking_number": None,
            "events": [],
            "last_updated": None,
        }

    tracking_number = shipment.get("tracking_number")
    carrier = shipment.get("carrier_name")
    tracker_id = shipment.get("easypost_tracker_id")

    if not EASYPOST_API_KEY or not tracking_number or carrier == "Other":
        return {
            "status": shipment.get("shipping_status", "Pending"),
            "carrier": carrier,
            "tracking_number": tracking_number,
            "events": shipment.get("tracking_events", []),
            "last_updated": shipment.get("status_last_updated_at"),
        }

    # Auto-create EasyPost tracker if it wasn't created earlier (e.g. key added after seller entered tracking)
    if not tracker_id:
        try:
            tracker_resp = await easypost_create_tracker(tracking_number, carrier)
            tracker_id = tracker_resp.get("id")
            if tracker_id:
                await db.physical_shipments.update_one(
                    {"shipment_id": shipment["shipment_id"]},
                    {"$set": {"easypost_tracker_id": tracker_id}}
                )
                shipment["easypost_tracker_id"] = tracker_id
        except Exception as exc:
            logger.warning(f"EasyPost tracker creation during refresh failed: {exc}")

    if not tracker_id:
        return {
            "status": shipment.get("shipping_status", "Pending"),
            "carrier": carrier,
            "tracking_number": tracking_number,
            "events": shipment.get("tracking_events", []),
            "last_updated": shipment.get("status_last_updated_at"),
        }

    try:
        tracker_resp = await easypost_get_tracker(shipment["easypost_tracker_id"])
        tracker = tracker_resp.get("tracker", {})
        raw_status = tracker.get("status", shipment.get("easypost_status", ""))
        mapped_status = EASYPOST_STATUS_MAP.get(raw_status, shipment.get("shipping_status", "Pending"))
        events = _easypost_tracker_events(tracker.get("tracking_details", []))
        etd = tracker.get("est_delivery_date") or shipment.get("estimated_delivery")
        await db.physical_shipments.update_one(
            {"shipment_id": shipment["shipment_id"]},
            {"$set": {
                "shipping_status": mapped_status,
                "easypost_status": raw_status,
                "tracking_events": events,
                "estimated_delivery": etd,
                "status_last_updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        await db.payment_transactions.update_one(
            {"transaction_id": transaction_id, "line_items.listing_id": listing_id},
            {"$set": {
                "line_items.$.status": mapped_status,
                "line_items.$.tracking_events": events,
                "line_items.$.easypost_status": raw_status,
            }},
        )
        return {
            "status": mapped_status,
            "easypost_status": raw_status,
            "carrier": shipment.get("carrier_name"),
            "tracking_number": shipment.get("tracking_number"),
            "events": events,
            "eta": etd,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        logger.warning(f"EasyPost refresh failed: {exc}")
        return {
            "status": shipment.get("shipping_status", "Pending"),
            "carrier": shipment.get("carrier_name"),
            "tracking_number": shipment.get("tracking_number"),
            "events": shipment.get("tracking_events", []),
            "last_updated": shipment.get("status_last_updated_at"),
        }


async def notify_buyer_shipping_update(seller: dict, buyer_id: str, listing_id: str, carrier: str, tracking_number: str):
    if not buyer_id:
        return
    buyer = await db.users.find_one({"user_id": buyer_id}, {"_id": 0, "password_hash": 0})
    if not buyer:
        return
    msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "sender_id": seller["user_id"],
        "sender_name": seller["name"],
        "sender_picture": seller.get("picture"),
        "recipient_id": buyer_id,
        "recipient_name": buyer["name"],
        "body": f"Your order item {listing_id} has shipped with {carrier}. Tracking number: {tracking_number}.",
        "listing_id": listing_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)


@api_router.get("/seller/orders/{transaction_id}")
async def seller_order_detail(transaction_id: str, request: Request):
    user = await require_user(request)
    txn = await db.payment_transactions.find_one({"transaction_id": transaction_id, "line_items.seller_id": user["user_id"]}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    items = [li for li in txn.get("line_items", []) if li.get("seller_id") == user["user_id"]]
    if not items:
        raise HTTPException(status_code=404, detail="Transaction line item not found")
    txn["line_items"] = items
    return txn


@api_router.put("/seller/orders/{transaction_id}/tracking")
async def update_tracking(transaction_id: str, payload: TrackingUpdate, request: Request):
    user = await require_user(request)
    txn = await db.payment_transactions.find_one({"transaction_id": transaction_id})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    found = False
    for li in txn.get("line_items", []):
        if li.get("listing_id") == payload.listing_id and li.get("seller_id") == user["user_id"]:
            found = True
            break
    if not found:
        raise HTTPException(status_code=403, detail="Listing not part of this transaction or not your listing")

    valid_carriers = ["USPS", "UPS", "FedEx", "DHL", "Other"] + EASYPOST_CARRIERS
    carrier = payload.carrier.strip()
    if carrier not in valid_carriers:
        raise HTTPException(status_code=400, detail=f"Invalid carrier. Must be one of: {', '.join(sorted(set(valid_carriers)))}")

    res = await db.payment_transactions.update_one(
        {"transaction_id": transaction_id, "line_items.listing_id": payload.listing_id},
        {"$set": {
            "line_items.$.tracking_number": payload.tracking_number.strip(),
            "line_items.$.carrier": carrier,
            "line_items.$.status": "shipped",
            "line_items.$.shipped_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    if res.modified_count:
        await db.physical_shipments.update_one(
            {
                "order_id": transaction_id,
                "seller_id": user["user_id"],
                "listing_id": payload.listing_id,
            },
            {
                "$set": {
                    "tracking_number": payload.tracking_number.strip(),
                    "carrier_name": carrier,
                    "shipping_status": "In Transit",
                    "status_last_updated_at": datetime.now(timezone.utc).isoformat(),
                },
                "$setOnInsert": {
                    "shipment_id": str(uuid.uuid4()),
                    "order_id": transaction_id,
                    "seller_id": user["user_id"],
                    "buyer_id": txn.get("buyer_id"),
                    "listing_id": payload.listing_id,
                    "original_shipping_address": {},
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            },
            upsert=True,
        )

        txn = await db.payment_transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
        all_shipped = True
        for li in txn.get("line_items", []):
            if li.get("status") not in ("shipped", "completed"):
                all_shipped = False
                break
        new_status = "shipped" if all_shipped else "partially_shipped"
        await db.payment_transactions.update_one({"transaction_id": transaction_id}, {"$set": {"status": new_status}})

        _ = await enrich_tracking_with_easypost(
            transaction_id=transaction_id,
            listing_id=payload.listing_id,
            tracking_number=payload.tracking_number.strip(),
            carrier=carrier,
            user=user,
            txn=txn,
        )
        await notify_buyer_shipping_update(user, txn.get("buyer_id"), payload.listing_id, carrier, payload.tracking_number.strip())
        return {"ok": True, "status": new_status}

    raise HTTPException(status_code=500, detail="Could not update tracking")


@api_router.get("/tracking/status/{transaction_id}/{listing_id}")
async def tracking_status(transaction_id: str, listing_id: str, request: Request):
    user = await get_current_user(request)
    status_data = await refresh_easypost_tracking(transaction_id, listing_id)
    if not user:
        return status_data
    txn = await db.payment_transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not txn:
        return status_data
    seller_ids = {li.get("seller_id") for li in txn.get("line_items", [])}
    if user["user_id"] not in seller_ids and txn.get("buyer_id") == user["user_id"]:
        return status_data
    return status_data


@api_router.post("/webhook/paypal")
async def paypal_webhook(request: Request):
    auth_algo = request.headers.get("paypal-auth-algo", "")
    cert_url = request.headers.get("paypal-cert-url", "")
    transmission_id = request.headers.get("paypal-transmission-id", "")
    transmission_sig = request.headers.get("paypal-transmission-sig", "")
    transmission_time = request.headers.get("paypal-transmission-time", "")
    webhook_id = os.environ.get("PAYPAL_WEBHOOK_ID", "")
    body = await request.json()

    if PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET and webhook_id:
        try:
            token = await paypal_get_access_token()
            verify_body = {
                "transmission_id": transmission_id,
                "transmission_time": transmission_time,
                "cert_url": cert_url,
                "auth_algo": auth_algo,
                "transmission_sig": transmission_sig,
                "webhook_id": webhook_id,
                "webhook_event": body,
            }
            verify_resp = requests.post(
                f"{PAYPAL_BASE}/v1/notifications/verify-webhook-signature",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=verify_body,
                timeout=30,
            )
            if verify_resp.status_code == 200 and verify_resp.json().get("verification_status") != "SUCCESS":
                return {"received": False}
        except Exception as exc:
            logger.warning(f"PayPal webhook signature verification failed: {exc}")
            return {"received": False}

    event_type = body.get("event_type", "")
    if event_type == "PAYMENT.CAPTURE.COMPLETED":
        order_id = (body.get("resource") or {}).get("supplementary_data", {}).get("related_ids", {}).get("order_id")
        if order_id:
            txn = await db.payment_transactions.find_one({"paypal_order_id": order_id})
            if txn and txn.get("payment_status") != "paid":
                await _apply_payment_success(txn, txn.get("session_id", txn.get("transaction_id")))
    return {"received": True}


@api_router.get("/my/purchases")
async def my_purchases(request: Request):
    user = await require_user(request)
    txns = await db.payment_transactions.find({"buyer_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return txns


class OwnerWarningPayload(BaseModel):
    reason_text: str


class OwnerSuspendPayload(BaseModel):
    duration_days: int = Field(ge=1, le=365)
    reason_text: str


class OwnerAwardMedalPayload(BaseModel):
    badge_id: str
    label: str
    description: str


class OwnerListingDeletePayload(BaseModel):
    reason_text: str


class OwnerCouponCreate(BaseModel):
    code: str
    discount_percent: float
    expires_at: str


class OwnerRefundRequest(BaseModel):
    transaction_id: str
    listing_id: str


class OutreachLogPayload(BaseModel):
    creator_name: str
    platform_name: str
    notes: Optional[str] = None


def _iso_to_datetime(value: Optional[str]) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return datetime.now(timezone.utc)


def _day_key(value: Optional[str]) -> str:
    return _iso_to_datetime(value).date().isoformat()


@app.get("/api/owner/analytics")
async def owner_analytics(request: Request):
    await require_platform_owner(request)
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
    stats = {d: {"daily_downloads": 0, "paid_count": 0, "txn_count": 0, "gross_amount": 0.0, "gross_margin": 0.0} for d in days}

    txns = await db.payment_transactions.find({}, {"_id": 0}).to_list(5000)
    for t in txns:
        created_day = _day_key(t.get("created_at"))
        if created_day in stats:
            stats[created_day]["txn_count"] += 1
        if t.get("payment_status") == "paid" or t.get("status") == "completed":
            paid_day = _day_key(t.get("completed_at") or t.get("created_at"))
            if paid_day in stats:
                stats[paid_day]["paid_count"] += 1
                gross = float(t.get("gross_amount") or t.get("amount") or 0.0)
                stats[paid_day]["gross_amount"] += gross
                margin = gross - float(t.get("platform_fee") or 0.0) - float(t.get("processing_fee") or 0.0)
                stats[paid_day]["gross_margin"] += margin
                for li in t.get("line_items", []):
                    stats[paid_day]["daily_downloads"] += int(li.get("download_count") or 0)

    rows = []
    for d in days:
        row = stats[d]
        conversion = (row["paid_count"] / row["txn_count"] * 100.0) if row["txn_count"] else 0.0
        rows.append(
            {
                "date": d,
                "daily_downloads": row["daily_downloads"],
                "sales_conversions": round(conversion, 2),
                "revenue_gross_margins": round_money(row["gross_margin"]),
                "gross_revenue": round_money(row["gross_amount"]),
            }
        )
    return {"metrics": rows}


@app.get("/api/owner/analytics/mentions")
async def owner_analytics_mentions(request: Request):
    await require_platform_owner(request)
    mentions = await db.forum_mentions.find(
        {"is_platform_owner": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return mentions


@app.get("/api/owner/analytics/counts")
async def owner_analytics_counts(request: Request):
    await require_platform_owner(request)
    today = datetime.now(timezone.utc).date()
    cutoff_14 = (today - timedelta(days=14)).isoformat()
    cutoff_30 = (today - timedelta(days=30)).isoformat()
    total_users = await db.users.count_documents({})
    total_sellers = await db.users.count_documents({"is_seller": True})
    new_users_14d = await db.users.count_documents({"created_at": {"$gte": cutoff_14}})
    new_sellers_14d = await db.users.count_documents({"is_seller": True, "created_at": {"$gte": cutoff_14}})
    new_users_30d = await db.users.count_documents({"created_at": {"$gte": cutoff_30}})
    new_sellers_30d = await db.users.count_documents({"is_seller": True, "created_at": {"$gte": cutoff_30}})
    return {
        "total_users": total_users,
        "total_sellers": total_sellers,
        "new_users_14d": new_users_14d,
        "new_sellers_14d": new_sellers_14d,
        "new_users_30d": new_users_30d,
        "new_sellers_30d": new_sellers_30d,
    }


@app.get("/api/owner/analytics/most-reported")
async def owner_analytics_most_reported(request: Request):
    await require_platform_owner(request)
    pipeline = [
        {"$group": {"_id": {"target_id": "$target_id", "target_type": "$target_type"}, "count": {"$sum": 1}, "latest": {"$max": "$created_at"}, "reasons": {"$push": "$reason"}}},
        {"$match": {"count": {"$gte": 2}}},
        {"$sort": {"count": -1}},
        {"$limit": 20},
    ]
    results = await db.reports.aggregate(pipeline).to_list(20)
    return [{"target_id": r["_id"]["target_id"], "target_type": r["_id"]["target_type"], "count": r["count"], "latest": r["latest"], "top_reason": r["reasons"][0] if r["reasons"] else ""} for r in results]


@app.get("/api/owner/analytics/hyperspace-trend")
async def owner_analytics_hyperspace_trend(request: Request):
    await require_platform_owner(request)
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=i)).isoformat() for i in range(29, -1, -1)]
    signups = {d: 0 for d in days}
    completions = {d: 0 for d in days}
    txns = await db.payment_transactions.find({"purpose": "pro"}, {"_id": 0, "created_at": 1, "payment_status": 1, "completed_at": 1}).to_list(2000)
    for t in txns:
        d = _day_key(t.get("created_at"))
        if d in signups:
            signups[d] += 1
        if t.get("payment_status") == "paid":
            cd = _day_key(t.get("completed_at") or t.get("created_at"))
            if cd in completions:
                completions[cd] += 1
    return [{"date": d, "initiated": signups[d], "completed": completions[d]} for d in days]


@app.get("/api/owner/analytics/stuck-transactions")
async def owner_analytics_stuck_transactions(request: Request):
    await require_platform_owner(request)
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    stuck = await db.payment_transactions.find(
        {"payment_status": {"$in": ["initiated", "open", "pending"]}, "created_at": {"$lte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return stuck


@app.patch("/api/reports/{report_id}/urgent")
async def mark_report_urgent(report_id: str, request: Request):
    await require_platform_owner(request)
    body = await request.json()
    is_urgent = bool(body.get("is_urgent", True))
    result = await db.reports.update_one({"report_id": report_id}, {"$set": {"is_urgent": is_urgent}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"report_id": report_id, "is_urgent": is_urgent}


@app.get("/api/owner/users")
async def owner_users_table(request: Request):
    await require_platform_owner(request)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(2000)
    return [
        {
            "user_id": u.get("user_id"),
            "name": u.get("name"),
            "user_tag": u.get("user_tag"),
            "email": u.get("email"),
            "is_pro": bool(u.get("is_pro", False)),
            "verification_status": u.get("verification_status", "Unverified"),
            "terms_enforcement_status": u.get("enforcement_status", "Active"),
            "agreed_platform_terms": bool(u.get("agreed_platform_terms", False)),
            "is_platform_owner": bool(u.get("is_platform_owner", False)),
        }
        for u in users
    ]


@app.post("/api/owner/users/{user_id}/toggle-verification")
async def owner_toggle_verification(user_id: str, request: Request):
    await require_platform_owner(request)
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    new_status = "Verified" if target.get("verification_status") != "Verified" else "Unverified"
    await db.users.update_one({"user_id": user_id}, {"$set": {"verification_status": new_status}})
    if new_status == "Verified" and target.get("email"):
        await send_platform_email(
            to_email=target["email"],
            subject="Print Cosmos Verification Approved",
            body_html=f"<p>Congratulations {html.escape(target.get('name') or 'Creator')}, your Print Cosmos profile has passed our identity checks. Your profile now features a Verified Creator badge! Start uploading your 3D work today!</p>",
            kind="verification_approved",
            metadata={"user_id": user_id},
        )
    return await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})


@app.post("/api/owner/users/{user_id}/warn")
async def owner_warn_user(user_id: str, payload: OwnerWarningPayload, request: Request):
    await require_platform_owner(request)
    reason = (payload.reason_text or "Policy violation").strip()[:2000]
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "enforcement_status": "Warned",
                "enforcement_notification_pending": True,
                "enforcement_reason_text": reason,
            }
        },
    )
    return {"ok": True}


@app.post("/api/owner/users/{user_id}/terminate")
async def owner_terminate_user(user_id: str, request: Request):
    await require_platform_owner(request)
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "enforcement_status": "Terminated",
                "enforcement_notification_pending": True,
                "enforcement_reason_text": "Account terminated by platform owner",
                "ban_banner_text": "This account is terminated for policy violations.",
                "terminated_at": now_iso,
            }
        },
    )
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.listings.update_many({"seller_id": user_id}, {"$set": {"status": "terminated_hidden"}})
    await db.comments.update_many({"user_id": user_id}, {"$set": {"hidden_by_moderation": True}})
    await db.forums_comments.update_many({"author_user_id": user_id}, {"$set": {"hidden_by_moderation": True}})
    return {"ok": True}


@app.get("/api/owner/safety-reports")
async def owner_safety_reports(request: Request):
    await require_platform_owner(request)
    return await db.safety_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@app.post("/api/owner/safety-reports/{report_id}/resolve")
async def owner_resolve_safety_report(report_id: str, request: Request):
    await require_platform_owner(request)
    await db.safety_reports.update_one(
        {"report_id": report_id},
        {"$set": {"status": "Resolved", "resolved_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True}


@app.get("/api/owner/safety-reports/{report_id}/context")
async def owner_safety_report_context(report_id: str, request: Request):
    await require_platform_owner(request)
    report = await db.safety_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    target_id = report.get("reported_target_id")
    report_type = (report.get("report_type") or "").lower()
    context = None
    if report_type == "listing":
        context = await db.listings.find_one({"listing_id": target_id}, {"_id": 0})
    elif report_type == "seller":
        context = await db.users.find_one({"user_id": target_id}, {"_id": 0, "password_hash": 0})
    elif report_type == "comment":
        context = await db.comments.find_one({"comment_id": target_id}, {"_id": 0})
    return {"report": report, "context": context}


@app.post("/api/owner/coupons")
async def owner_create_coupon(payload: OwnerCouponCreate, request: Request):
    await require_platform_owner(request)
    code = payload.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Coupon code required")
    pct = max(1.0, min(100.0, float(payload.discount_percent)))
    coupon = {
        "coupon_id": f"cpn_{uuid.uuid4().hex[:12]}",
        "code": code,
        "discount_percent": pct,
        "expires_at": payload.expires_at,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.owner_coupons.update_one({"code": code}, {"$set": coupon}, upsert=True)
    return coupon


@app.get("/api/owner/coupons")
async def owner_list_coupons(request: Request):
    await require_platform_owner(request)
    return await db.owner_coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@app.post("/api/refunds/request")
async def request_refund(payload: OwnerRefundRequest, request: Request):
    user = await require_user(request)
    txn = await db.payment_transactions.find_one({"transaction_id": payload.transaction_id, "buyer_id": user["user_id"]}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check if payment was successful before allowing refund
    if txn.get("payment_status") != "paid" and txn.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Refunds are only available for completed payments")
    
    line = None
    for li in txn.get("line_items", []):
        if li.get("listing_id") == payload.listing_id:
            line = li
            break
    if not line:
        raise HTTPException(status_code=404, detail="Line item not found")

    auto_refund = False
    reason = "Routed to owner manual evaluation"
    listing_type = line.get("listing_type", "product")
    if listing_type != "product":
        if int(line.get("download_count") or 0) == 0:
            auto_refund = True
            reason = "Auto refund granted: digital asset not downloaded"
    else:
        tracking = (line.get("tracking_number") or "").strip()
        age_days = (datetime.now(timezone.utc) - _iso_to_datetime(txn.get("created_at"))).days
        if not tracking and age_days >= 7:
            auto_refund = True
            reason = "Auto refund granted: no tracking number after 7 days"

    req_doc = {
        "request_id": f"rfd_{uuid.uuid4().hex[:12]}",
        "transaction_id": payload.transaction_id,
        "listing_id": payload.listing_id,
        "buyer_id": user["user_id"],
        "payment_provider": txn.get("payment_provider"),
        "status": "auto_refunded" if auto_refund else "pending_owner_review",
        "reason": reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.refund_requests.insert_one(req_doc)

    if auto_refund:
        await db.payment_transactions.update_one(
            {"transaction_id": payload.transaction_id, "line_items.listing_id": payload.listing_id},
            {"$set": {"line_items.$.status": "refunded", "line_items.$.refunded_at": datetime.now(timezone.utc).isoformat()}},
        )
    return req_doc


@app.post("/api/purchases/{transaction_id}/line-items/{listing_id}/download")
async def mark_download(transaction_id: str, listing_id: str, request: Request):
    user = await require_user(request)
    txn = await db.payment_transactions.find_one({"transaction_id": transaction_id, "buyer_id": user["user_id"]}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    await db.payment_transactions.update_one(
        {"transaction_id": transaction_id, "line_items.listing_id": listing_id},
        {"$inc": {"line_items.$.download_count": 1}},
    )
    return {"ok": True}


@app.post("/api/owner/recruitment/outreach")
async def owner_log_outreach(payload: OutreachLogPayload, request: Request):
    owner = await require_platform_owner(request)
    entry = {
        "entry_id": f"out_{uuid.uuid4().hex[:12]}",
        "creator_name": payload.creator_name.strip(),
        "platform_name": payload.platform_name.strip(),
        "notes": (payload.notes or "").strip()[:2000] or None,
        "owner_id": owner["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.recruitment_outreach.insert_one(entry)
    return entry


@app.get("/api/owner/recruitment/outreach")
async def owner_list_outreach(request: Request):
    await require_platform_owner(request)
    return await db.recruitment_outreach.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@app.post("/api/owner/emails/rebrand-announcement")
async def owner_send_rebrand_announcement(request: Request):
    await require_platform_owner(request)
    users = await db.users.find({}, {"_id": 0, "email": 1, "name": 1}).to_list(2000)
    sent = 0
    subject = "Welcome to Print Cosmos! (Major Update) 🐝"
    for u in users:
        if not u.get("email"):
            continue
        body = (
            f"<p><strong>Hello {html.escape(u.get('name') or 'Creator')}</strong>, we have officially evolved!</p>"
            "<p>To better represent our growing community of 3D designers and makers, PrintForge has rebranded to Print Cosmos.</p>"
            "<p>Your existing account credentials, designs, portfolios, and connected payment channels remain completely secure and unchanged.</p>"
            "<p>Log in today to check out our upgraded high-speed interface, lower commission options, and advanced 3D modeling toolbox updates.</p>"
            "<p>Happy making!<br/>- The Print Cosmos Team</p>"
        )
        await send_platform_email(u["email"], subject, body, "rebrand_announcement", {"user_id": u.get("user_id")})
        sent += 1
    return {"sent": sent}


@app.get("/api/owner/refund-requests")
async def owner_refund_requests(request: Request):
    await require_platform_owner(request)
    return await db.refund_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@app.post("/api/owner/refund-requests/{request_id}/approve")
async def owner_approve_refund_request(request_id: str, request: Request):
    await require_platform_owner(request)
    rr = await db.refund_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not rr:
        raise HTTPException(status_code=404, detail="Refund request not found")

    await db.refund_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "owner_approved_refund", "owner_resolved_at": datetime.now(timezone.utc).isoformat()}},
    )
    await db.payment_transactions.update_one(
        {"transaction_id": rr["transaction_id"], "line_items.listing_id": rr["listing_id"]},
        {"$set": {"line_items.$.status": "refunded", "line_items.$.refunded_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True, "status": "owner_approved_refund"}


@app.post("/api/owner/refund-requests/{request_id}/deny")
async def owner_deny_refund_request(request_id: str, request: Request):
    await require_platform_owner(request)
    rr = await db.refund_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not rr:
        raise HTTPException(status_code=404, detail="Refund request not found")

    await db.refund_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "owner_denied_refund", "owner_resolved_at": datetime.now(timezone.utc).isoformat()}},
    )
    await db.payment_transactions.update_one(
        {"transaction_id": rr["transaction_id"], "line_items.listing_id": rr["listing_id"]},
        {"$set": {"line_items.$.status": "refund_denied", "line_items.$.refund_denied_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True, "status": "owner_denied_refund"}


app.include_router(api_router)


@app.get("/admin/user-status")
async def get_user_status(request: Request):
    await require_platform_owner(request)
    
    user_id = request.state.user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found")
    
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "user_id": 1, "enforcement_status": 1, "warning_message": 1, "warning_reason": 1, "warning_timestamp": 1}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user


@app.post("/admin/warnings/resolve")
async def resolve_warning(request: Request):
    await require_platform_owner(request)
    
    body = await request.json()
    user_id = body.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")
    
    result = await db.users.update_one(
        {"user_id": user_id, "enforcement_status": "Warned"},
        {
            "$set": {
                "enforcement_status": "Active",
                "warning_acknowledged_at": datetime.now(timezone.utc),
                "warning_resolved": True
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No active warning found for user")
    
    return {"success": True, "message": "Warning acknowledged and resolved"}


@app.delete("/admin/warnings/purge/{user_id}")
async def purge_warning(user_id: str, request: Request):
    await require_platform_owner(request)
    
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("privacy_consent_revoked"):
        raise HTTPException(status_code=403, detail="Cannot purge due to consent withdrawal")
    
    result = await db.users.update_one(
        {"user_id": user_id, "enforcement_status": "Warned"},
        {
            "$set": {
                "enforcement_status": "Active",
                "warning_message": None,
                "warning_reason": None,
                "warning_timestamp": None,
                "warning_acknowledged_at": None,
                "warning_resolved": None
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No active warning found for user")
    
    await db.warning_purges.insert_one({
        "user_id": user_id,
        "purge_requested_at": datetime.now(timezone.utc),
        "requested_by": request.state.user.get("user_id", "INTERNAL"),
        "action": "PURGE_WARNING"
    })
    
    return {"success": True, "message": "Warning data purged from system"}


@app.get("/admin/warnings/cascade/{user_id}")
async def get_warning_cascade(user_id: str, request: Request):
    await require_platform_owner(request)
    
    # Get target user
    target_user = await db.users.find_one({"user_id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find related warnings by similar patterns
    # This is a simplified implementation - in reality would be more sophisticated
    warning_reason = target_user.get("warning_reason", "")
    warning_category = None
    
    if warning_reason:
        # Categorize warning reason for similarity matching
        reason_lower = str(warning_reason).lower()
        if any(word in reason_lower for word in ["spam", "advertisement", "promo"]):
            warning_category = "spam"
        elif any(word in reason_lower for word in ["harassment", "abuse", "threat"]):
            warning_category = "harassment"
        elif any(word in reason_lower for word in ["copyright", "dmca", "infringement"]):
            warning_category = "copyright"
        elif any(word in reason_lower for word in ["nsfw", "explicit", "inappropriate"]):
            warning_category = "content"
    
    # Find similar warnings in the system
    similar_warnings = []
    if warning_category:
        # Get other users with similar warning categories (limit to 5 for performance)
        pipeline = [
            {"$match": {"warning_category": warning_category, "user_id": {"$ne": user_id}}},
            {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "user_id", "as": "user_info"}},
            {"$unwind": "$user_info"},
            {"$project": {
                "user_id": 1,
                "username": "$user_info.username",
                "warning_reason": 1,
                "warning_timestamp": 1,
                "similarity_score": {"$literal": 0.8}  # Simplified scoring
            }},
            {"$sort": {"warning_timestamp": -1}},
            {"$limit": 5}
        ]
        
        similar_warnings = list(db.warnings.aggregate(pipeline))
    
    # Also check for users who warned the same targets
    related_users = []
    if target_user.get("warning_target_type") and target_user.get("warning_target_id"):
        related_warnings = db.warnings.find({
            "warning_target_type": target_user.get("warning_target_type"),
            "warning_target_id": target_user.get("warning_target_id"),
            "user_id": {"$ne": user_id}
        }).limit(3)
        
        related_users = list(related_warnings)
    
    return {
        "target_user": {
            "user_id": target_user["user_id"],
            "username": target_user.get("username", "Unknown"),
            "warning_reason": warning_reason,
            "warning_category": warning_category
        },
        "similar_warnings": similar_warnings,
        "related_users": related_users,
        "suggested_actions": [
            "Review similar cases for pattern consistency",
            "Check if this is part of a coordinated campaign",
            "Consider broader community guidelines reminder"
        ] if warning_category else ["No pattern detected for cascade analysis"]
    }


@app.post("/api/owner/users/{user_id}/suspend")
async def owner_suspend_user(user_id: str, payload: OwnerSuspendPayload, request: Request):
    await require_platform_owner(request)
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("is_platform_owner"):
        raise HTTPException(status_code=403, detail="Cannot suspend another platform owner")
    
    duration_days = max(1, min(365, payload.duration_days))
    suspended_until = (datetime.now(timezone.utc) + timedelta(days=duration_days)).isoformat()
    reason = (payload.reason_text or "Policy violation").strip()[:2000]
    
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "enforcement_status": "Suspended",
                "enforcement_notification_pending": True,
                "enforcement_reason_text": reason,
                "suspended_until": suspended_until,
                "suspension_reason": reason,
            }
        },
    )
    await db.user_sessions.delete_many({"user_id": user_id})
    return {"ok": True, "suspended_until": suspended_until}


@app.post("/api/owner/users/{user_id}/award-medal")
async def owner_award_medal(user_id: str, payload: OwnerAwardMedalPayload, request: Request):
    await require_platform_owner(request)
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    badge_id = payload.badge_id.strip()
    label = payload.label.strip()[:100]
    description = payload.description.strip()[:200]
    if not badge_id or not label:
        raise HTTPException(status_code=400, detail="badge_id and label are required")
    
    medal = {
        "medal_id": f"medal_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "badge_id": badge_id,
        "label": label,
        "description": description,
        "awarded_by": request.state.user.get("user_id", "owner"),
        "awarded_at": datetime.now(timezone.utc).isoformat(),
        "is_exclusive": True,
    }
    await db.owner_medals.insert_one(medal)
    return medal


@app.delete("/api/owner/listings/{listing_id}")
async def owner_delete_listing(listing_id: str, request: Request):
    await require_platform_owner(request)
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    await db.listings.delete_one({"listing_id": listing_id})
    await db.deleted_listings.insert_one({
        "listing_id": listing_id,
        "seller_id": listing.get("seller_id"),
        "title": listing.get("title"),
        "deleted_by": request.state.user.get("user_id", "owner"),
        "deleted_at": datetime.now(timezone.utc).isoformat(),
        "reason": "Owner moderation deletion",
    })
    return {"ok": True, "listing_id": listing_id}


@app.get("/api/public/suspended-check/{user_id}")
async def check_suspended(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "enforcement_status": 1, "suspended_until": 1, "suspension_reason": 1, "enforcement_reason_text": 1})
    if not user:
        return {"suspended": False}
    if user.get("enforcement_status") == "Suspended":
        suspended_until = user.get("suspended_until")
        if suspended_until:
            try:
                if datetime.fromisoformat(suspended_until) > datetime.now(timezone.utc):
                    return {
                        "suspended": True,
                        "until": suspended_until,
                        "reason": user.get("suspension_reason") or user.get("enforcement_reason_text") or "Account suspended",
                    }
            except Exception:
                pass
    return {"suspended": False}


# =====================================================================
# PRINT FAILURE DATABASE
# =====================================================================

class PrintFailureCreate(BaseModel):
    title: str
    description: str
    listing_id: Optional[str] = None  # Optional link to the listing that failed
    printer_model: Optional[str] = None
    filament_type: Optional[str] = None
    image_paths: List[str] = []
    tags: List[str] = []


class PrintFailureUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["open", "resolved"]] = None


class PrintFailureFixCreate(BaseModel):
    description: str
    image_paths: List[str] = []


@api_router.post("/print-failures")
async def create_print_failure(payload: PrintFailureCreate, request: Request):
    user = await require_user(request)
    doc = {
        "failure_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "title": payload.title.strip()[:160],
        "description": payload.description.strip()[:2000],
        "listing_id": payload.listing_id,
        "printer_model": payload.printer_model,
        "filament_type": payload.filament_type,
        "image_paths": payload.image_paths,
        "tags": [t.strip().lower() for t in payload.tags if t.strip()][:10],
        "status": "open",
        "upvotes_count": 0,
        "fixes_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.print_failures.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/print-failures")
async def list_print_failures(
    status: Optional[str] = None,
    tag: Optional[str] = None,
    listing_id: Optional[str] = None,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {"is_public": {"$ne": False}}
    if status:
        query["status"] = status
    if tag:
        query["tags"] = tag.lower()
    if listing_id:
        query["listing_id"] = listing_id
    if user_id:
        query["user_id"] = user_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}},
        ]
    items = await db.print_failures.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return items


@api_router.get("/print-failures/{failure_id}")
async def get_print_failure(failure_id: str):
    failure = await db.print_failures.find_one({"failure_id": failure_id}, {"_id": 0})
    if not failure:
        raise HTTPException(status_code=404, detail="Print failure not found")
    fixes = await db.print_failure_fixes.find({"failure_id": failure_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    failure["fixes"] = fixes
    return failure


@api_router.put("/print-failures/{failure_id}")
async def update_print_failure(failure_id: str, payload: PrintFailureUpdate, request: Request):
    user = await require_user(request)
    failure = await db.print_failures.find_one({"failure_id": failure_id}, {"_id": 0})
    if not failure:
        raise HTTPException(status_code=404, detail="Print failure not found")
    if failure.get("user_id") != user["user_id"] and not user.get("is_platform_owner"):
        raise HTTPException(status_code=403, detail="Not authorized")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.print_failures.update_one({"failure_id": failure_id}, {"$set": updates})
    updated = await db.print_failures.find_one({"failure_id": failure_id}, {"_id": 0})
    return updated


@api_router.post("/print-failures/{failure_id}/fixes")
async def create_failure_fix(failure_id: str, payload: PrintFailureFixCreate, request: Request):
    user = await require_user(request)
    failure = await db.print_failures.find_one({"failure_id": failure_id}, {"_id": 0})
    if not failure:
        raise HTTPException(status_code=404, detail="Print failure not found")
    fix = {
        "fix_id": str(uuid.uuid4()),
        "failure_id": failure_id,
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "description": payload.description.strip()[:2000],
        "image_paths": payload.image_paths,
        "upvotes_count": 0,
        "is_accepted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.print_failure_fixes.insert_one(fix)
    await db.print_failures.update_one(
        {"failure_id": failure_id},
        {"$inc": {"fixes_count": 1}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    fix.pop("_id", None)
    return fix


@api_router.post("/print-failure-fixes/{fix_id}/upvote")
async def upvote_fix(fix_id: str, request: Request):
    user = await require_user(request)
    fix = await db.print_failure_fixes.find_one({"fix_id": fix_id}, {"_id": 0})
    if not fix:
        raise HTTPException(status_code=404, detail="Fix not found")
    existing = await db.print_failure_fix_votes.find_one({"fix_id": fix_id, "user_id": user["user_id"]}, {"_id": 0})
    if existing:
        await db.print_failure_fix_votes.delete_one({"fix_id": fix_id, "user_id": user["user_id"]})
        await db.print_failure_fixes.update_one({"fix_id": fix_id}, {"$inc": {"upvotes_count": -1}})
        return {"upvoted": False}
    await db.print_failure_fix_votes.insert_one({
        "vote_id": str(uuid.uuid4()),
        "fix_id": fix_id,
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.print_failure_fixes.update_one({"fix_id": fix_id}, {"$inc": {"upvotes_count": 1}})
    return {"upvoted": True}


# =====================================================================
# COLLABORATION BOARDS
# =====================================================================

class BoardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: bool = False


class BoardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class BoardMemberAdd(BaseModel):
    user_id: str
    role: Literal["owner", "editor", "viewer"] = "editor"


class ChecklistItemCreate(BaseModel):
    title: str
    description: Optional[str] = None


class ChecklistItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    assignee_id: Optional[str] = None


@api_router.post("/boards")
async def create_board(payload: BoardCreate, request: Request):
    user = await require_user(request)
    doc = {
        "board_id": str(uuid.uuid4()),
        "owner_id": user["user_id"],
        "title": payload.title.strip()[:120],
        "description": payload.description.strip()[:1000] if payload.description else None,
        "is_public": bool(payload.is_public),
        "member_count": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.boards.insert_one(doc)
    # Add creator as owner
    await db.board_members.insert_one({
        "member_id": str(uuid.uuid4()),
        "board_id": doc["board_id"],
        "user_id": user["user_id"],
        "role": "owner",
        "joined_at": datetime.now(timezone.utc).isoformat(),
    })
    doc.pop("_id", None)
    return doc


@api_router.get("/boards")
async def list_my_boards(request: Request):
    user = await require_user(request)
    # Get boards where user is a member
    member_boards = await db.board_members.find({"user_id": user["user_id"]}, {"_id": 0, "board_id": 1, "role": 1}).to_list(200)
    board_ids = [m["board_id"] for m in member_boards]
    if not board_ids:
        return []
    items = await db.boards.find({"board_id": {"$in": board_ids}}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    # Attach role
    role_map = {m["board_id"]: m["role"] for m in member_boards}
    for item in items:
        item["user_role"] = role_map.get(item["board_id"])
    return items


@api_router.get("/boards/public")
async def list_public_boards():
    items = await db.boards.find({"is_public": True}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return items


@api_router.get("/boards/{board_id}")
async def get_board(board_id: str, request: Request):
    user = await get_current_user(request)
    board = await db.boards.find_one({"board_id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    # Check access
    is_member = False
    user_role = None
    if user:
        member = await db.board_members.find_one({"board_id": board_id, "user_id": user["user_id"]}, {"_id": 0})
        if member:
            is_member = True
            user_role = member["role"]
    if not board.get("is_public") and not is_member:
        raise HTTPException(status_code=403, detail="Board is private")
    
    members = await db.board_members.find({"board_id": board_id}, {"_id": 0}).to_list(50)
    # Get user details for members
    member_ids = [m["user_id"] for m in members]
    users = await db.users.find({"user_id": {"$in": member_ids}}, {"_id": 0, "user_id": 1, "name": 1, "user_tag": 1, "picture": 1}).to_list(50)
    user_map = {u["user_id"]: u for u in users}
    for m in members:
        m["user"] = user_map.get(m["user_id"])
    
    checklist = await db.board_checklist.find({"board_id": board_id}, {"_id": 0}).sort("order", 1).to_list(200)
    # Get assignee details
    assignee_ids = [c.get("assignee_id") for c in checklist if c.get("assignee_id")]
    if assignee_ids:
        assignees = await db.users.find({"user_id": {"$in": assignee_ids}}, {"_id": 0, "user_id": 1, "name": 1, "user_tag": 1}).to_list(50)
        assignee_map = {a["user_id"]: a for a in assignees}
        for c in checklist:
            c["assignee"] = assignee_map.get(c.get("assignee_id"))
    
    board["members"] = members
    board["checklist"] = checklist
    board["user_role"] = user_role
    return board


@api_router.put("/boards/{board_id}")
async def update_board(board_id: str, payload: BoardUpdate, request: Request):
    user = await require_user(request)
    board = await db.boards.find_one({"board_id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    member = await db.board_members.find_one({"board_id": board_id, "user_id": user["user_id"]}, {"_id": 0})
    if not member or member["role"] not in ("owner", "editor"):
        raise HTTPException(status_code=403, detail="Not authorized")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.boards.update_one({"board_id": board_id}, {"$set": updates})
    updated = await db.boards.find_one({"board_id": board_id}, {"_id": 0})
    return updated


@api_router.delete("/boards/{board_id}")
async def delete_board(board_id: str, request: Request):
    user = await require_user(request)
    board = await db.boards.find_one({"board_id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    member = await db.board_members.find_one({"board_id": board_id, "user_id": user["user_id"]}, {"_id": 0})
    if not member or member["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owner can delete board")
    await db.boards.delete_one({"board_id": board_id})
    await db.board_members.delete_many({"board_id": board_id})
    await db.board_checklist.delete_many({"board_id": board_id})
    return {"ok": True}


@api_router.post("/boards/{board_id}/members")
async def add_board_member(board_id: str, payload: BoardMemberAdd, request: Request):
    user = await require_user(request)
    board = await db.boards.find_one({"board_id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    member = await db.board_members.find_one({"board_id": board_id, "user_id": user["user_id"]}, {"_id": 0})
    if not member or member["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owner can add members")
    target_user = await db.users.find_one({"user_id": payload.user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = await db.board_members.find_one({"board_id": board_id, "user_id": payload.user_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
    await db.board_members.insert_one({
        "member_id": str(uuid.uuid4()),
        "board_id": board_id,
        "user_id": payload.user_id,
        "role": payload.role,
        "joined_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.boards.update_one({"board_id": board_id}, {"$inc": {"member_count": 1}})
    return {"ok": True}


@api_router.delete("/boards/{board_id}/members/{user_id}")
async def remove_board_member(board_id: str, user_id: str, request: Request):
    user = await require_user(request)
    board = await db.boards.find_one({"board_id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    member = await db.board_members.find_one({"board_id": board_id, "user_id": user["user_id"]}, {"_id": 0})
    if not member or member["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owner can remove members")
    if user_id == board["owner_id"]:
        raise HTTPException(status_code=400, detail="Cannot remove owner")
    await db.board_members.delete_one({"board_id": board_id, "user_id": user_id})
    await db.boards.update_one({"board_id": board_id}, {"$inc": {"member_count": -1}})
    return {"ok": True}


@api_router.post("/boards/{board_id}/checklist")
async def create_checklist_item(board_id: str, payload: ChecklistItemCreate, request: Request):
    user = await require_user(request)
    board = await db.boards.find_one({"board_id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    member = await db.board_members.find_one({"board_id": board_id, "user_id": user["user_id"]}, {"_id": 0})
    if not member or member["role"] not in ("owner", "editor"):
        raise HTTPException(status_code=403, detail="Not authorized")
    order = await db.board_checklist.count_documents({"board_id": board_id})
    item = {
        "item_id": str(uuid.uuid4()),
        "board_id": board_id,
        "title": payload.title.strip()[:200],
        "description": payload.description.strip()[:1000] if payload.description else None,
        "completed": False,
        "assignee_id": None,
        "order": order,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["user_id"],
    }
    await db.board_checklist.insert_one(item)
    item.pop("_id", None)
    return item


@api_router.put("/boards/{board_id}/checklist/{item_id}")
async def update_checklist_item(board_id: str, item_id: str, payload: ChecklistItemUpdate, request: Request):
    user = await require_user(request)
    board = await db.boards.find_one({"board_id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    member = await db.board_members.find_one({"board_id": board_id, "user_id": user["user_id"]}, {"_id": 0})
    if not member or member["role"] not in ("owner", "editor"):
        raise HTTPException(status_code=403, detail="Not authorized")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.board_checklist.update_one({"item_id": item_id, "board_id": board_id}, {"$set": updates})
    updated = await db.board_checklist.find_one({"item_id": item_id}, {"_id": 0})
    return updated


@api_router.delete("/boards/{board_id}/checklist/{item_id}")
async def delete_checklist_item(board_id: str, item_id: str, request: Request):
    user = await require_user(request)
    board = await db.boards.find_one({"board_id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    member = await db.board_members.find_one({"board_id": board_id, "user_id": user["user_id"]}, {"_id": 0})
    if not member or member["role"] not in ("owner", "editor"):
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.board_checklist.delete_one({"item_id": item_id, "board_id": board_id})
    return {"ok": True}



# =====================================================================
# FILAMENT CALCULATOR
# =====================================================================

class FilamentProfileCreate(BaseModel):
    name: str
    material: str  # PLA, PETG, ABS, TPU, etc.
    density_g_cm3: float  # g/cm³
    diameter_mm: float = 1.75
    cost_per_kg: float = 0.0
    color: Optional[str] = None


class FilamentCalculatorRequest(BaseModel):
    volume_cm3: float  # Model volume in cm³
    filament_profile_id: Optional[str] = None
    # Or provide inline filament specs
    density_g_cm3: Optional[float] = None
    diameter_mm: Optional[float] = None
    cost_per_kg: Optional[float] = None
    infill_percentage: float = 20
    wall_line_count: int = 3
    wall_thickness_mm: float = 0.4
    top_bottom_layers: int = 4
    layer_height_mm: float = 0.2
    nozzle_diameter_mm: float = 0.4


@api_router.post("/filament/profiles")
async def create_filament_profile(payload: FilamentProfileCreate, request: Request):
    user = await require_user(request)
    profile = {
        "profile_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "name": payload.name.strip()[:80],
        "material": payload.material.upper(),
        "density_g_cm3": payload.density_g_cm3,
        "diameter_mm": payload.diameter_mm,
        "cost_per_kg": payload.cost_per_kg,
        "color": payload.color,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.filament_profiles.insert_one(profile)
    profile.pop("_id", None)
    return profile


@api_router.get("/filament/profiles")
async def list_filament_profiles(request: Request):
    user = await require_user(request)
    items = await db.filament_profiles.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


@api_router.delete("/filament/profiles/{profile_id}")
async def delete_filament_profile(profile_id: str, request: Request):
    user = await require_user(request)
    await db.filament_profiles.delete_one({"profile_id": profile_id, "user_id": user["user_id"]})
    return {"ok": True}


@api_router.post("/filament/calculate")
async def calculate_filament_usage(payload: FilamentCalculatorRequest, request: Request):
    user = await get_current_user(request)
    # Get filament profile if provided
    density = payload.density_g_cm3
    diameter = payload.diameter_mm
    cost_per_kg = payload.cost_per_kg
    
    if payload.filament_profile_id and user:
        profile = await db.filament_profiles.find_one({"profile_id": payload.filament_profile_id, "user_id": user["user_id"]}, {"_id": 0})
        if profile:
            density = profile["density_g_cm3"]
            diameter = profile["diameter_mm"]
            cost_per_kg = profile["cost_per_kg"]
    
    if density is None or diameter is None:
        raise HTTPException(status_code=400, detail="Filament specs required (density and diameter)")
    
    # Calculate filament usage
    # Volume = model volume * infill% + wall volume + top/bottom volume
    model_volume = payload.volume_cm3
    infill_volume = model_volume * (payload.infill_percentage / 100)
    
    # Approximate wall volume: surface area * wall thickness
    # For a cube-ish model, surface area ≈ 6 * (volume)^(2/3)
    approx_surface_area = 6 * (model_volume ** (2/3))
    wall_volume = approx_surface_area * payload.wall_thickness_mm / 10  # Convert mm to cm
    
    # Top/bottom volume
    top_bottom_area = 2 * (model_volume ** (2/3))
    top_bottom_volume = top_bottom_area * payload.layer_height_mm / 10 * payload.top_bottom_layers
    
    total_volume_cm3 = infill_volume + wall_volume + top_bottom_volume
    
    # Filament length calculation
    # Cross-sectional area of filament = π * (diameter/2)²
    radius_cm = (diameter / 2) / 10  # mm to cm
    cross_section = 3.14159 * radius_cm ** 2
    filament_length_cm = total_volume_cm3 / cross_section
    filament_length_m = filament_length_cm / 100
    
    # Weight
    weight_g = total_volume_cm3 * density
    weight_kg = weight_g / 1000
    
    # Cost
    cost = weight_kg * (cost_per_kg or 0)
    
    # Print time estimate (rough)
    # Typical print speed ~50 mm/s
    print_time_hours = filament_length_m / (50 * 60)  # 50 mm/s = 3 m/min = 180 m/hr
    
    return {
        "volume_cm3": round(total_volume_cm3, 2),
        "filament_length_m": round(filament_length_m, 2),
        "weight_g": round(weight_g, 1),
        "weight_kg": round(weight_kg, 3),
        "estimated_cost": round(cost, 2) if cost_per_kg else None,
        "estimated_print_time_hours": round(print_time_hours, 2),
        "breakdown": {
            "infill_volume_cm3": round(infill_volume, 2),
            "wall_volume_cm3": round(wall_volume, 2),
            "top_bottom_volume_cm3": round(top_bottom_volume, 2),
            "infill_percentage": payload.infill_percentage,
            "wall_thickness_mm": payload.wall_thickness_mm,
        }
    }


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# =====================================================================
# POLICY MANAGEMENT
# =====================================================================

class PolicyRule(BaseModel):
    rule_id: str
    title: str
    content: str
    icon: str = "Scale"
    order: int = 0

class PolicyBase(BaseModel):
    policy_type: Literal["terms", "privacy"]
    title: str
    version: str
    last_updated: str
    rules: List[PolicyRule] = []

class PolicyUpdate(BaseModel):
    title: Optional[str] = None
    version: Optional[str] = None
    last_updated: Optional[str] = None
    rules: Optional[List[PolicyRule]] = None

@app.get("/api/owner/policies")
async def get_policies(request: Request):
    await require_platform_owner(request)
    policies = await db.policies.find({}, {"_id": 0}).to_list(10)
    if not policies:
        default_policies = [
            {"policy_type": "terms", "title": "Terms & Conditions", "version": "1.0", "last_updated": datetime.now(timezone.utc).date().isoformat(), "rules": [{"rule_id": str(uuid.uuid4()), "title": "Platform overview", "content": "Print Cosmos is a marketplace for 3D-printed products and 3D design files.", "icon": "Scale", "order": 1}]},
            {"policy_type": "privacy", "title": "Privacy Policy", "version": "1.0", "last_updated": datetime.now(timezone.utc).date().isoformat(), "rules": [{"rule_id": str(uuid.uuid4()), "title": "Information we collect", "content": "We collect personal data to provide and improve our services.", "icon": "User", "order": 1}]}
        ]
        await db.policies.insert_many(default_policies)
        policies = await db.policies.find({}, {"_id": 0}).to_list(10)
    return policies

@app.get("/api/owner/policies/{policy_type}")
async def get_policy(policy_type: str, request: Request):
    await require_platform_owner(request)
    policy = await db.policies.find_one({"policy_type": policy_type}, {"_id": 0})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@app.put("/api/owner/policies/{policy_type}")
async def update_policy(policy_type: str, payload: dict, request: Request):
    await require_platform_owner(request)
    update_data = {k: v for k, v in payload.items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.policies.update_one({"policy_type": policy_type}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Policy not found")
    updated_policy = await db.policies.find_one({"policy_type": policy_type}, {"_id": 0})
    return updated_policy

@app.post("/api/owner/policies/{policy_type}/rules")
async def add_policy_rule(policy_type: str, payload: dict, request: Request):
    await require_platform_owner(request)
    rule = payload.copy()
    if not rule.get("rule_id"):
        rule["rule_id"] = str(uuid.uuid4())
    result = await db.policies.update_one({"policy_type": policy_type}, {"$push": {"rules": rule}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"message": "Rule added", "rule_id": rule["rule_id"]}

@app.put("/api/owner/policies/{policy_type}/rules/{rule_id}")
async def update_policy_rule(policy_type: str, rule_id: str, payload: dict, request: Request):
    await require_platform_owner(request)
    payload["rule_id"] = rule_id
    result = await db.policies.update_one({"policy_type": policy_type, "rules.rule_id": rule_id}, {"$set": {"rules.$": payload}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Policy or rule not found")
    return {"message": "Rule updated"}

@app.delete("/api/owner/policies/{policy_type}/rules/{rule_id}")
async def delete_policy_rule(policy_type: str, rule_id: str, request: Request):
    await require_platform_owner(request)
    result = await db.policies.update_one({"policy_type": policy_type}, {"$pull": {"rules": {"rule_id": rule_id}}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"message": "Rule deleted"}


# =====================================================================
# BOB AI
# =====================================================================

class BobAskPayload(BaseModel):
    message: str
    conversation_history: Optional[List[Dict]] = None


class SectionVisitPayload(BaseModel):
    section: str


class SectionExplainer:
    """One-time popups Bob shows when a user enters a major section for the first time."""

    SECTIONS = {
        "browse": {
            "title": "Welcome to the Marketplace",
            "text": "This is the Print Cosmos marketplace — browse thousands of 3D designs from creators around the world. Use the search bar to find exactly what you're looking for, or explore by category.",
        },
        "designer": {
            "title": "The Design Studio",
            "text": "This is where you build your own prints from scratch! Combine shapes, carve holes, add patterns, and prepare your model for printing — all in the browser.",
        },
        "editor": {
            "title": "The 3D Editor",
            "text": "Edit and fine-tune your models right here. Move, scale, rotate, and fine-tune every detail before you print or publish.",
        },
        "forums": {
            "title": "Community Forums",
            "text": "Connect with other makers! Ask questions, share your work, get feedback, and join discussions about 3D printing, design techniques, and more.",
        },
        "messages": {
            "title": "Messages",
            "text": "Chat directly with other makers, sellers, and club members. Use messages to coordinate orders, ask about designs, or just say hello!",
        },
        "profile": {
            "title": "Your Profile",
            "text": "Your personal hub — view your designs, sales, downloads, badges, and account settings. Edit your bio, social links, and Pro features from here.",
        },
        "pro": {
            "title": "Print Cosmos Pro",
            "text": "Upgrade to Pro for higher listing limits, priority marketplace visibility, reduced commission rates, premium filament colors, club subscriptions, and expanded analytics.",
        },
        "dashboard": {
            "title": "Your Dashboard",
            "text": "Your command center — manage listings, track sales, view analytics, handle orders, and access all your maker tools in one place.",
        },
        "owner/control": {
            "title": "Owner Control Hub",
            "text": "Platform administration tools. Manage users, view analytics, process refunds, issue warnings, and oversee the entire Print Cosmos marketplace.",
        },
        "docs": {
            "title": "Documentation",
            "text": "Everything you need to know about Print Cosmos — from getting started to advanced features, admin tools, and platform guidelines.",
        },
        "filament-calculator": {
            "title": "Filament Calculator",
            "text": "Calculate exact filament usage for your prints. Enter your model's dimensions and get precise weight, cost estimates, and spool usage.",
        },
    }

    @classmethod
    def get_explanation(cls, section: str) -> Optional[dict]:
        return cls.SECTIONS.get(section)

    @classmethod
    def get_all_sections(cls) -> list:
        return [
            {"name": name, "title": data["title"]}
            for name, data in cls.SECTIONS.items()
        ]


@api_router.post("/bob/ask")
async def bob_ask_endpoint(payload: BobAskPayload):
    """Ask Bob a question. Returns a response from keyword matching or LLM."""
    from bob_ai import bob_ask
    result = bob_ask(payload.message, payload.conversation_history)
    return result


@api_router.get("/bob/sections")
async def bob_sections():
    """Return the catalog of sections Bob can explain."""
    return {"sections": SectionExplainer.get_all_sections()}


@api_router.get("/bob/section/{section_name}")
async def bob_section(section_name: str, request: Request):
    """Get Bob's explanation for a specific section."""
    explanation = SectionExplainer.get_explanation(section_name)
    if not explanation:
        raise HTTPException(status_code=404, detail="Section not found")
    return explanation


@api_router.post("/bob/section/{section_name}/visit")
async def bob_section_visit(section_name: str, request: Request):
    """Record that a user has seen Bob's explanation for a section."""
    user = await require_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    section_visits = user.get("section_visits", [])
    if section_name not in section_visits:
        section_visits.append(section_name)
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"section_visits": section_visits}},
        )
    return {"ok": True, "section": section_name, "visited": True}


@api_router.get("/bob/section/{section_name}/status")
async def bob_section_status(section_name: str, request: Request):
    """Check if a user has already seen Bob's explanation for a section."""
    user = await get_current_user(request)
    if not user:
        return {"visited": False, "can_show": True}
    section_visits = user.get("section_visits", [])
    return {"visited": section_name in section_visits, "can_show": section_name not in section_visits}


@api_router.get("/bob/status")
async def bob_status():
    """Return Bob AI configuration status (no sensitive key values)."""
    from bob_ai import load_context
    api_key = os.environ.get("BOB_AI_API_KEY", "")
    model = os.environ.get("BOB_AI_MODEL", "not set")
    provider = os.environ.get("BOB_AI_PROVIDER", "not set")
    free_models = os.environ.get("BOB_AI_FREE_MODELS", "")
    context = load_context()

    return {
        "configured": bool(api_key) and "REPLACE_WITH" not in api_key,
        "provider": provider,
        "model": model,
        "free_model_count": len([m.strip() for m in free_models.split(",") if m.strip()]),
        "trusted_sources": len(context.get("sources", [])),
        "knowledge_categories": len(context.get("knowledge", {})),
        "docs_length": len(context.get("docs", "")),
    }


@api_router.get("/bob/sources")
async def bob_sources():
    """Return the list of trusted sources compiled into Bob's context."""
    from bob_ai import load_context
    context = load_context()
    return {"sources": context.get("sources", []), "version": context.get("version")}
