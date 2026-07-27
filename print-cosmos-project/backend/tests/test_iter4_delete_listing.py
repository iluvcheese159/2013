"""
Iteration 4 backend tests:
- DELETE /api/seller/listings/{listing_id} soft-archives and filters out
- Removed endpoints /api/enforcement/acknowledge and /api/launch-tour/complete return 404
- Regression: /api/auth/me, /api/listings, /api/listings/{id}, /api/messages/threads,
  /api/checkout/session, /api/clubs still respond as before
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def seller_a():
    email = f"pc_iter4_a_{int(time.time())}@printcosmos-test.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "testpass123", "name": "Iter4 Seller A",
    })
    assert r.status_code == 200, r.text
    data = r.json()
    return {
        "token": data["token"],
        "user_id": data["user"]["user_id"],
        "email": email,
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


@pytest.fixture(scope="module")
def seller_b():
    email = f"pc_iter4_b_{int(time.time())+1}@printcosmos-test.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "testpass123", "name": "Iter4 Seller B",
    })
    assert r.status_code == 200, r.text
    data = r.json()
    return {
        "token": data["token"],
        "user_id": data["user"]["user_id"],
        "email": email,
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


def _create_listing(headers, title="TEST_Iter4 Listing"):
    payload = {
        "title": title,
        "description": "Iter4 archive test",
        "price": 15.50,
        "image_paths": ["test/front.jpg", "test/back.jpg"],
        "category": "Decor",
        "share_design": False,
    }
    r = requests.post(f"{API}/listings", json=payload, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()["listing_id"]


# ---------- DELETE /api/seller/listings/{listing_id} ----------
class TestDeleteListing:
    def test_delete_own_listing_success(self, seller_a):
        listing_id = _create_listing(seller_a["headers"], title=f"TEST_ToDelete_{int(time.time())}")

        # confirm it exists in public listings
        pub = requests.get(f"{API}/listings").json()
        assert any(l["listing_id"] == listing_id for l in pub), "New listing missing from /api/listings"

        r = requests.delete(f"{API}/seller/listings/{listing_id}", headers=seller_a["headers"])
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert data.get("listing_id") == listing_id

        # Verify not in public listings
        pub = requests.get(f"{API}/listings").json()
        assert not any(l["listing_id"] == listing_id for l in pub), \
            "Archived listing still visible in /api/listings"

        # Verify not in seller's own listings
        my = requests.get(f"{API}/seller/listings", headers=seller_a["headers"]).json()
        assert not any(l["listing_id"] == listing_id for l in my), \
            "Archived listing still visible in /api/seller/listings"

        # 404 fetching individual archived listing? Actually it may still return.
        # Not required by problem statement — skip.

    def test_delete_nonexistent_returns_404(self, seller_a):
        r = requests.delete(f"{API}/seller/listings/does-not-exist-abcxyz", headers=seller_a["headers"])
        assert r.status_code == 404

    def test_delete_unauthorized_no_token(self, seller_a):
        listing_id = _create_listing(seller_a["headers"], title=f"TEST_UnauthTgt_{int(time.time())}")
        r = requests.delete(f"{API}/seller/listings/{listing_id}")
        assert r.status_code in (401, 403), f"Expected 401/403 no auth, got {r.status_code}"

    def test_delete_other_users_listing_forbidden(self, seller_a, seller_b):
        listing_id = _create_listing(seller_a["headers"], title=f"TEST_OwnedByA_{int(time.time())}")
        r = requests.delete(f"{API}/seller/listings/{listing_id}", headers=seller_b["headers"])
        assert r.status_code == 403, f"Expected 403 for other seller, got {r.status_code}"


# ---------- Removed endpoints ----------
class TestRemovedEndpoints:
    def test_enforcement_acknowledge_removed(self, seller_a):
        r = requests.post(f"{API}/enforcement/acknowledge", headers=seller_a["headers"])
        assert r.status_code == 404, f"Expected 404 for removed endpoint, got {r.status_code}"

    def test_launch_tour_complete_removed(self, seller_a):
        r = requests.post(f"{API}/launch-tour/complete", headers=seller_a["headers"])
        assert r.status_code == 404, f"Expected 404 for removed endpoint, got {r.status_code}"


# ---------- Regression: other endpoints still respond ----------
class TestRegression:
    def test_auth_me_still_works(self, seller_a):
        r = requests.get(f"{API}/auth/me", headers=seller_a["headers"])
        assert r.status_code == 200
        assert r.json()["user_id"] == seller_a["user_id"]

    def test_listings_list(self):
        r = requests.get(f"{API}/listings")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_listing_detail(self, seller_a):
        listing_id = _create_listing(seller_a["headers"], title=f"TEST_Reg_{int(time.time())}")
        r = requests.get(f"{API}/listings/{listing_id}")
        assert r.status_code == 200
        assert r.json()["listing_id"] == listing_id

    def test_messages_threads(self, seller_a):
        r = requests.get(f"{API}/messages/threads", headers=seller_a["headers"])
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_checkout_session(self, seller_a):
        listing_id = _create_listing(seller_a["headers"], title=f"TEST_Chk_{int(time.time())}")
        payload = {
            "listing_id": listing_id,
            "origin_url": BASE_URL,
            "shipping_fee": 3.00,
        }
        r = requests.post(f"{API}/checkout/session", json=payload, headers=seller_a["headers"])
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and data["url"].startswith("http")
        assert "session_id" in data

    def test_clubs_list(self):
        # NOTE: /api/clubs is currently unreachable (routing bug: `app.include_router(api_router)`
        # is called at line 2051 in server.py BEFORE /clubs endpoints are declared at line 2321+).
        # Documenting the actual observed status; this test will FAIL until routing is fixed.
        r = requests.get(f"{API}/clubs")
        # Ideally would be 200 (list) or 401 (auth-gated). Currently returns 404 due to routing bug.
        assert r.status_code in (200, 401), (
            f"Unexpected status {r.status_code}: {r.text} — "
            "ROUTING BUG: /api/clubs (and other endpoints after line 2051) are not registered "
            "because app.include_router(api_router) is called BEFORE they are declared."
        )
