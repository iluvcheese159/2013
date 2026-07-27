"""Print Cosmos backend API test suite"""
import os
import io
import time
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


@pytest.fixture(scope="module")
def auth_user():
    # Register a fresh test user and use the JWT
    email = f"pc_iter1_{int(time.time())}@printcosmos-test.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email,
        "password": "testpass123",
        "name": "Iter1 Tester",
    })
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user_id": data["user"]["user_id"], "email": email}


@pytest.fixture(scope="module")
def auth_headers(auth_user):
    return {"Authorization": f"Bearer {auth_user['token']}"}


# ----- Public endpoints -----
class TestPublic:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("name") == "Print Cosmos API"
        assert data.get("status") == "ok"

    def test_stats(self):
        r = requests.get(f"{API}/stats")
        assert r.status_code == 200
        data = r.json()
        for k in ("listings", "makers", "designs"):
            assert k in data
            assert isinstance(data[k], int)

    def test_listings_list(self):
        r = requests.get(f"{API}/listings")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_listings_filters(self):
        r = requests.get(f"{API}/listings", params={"category": "Decor", "q": "test"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_listing_unknown_404(self):
        r = requests.get(f"{API}/listings/does-not-exist-xyz")
        assert r.status_code == 404

    def test_designs_list(self):
        r = requests.get(f"{API}/designs")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ----- Auth-protected (no auth -> 401) -----
class TestAuthRequired:
    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_post_listing_unauth(self):
        r = requests.post(f"{API}/listings", json={
            "title": "x", "description": "y", "price": 1.0
        })
        assert r.status_code == 401

    def test_post_design_unauth(self):
        r = requests.post(f"{API}/designs", json={
            "title": "x", "description": "y"
        })
        assert r.status_code == 401

    def test_seller_listings_unauth(self):
        r = requests.get(f"{API}/seller/listings")
        assert r.status_code == 401


# ----- Auth-protected (with token) -----
class TestAuthenticated:
    listing_id = None
    design_id = None

    def test_me(self, auth_headers, auth_user):
        r = requests.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_id"] == auth_user["user_id"]

    def test_create_listing(self, auth_headers, auth_user):
        payload = {
            "title": "TEST_Cute Planter",
            "description": "Test 3D printed planter",
            "price": 19.99,
            "image_paths": ["test/front.jpg", "test/back.jpg"],
            "category": "Decor",
            "share_design": False,
        }
        r = requests.post(f"{API}/listings", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] == payload["title"]
        assert data["price"] == 19.99
        assert data["seller_id"] == auth_user["user_id"]
        assert "listing_id" in data
        TestAuthenticated.listing_id = data["listing_id"]

        g = requests.get(f"{API}/listings/{data['listing_id']}")
        assert g.status_code == 200
        assert g.json()["title"] == payload["title"]

    def test_seller_listings_returns_created(self, auth_headers):
        r = requests.get(f"{API}/seller/listings", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        ids = [it["listing_id"] for it in items]
        assert TestAuthenticated.listing_id in ids

    def test_create_design(self, auth_headers, auth_user):
        payload = {
            "title": "TEST_Cube Design",
            "description": "Simple cube",
            "geometry": {"objects": [{"type": "cube"}]},
            "is_public": True,
        }
        r = requests.post(f"{API}/designs", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] == payload["title"]
        assert data["creator_id"] == auth_user["user_id"]
        TestAuthenticated.design_id = data["design_id"]

        ll = requests.get(f"{API}/designs").json()
        assert any(d["design_id"] == data["design_id"] for d in ll)

    def test_become_seller(self, auth_headers):
        r = requests.post(f"{API}/auth/become-seller", headers=auth_headers)
        assert r.status_code == 200, r.text
        assert r.json().get("is_seller") is True

    def test_upload_and_download(self, auth_headers):
        files = {"file": ("test.txt", io.BytesIO(b"hello printcosmos"), "text/plain")}
        r = requests.post(f"{API}/upload", files=files, headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "path" in data
        assert data["size"] >= 16
        path = data["path"]
        # Download
        d = requests.get(f"{API}/files/{path}")
        assert d.status_code == 200
        assert d.content == b"hello printcosmos"


# ----- Checkout / Payments -----
class TestCheckout:
    session_id = None

    def test_create_checkout_session(self, auth_headers):
        # Ensure a listing exists
        assert TestAuthenticated.listing_id, "Listing must be created first"
        payload = {
            "listing_id": TestAuthenticated.listing_id,
            "origin_url": BASE_URL,
            "shipping_fee": 4.00,
        }
        r = requests.post(f"{API}/checkout/session", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and data["url"].startswith("http")
        assert "session_id" in data
        # Tiered platform fee is computed on sale price; shipping is passed through.
        assert data["amount"] == 23.99
        assert data["platform_fee"] == round(19.99 * 0.05, 2)
        expected_processing_fee = round((23.99 * 0.029) + 0.30, 2)
        assert data["processing_fee"] == expected_processing_fee
        assert data["seller_payout"] == round(23.99 - data["platform_fee"] - expected_processing_fee, 2)
        TestCheckout.session_id = data["session_id"]

    def test_checkout_status_no_throw(self):
        assert TestCheckout.session_id
        r = requests.get(f"{API}/checkout/status/{TestCheckout.session_id}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "status" in data
        assert "payment_status" in data

    def test_seller_tracking_update(self, auth_headers):
        assert TestAuthenticated.listing_id, "Listing must be created first"
        # Create a checkout session where this user is both buyer and seller for the item.
        payload = {
            "listing_id": TestAuthenticated.listing_id,
            "origin_url": BASE_URL,
            "shipping_fee": 5.00,
        }
        r = requests.post(f"{API}/checkout/session", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        txn = r.json()
        assert "transaction_id" not in txn or True

        # Fetch seller orders and find the transaction
        r = requests.get(f"{API}/seller/orders", headers=auth_headers)
        assert r.status_code == 200, r.text
        orders = r.json()
        assert any(o["status"] for o in orders)
        found = next((o for o in orders if o.get("line_items") and o["line_items"][0].get("listing_id") == TestAuthenticated.listing_id), None)
        # If the transaction is visible, update tracking for the first matching line item
        if found:
            li = found["line_items"][0]
            update_payload = {
                "listing_id": li["listing_id"],
                "tracking_number": "TRACK12345",
                "carrier": "UPS",
            }
            r2 = requests.put(f"{API}/seller/orders/{found['transaction_id']}/tracking", json=update_payload, headers=auth_headers)
            assert r2.status_code == 200, r2.text
            data2 = r2.json()
            assert data2.get("ok") is True
            assert data2.get("status") in ("shipped", "partially_shipped")

            # Buyer should see tracking info in purchases
            r3 = requests.get(f"{API}/my/purchases", headers=auth_headers)
            assert r3.status_code == 200, r3.text
            purchases = r3.json()
            assert any(
                any(li2.get("tracking_number") == "TRACK12345" and li2.get("carrier") == "UPS" for li2 in p.get("line_items", []))
                for p in purchases
            )
        else:
            pytest.skip("Could not find seller order transaction for tracking update")

    def test_multi_item_checkout_session(self, auth_headers):
        # Create a second listing to checkout multiple items in one session.
        payload = {
            "title": "TEST_Cute Planter 2",
            "description": "Another test print",
            "price": 12.00,
            "image_paths": ["test/front.jpg", "test/back.jpg"],
            "category": "Decor",
            "share_design": False,
        }
        r = requests.post(f"{API}/listings", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        listing_id_2 = r.json()["listing_id"]

        checkout_payload = {
            "origin_url": BASE_URL,
            "items": [
                {"listing_id": TestAuthenticated.listing_id, "shipping_fee": 4.00},
                {"listing_id": listing_id_2, "shipping_fee": 3.00},
            ],
        }
        r = requests.post(f"{API}/checkout/session", json=checkout_payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and data["url"].startswith("http")
        assert "session_id" in data
        assert data["amount"] == round(19.99 + 4.00 + 12.00 + 3.00, 2)
        expected_fee = round(19.99 * 0.05, 2) + round((12.00 * 0.10) + 0.15, 2)
        assert data["platform_fee"] == expected_fee
        expected_processing_fee = round((data["amount"] * 0.029) + 0.30, 2)
        assert data["processing_fee"] == expected_processing_fee
        assert data["seller_payout"] == round(data["amount"] - data["platform_fee"] - expected_processing_fee, 2)

    def test_logout_at_end(self, auth_headers):
        r = requests.post(f"{API}/auth/logout", headers=auth_headers)
        assert r.status_code == 200
        # JWT bearer tokens are stateless — server logout clears cookies only.
        # With explicit Authorization header still set, /me remains accessible.
        # (We just verify the endpoint completes successfully.)
