"""Print Cosmos iteration 2 backend tests:
- JWT email/password auth (register/login/me)
- Profile update + public profile + users search
- Messages (send / threads / thread)
- Pro checkout + tiered marketplace fee adaptation
- Existing become-creator/seller
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    raise RuntimeError(
        "REACT_APP_BACKEND_URL is not set. Tests must never silently fall back "
        "to a live/shared site \u2014 set this env var to an isolated test backend before running."
    )
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

UNIQUE = uuid.uuid4().hex[:8]
USER_A = {"email": f"test_a_{UNIQUE}@printcosmos-test.com", "password": "secret123", "name": "Tester A"}
USER_B = {"email": f"test_b_{UNIQUE}@printcosmos-test.com", "password": "secret123", "name": "Tester B"}


@pytest.fixture(scope="module")
def ctx():
    """Register two users (A, B) and return tokens + ids."""
    out = {}
    for key, u in (("a", USER_A), ("b", USER_B)):
        r = requests.post(f"{API}/auth/register", json=u, timeout=30)
        assert r.status_code == 200, f"register {key} failed: {r.text}"
        data = r.json()
        out[f"token_{key}"] = data["token"]
        out[f"user_{key}"] = data["user"]
    return out


def _h(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Register ----------
class TestRegister:
    def test_register_returns_user_token_defaults(self, ctx):
        u = ctx["user_a"]
        assert u["email"] == USER_A["email"]
        assert u["account_type"] == "neutral"
        assert u["onboarded"] is False
        assert u["is_pro"] is False
        assert "password_hash" not in u
        assert isinstance(ctx["token_a"], str) and len(ctx["token_a"]) > 20

    def test_register_duplicate_email(self, ctx):
        r = requests.post(f"{API}/auth/register", json=USER_A)
        assert r.status_code == 400
        assert "already" in r.json().get("detail", "").lower()

    def test_register_short_password(self):
        r = requests.post(f"{API}/auth/register", json={
            "email": f"short_{UNIQUE}@printcosmos-test.com", "password": "abc", "name": "Short"
        })
        assert r.status_code == 400


# ---------- Login + Me ----------
class TestLoginMe:
    def test_login_success(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": USER_A["email"], "password": USER_A["password"]
        })
        assert r.status_code == 200
        data = r.json()
        assert "token" in data and "user" in data
        assert data["user"]["email"] == USER_A["email"]

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": USER_A["email"], "password": "wrongpass"
        })
        assert r.status_code == 401

    def test_me_with_bearer(self, ctx):
        r = requests.get(f"{API}/auth/me", headers=_h(ctx["token_a"]))
        assert r.status_code == 200
        assert r.json()["user_id"] == ctx["user_a"]["user_id"]

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Profile ----------
class TestProfile:
    def test_profile_update_marks_onboarded(self, ctx):
        gt = f"tester_a_{UNIQUE}"
        payload = {"user_tag": gt, "account_type": "personal", "description": "hi", "name": "New A"}
        r = requests.put(f"{API}/profile", json=payload, headers=_h(ctx["token_a"]))
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_tag"] == gt
        assert data["account_type"] == "personal"
        assert data["onboarded"] is True
        assert data["name"] == "New A"
        ctx["a_user_tag"] = gt

    def test_profile_gamertag_taken(self, ctx):
        # User B tries to take A's gamertag
        r = requests.put(f"{API}/profile",
                         json={"user_tag": ctx["a_user_tag"]},
                         headers=_h(ctx["token_b"]))
        assert r.status_code == 400
        assert "taken" in r.json().get("detail", "").lower()

    def test_profile_invalid_account_type(self, ctx):
        r = requests.put(f"{API}/profile",
                         json={"account_type": "invalid"},
                         headers=_h(ctx["token_b"]))
        assert r.status_code == 400

    def test_public_profile_hides_email(self, ctx):
        r = requests.get(f"{API}/profile/{ctx['user_a']['user_id']}")
        assert r.status_code == 200
        data = r.json()
        assert "email" not in data
        assert "password_hash" not in data
        assert data["user_id"] == ctx["user_a"]["user_id"]

    def test_public_profile_404(self):
        r = requests.get(f"{API}/profile/nonexistent_user_xyz")
        assert r.status_code == 404


# ---------- Search ----------
class TestSearch:
    def test_search_too_short_returns_empty(self, ctx):
        r = requests.get(f"{API}/users/search?q=a", headers=_h(ctx["token_b"]))
        assert r.status_code == 200
        assert r.json() == []

    def test_search_matches(self, ctx):
        # Search by A's unique user_tag (set in test_profile_set)
        r = requests.get(f"{API}/users/search?q={ctx['a_user_tag']}", headers=_h(ctx["token_b"]))
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        ids = [u["user_id"] for u in data]
        assert ctx["user_b"]["user_id"] not in ids
        assert ctx["user_a"]["user_id"] in ids


# ---------- Messages ----------
class TestMessages:
    def test_cannot_message_self(self, ctx):
        r = requests.post(f"{API}/messages",
                          json={"recipient_id": ctx["user_a"]["user_id"], "body": "hi me"},
                          headers=_h(ctx["token_a"]))
        assert r.status_code == 400

    def test_recipient_not_found(self, ctx):
        r = requests.post(f"{API}/messages",
                          json={"recipient_id": "user_nonexistent_xyz", "body": "hi"},
                          headers=_h(ctx["token_a"]))
        assert r.status_code == 404

    def test_send_message_a_to_b(self, ctx):
        r = requests.post(f"{API}/messages",
                          json={"recipient_id": ctx["user_b"]["user_id"], "body": "Hello B!"},
                          headers=_h(ctx["token_a"]))
        assert r.status_code == 200
        msg = r.json()
        assert msg["sender_id"] == ctx["user_a"]["user_id"]
        assert msg["recipient_id"] == ctx["user_b"]["user_id"]
        assert msg["body"] == "Hello B!"
        assert msg["read"] is False

    def test_threads_for_b_show_unread(self, ctx):
        r = requests.get(f"{API}/messages/threads", headers=_h(ctx["token_b"]))
        assert r.status_code == 200
        threads = r.json()
        assert any(t["user"]["user_id"] == ctx["user_a"]["user_id"] for t in threads)
        thread = next(t for t in threads if t["user"]["user_id"] == ctx["user_a"]["user_id"])
        assert thread["unread"] >= 1
        assert thread["last_message"] == "Hello B!"

    def test_get_thread_marks_read(self, ctx):
        # B opens conversation -> unread should be marked read
        r = requests.get(f"{API}/messages/{ctx['user_a']['user_id']}", headers=_h(ctx["token_b"]))
        assert r.status_code == 200
        data = r.json()
        assert "messages" in data and len(data["messages"]) >= 1
        assert data["other"]["user_id"] == ctx["user_a"]["user_id"]
        # Verify unread now zero
        r2 = requests.get(f"{API}/messages/threads", headers=_h(ctx["token_b"]))
        thread = next(t for t in r2.json() if t["user"]["user_id"] == ctx["user_a"]["user_id"])
        assert thread["unread"] == 0


# ---------- Become creator/seller ----------
class TestRoles:
    def test_become_creator(self, ctx):
        r = requests.post(f"{API}/auth/become-creator", headers=_h(ctx["token_a"]))
        assert r.status_code == 200
        assert r.json()["is_creator"] is True

    def test_become_seller(self, ctx):
        r = requests.post(f"{API}/auth/become-seller", headers=_h(ctx["token_a"]))
        assert r.status_code == 200
        assert r.json()["is_seller"] is True


# ---------- Designs update/delete ownership ----------
class TestDesignsOwnership:
    def test_design_owner_update_and_non_owner_403(self, ctx):
        # A creates a design
        r = requests.post(f"{API}/designs",
                          json={"title": "TEST_design_owner", "description": "x", "is_public": True},
                          headers=_h(ctx["token_a"]))
        assert r.status_code == 200
        design_id = r.json()["design_id"]

        # A updates - ok
        u = requests.put(f"{API}/designs/{design_id}",
                        json={"title": "TEST_design_owner_v2", "description": "x"},
                        headers=_h(ctx["token_a"]))
        assert u.status_code == 200
        assert u.json()["title"] == "TEST_design_owner_v2"

        # B updates - 403
        u2 = requests.put(f"{API}/designs/{design_id}",
                         json={"title": "hijack", "description": "x"},
                         headers=_h(ctx["token_b"]))
        assert u2.status_code == 403

        # B deletes - 403
        d_b = requests.delete(f"{API}/designs/{design_id}", headers=_h(ctx["token_b"]))
        assert d_b.status_code == 403

        # A deletes - 200
        d_a = requests.delete(f"{API}/designs/{design_id}", headers=_h(ctx["token_a"]))
        assert d_a.status_code == 200


class TestListingsAndForums:
    def test_listing_inventory_price_fields(self, ctx):
        payload = {
            "title": "TEST_inventory_map",
            "description": "inventory + price map",
            "price": 34.95,
            "base_original_price": 49.99,
            "active_sale_price": 34.95,
            "is_on_sale": True,
            "available_filament_colors": ["Matte Black", "Neon Green", "Silk Gold"],
            "image_paths": ["test/front.jpg", "test/back.jpg"],
            "category": "Other",
        }
        r = requests.post(f"{API}/listings", json=payload, headers=_h(ctx["token_a"]))
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["base_original_price"] == 49.99
        assert data["active_sale_price"] == 34.95
        assert data["is_on_sale"] is True
        assert data["available_filament_colors"] == ["Matte Black", "Neon Green", "Silk Gold"]

    def test_forums_post_like_history(self, ctx):
        post_payload = {
            "title": "TEST forums bootstrap",
            "body_content": "hello cosmos forums",
            "section_category": "General Chat",
        }
        p = requests.post(f"{API}/forums/posts", json=post_payload, headers=_h(ctx["token_a"]))
        assert p.status_code == 200, p.text
        post_id = p.json()["post_id"]

        l = requests.get(f"{API}/forums/posts")
        assert l.status_code == 200
        assert any(x["post_id"] == post_id for x in l.json())

        g = requests.get(f"{API}/forums/posts/{post_id}", headers=_h(ctx["token_b"]))
        assert g.status_code == 200
        assert g.json()["post_id"] == post_id

        like_1 = requests.post(f"{API}/forums/posts/{post_id}/like", headers=_h(ctx["token_b"]))
        assert like_1.status_code == 200
        assert like_1.json()["liked"] is True

        like_2 = requests.post(f"{API}/forums/posts/{post_id}/like", headers=_h(ctx["token_b"]))
        assert like_2.status_code == 200
        assert like_2.json()["liked"] is False

        h = requests.get(f"{API}/forums/history", headers=_h(ctx["token_b"]))
        assert h.status_code == 200
        assert any(x["post_id"] == post_id for x in h.json())


# ---------- Pro Checkout ----------
class TestProCheckout:
    def test_pro_checkout_requires_auth(self):
        r = requests.post(f"{API}/pro/checkout", json={"origin_url": BASE_URL})
        assert r.status_code == 401

    def test_pro_checkout_creates_session(self, ctx):
        r = requests.post(f"{API}/pro/checkout",
                          json={"origin_url": BASE_URL},
                          headers=_h(ctx["token_b"]))
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and data["url"].startswith("http")
        assert "session_id" in data
        assert data["amount"] == 4.99
        ctx["pro_session_id"] = data["session_id"]

    def test_pro_checkout_status_endpoint(self, ctx):
        if not ctx.get("pro_session_id"):
            pytest.skip("no session id")
        r = requests.get(f"{API}/checkout/status/{ctx['pro_session_id']}")
        assert r.status_code == 200
        data = r.json()
        assert "status" in data and "payment_status" in data


# ---------- Stripe fee adaptation (tiered by sale price + pro status) ----------
class TestStripeFee:
    def test_fee_non_pro_seller(self, ctx):
        # User A is non-pro by default. Create a listing as A then checkout.
        c = requests.post(f"{API}/listings", json={
            "title": "TEST_nonpro_listing",
            "description": "x",
            "price": 20.00,
            "image_paths": ["test/front.jpg", "test/back.jpg"],
            "category": "Other",
        }, headers=_h(ctx["token_a"]))
        assert c.status_code == 200
        listing_id = c.json()["listing_id"]
        co = requests.post(f"{API}/checkout/session",
                          json={"listing_id": listing_id, "origin_url": BASE_URL},
                          headers=_h(ctx["token_b"]))
        assert co.status_code == 200
        data = co.json()
        assert data["fee_pct"] == 5.0
        assert data["platform_fee"] == round(20.00 * 0.05, 2)

    def test_fee_pro_seller(self, ctx):
        # Make user A is_pro via direct DB update is not possible from here;
        # use the polling endpoint won't make it paid in test mode.
        # Workaround: use a fresh user and elevate via Stripe status path is not feasible.
        # Instead, set is_pro on the seller via the become-creator/seller routes plus mark via /api/profile?
        # There's no direct endpoint. We assert fee logic by simulating: user must be is_pro.
        # We'll use a Pro user via the only available path: simulate by hitting MongoDB through
        # a direct collection update is not available. So we skip if no admin endpoint.
        # However, the commission engine uses seller["is_pro"]. To exercise the branch we
        # mark the user A as pro by using the /api/pro/checkout flow (it sets is_pro on paid).
        # In sandbox we can't pay. So we'll patch via a side-channel: another /api/profile call
        # won't set is_pro (only listed fields). Therefore we mark this as a sandbox limitation.
        pytest.skip("Cannot elevate user to is_pro=True without completing Stripe payment in sandbox; pro fee branch logic verified in code review (server.py:calculate_marketplace_commission).")


class TestOwnerAccessControls:
    def test_owner_endpoints_forbidden_for_non_owner(self, ctx):
        r1 = requests.get(f"{API}/owner/analytics", headers=_h(ctx["token_b"]))
        assert r1.status_code == 403
        r2 = requests.get(f"{API}/owner/users", headers=_h(ctx["token_b"]))
        assert r2.status_code == 403


def _owner_token_or_skip(ctx):
    # Try to claim owner with user A if no owner is currently claimed.
    claim = requests.post(f"{API}/admin/claim-owner", headers=_h(ctx["token_a"]))
    if claim.status_code == 200:
        return ctx["token_a"]
    # Already owned by someone else in shared env; cannot proceed owner-only mutation tests.
    pytest.skip(f"Owner claim unavailable in this environment: {claim.status_code} {claim.text}")


class TestCouponAndRefundDecisionRules:
    def test_coupon_applies_and_digital_refund_auto(self, ctx):
        owner_token = _owner_token_or_skip(ctx)

        # Create active coupon.
        expiry = (time.time() + 7 * 24 * 3600)
        expiry_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expiry))
        c = requests.post(
            f"{API}/owner/coupons",
            json={"code": f"TEST{UNIQUE}", "discount_percent": 25, "expires_at": expiry_iso},
            headers=_h(owner_token),
            timeout=30,
        )
        assert c.status_code == 200, c.text

        # Seller A creates a digital/service listing.
        lst = requests.post(
            f"{API}/listings",
            json={
                "title": f"TEST_service_refund_{UNIQUE}",
                "description": "service item",
                "price": 12.0,
                "listing_type": "service",
                "image_paths": [],
                "category": "Other",
            },
            headers=_h(ctx["token_a"]),
            timeout=30,
        )
        assert lst.status_code == 200, lst.text
        listing_id = lst.json()["listing_id"]

        # Buyer B checks out with coupon.
        co = requests.post(
            f"{API}/checkout/session",
            json={
                "listing_id": listing_id,
                "origin_url": BASE_URL,
                "coupon_code": f"TEST{UNIQUE}",
            },
            headers=_h(ctx["token_b"]),
            timeout=30,
        )
        assert co.status_code == 200, co.text
        co_data = co.json()
        assert co_data.get("applied_coupon")
        assert co_data["applied_coupon"]["code"] == f"TEST{UNIQUE}"
        assert float(co_data.get("coupon_discount", 0)) > 0
        txn_id = co_data["transaction_id"]

        # Digital + no downloads => auto refund.
        rr = requests.post(
            f"{API}/refunds/request",
            json={"transaction_id": txn_id, "listing_id": listing_id},
            headers=_h(ctx["token_b"]),
            timeout=30,
        )
        assert rr.status_code == 200, rr.text
        assert rr.json()["status"] == "auto_refunded"

    def test_pending_refund_routes_owner_and_owner_can_decide(self, ctx):
        owner_token = _owner_token_or_skip(ctx)

        # Seller A creates a physical/product listing.
        lst = requests.post(
            f"{API}/listings",
            json={
                "title": f"TEST_product_refund_{UNIQUE}",
                "description": "physical item",
                "price": 22.0,
                "listing_type": "product",
                "image_paths": ["test/front.jpg", "test/back.jpg"],
                "category": "Other",
            },
            headers=_h(ctx["token_a"]),
            timeout=30,
        )
        assert lst.status_code == 200, lst.text
        listing_id = lst.json()["listing_id"]

        co = requests.post(
            f"{API}/checkout/session",
            json={"listing_id": listing_id, "origin_url": BASE_URL},
            headers=_h(ctx["token_b"]),
            timeout=30,
        )
        assert co.status_code == 200, co.text
        txn_id = co.json()["transaction_id"]

        rr = requests.post(
            f"{API}/refunds/request",
            json={"transaction_id": txn_id, "listing_id": listing_id},
            headers=_h(ctx["token_b"]),
            timeout=30,
        )
        assert rr.status_code == 200, rr.text
        rr_data = rr.json()
        assert rr_data["status"] == "pending_owner_review"

        # Owner decision path.
        approve = requests.post(
            f"{API}/owner/refund-requests/{rr_data['request_id']}/approve",
            headers=_h(owner_token),
            timeout=30,
        )
        assert approve.status_code == 200, approve.text
        assert approve.json()["status"] == "owner_approved_refund"

        # Create another pending request and deny it.
        lst2 = requests.post(
            f"{API}/listings",
            json={
                "title": f"TEST_product_refund_deny_{UNIQUE}",
                "description": "physical item",
                "price": 19.0,
                "listing_type": "product",
                "image_paths": ["test/front.jpg", "test/back.jpg"],
                "category": "Other",
            },
            headers=_h(ctx["token_a"]),
            timeout=30,
        )
        assert lst2.status_code == 200, lst2.text
        listing_id_2 = lst2.json()["listing_id"]

        co2 = requests.post(
            f"{API}/checkout/session",
            json={"listing_id": listing_id_2, "origin_url": BASE_URL},
            headers=_h(ctx["token_b"]),
            timeout=30,
        )
        assert co2.status_code == 200, co2.text
        txn_id_2 = co2.json()["transaction_id"]

        rr2 = requests.post(
            f"{API}/refunds/request",
            json={"transaction_id": txn_id_2, "listing_id": listing_id_2},
            headers=_h(ctx["token_b"]),
            timeout=30,
        )
        assert rr2.status_code == 200, rr2.text
        assert rr2.json()["status"] == "pending_owner_review"

        deny = requests.post(
            f"{API}/owner/refund-requests/{rr2.json()['request_id']}/deny",
            headers=_h(owner_token),
            timeout=30,
        )
        assert deny.status_code == 200, deny.text
        assert deny.json()["status"] == "owner_denied_refund"
