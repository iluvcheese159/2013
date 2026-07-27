"""
cleanup_test_data.py

One-time cleanup script for Print Cosmos.

WHAT THIS DOES
Your automated test suite (backend/tests/*.py) has been running directly
against your live site instead of an isolated test database. Every time
those tests ran, they created real, permanent listings (with titles like
"TEST_UI Listing 1", "TEST_Chk_...", "TEST_Cute Planter 2") using fake
image paths that were never actually uploaded (e.g. "test/front.jpg").
That's why your marketplace shows broken image icons.

This script finds and removes exactly that data — nothing else. It is
SAFE BY DEFAULT: it only *shows* you what it would delete until you
explicitly type "yes" to confirm.

HOW TO RUN
    cd backend
    python3 cleanup_test_data.py

WHAT IT TARGETS (and why each is safe to remove):
  1. Any listing/design whose title starts with the literal text "TEST"
     (case-sensitive). Every test-generated title in your codebase
     follows this exact pattern (e.g. "TEST_UI Listing 1",
     "TEST_Cute Planter 2", "TEST forums bootstrap") — a real seller
     is never going to name their product "TEST..." as the first word.
  2. Any listing/design that references the literal fake file paths
     "test/front.jpg" or "test/back.jpg" — these are hard-coded
     placeholder strings used only by the test suite. Real uploads are
     always stored under a path like
     "printcosmos/uploads/{user_id}/{random-id}.jpg", so this pattern
     can never collide with something a real user uploaded.

Nothing else in your database (real users, real orders, messages,
forum posts) is touched by this script.
"""
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]

# The exact fake paths the test suite uses for image_paths.
FAKE_TEST_FILE_PATHS = ["test/front.jpg", "test/back.jpg"]

TEST_DATA_FILTER = {
    "$or": [
        {"title": {"$regex": "^TEST"}},
        {"image_paths": {"$in": FAKE_TEST_FILE_PATHS}},
    ]
}


async def preview(collection, label):
    cursor = collection.find(TEST_DATA_FILTER, {"_id": 0, "title": 1, "listing_id": 1, "design_id": 1, "seller_name": 1, "creator_name": 1, "created_at": 1})
    docs = await cursor.to_list(length=None)
    print(f"\n{label}: {len(docs)} item(s) will be deleted")
    for d in docs[:25]:
        who = d.get("seller_name") or d.get("creator_name") or "?"
        ident = d.get("listing_id") or d.get("design_id") or "?"
        print(f"   - [{ident}] \"{d.get('title')}\"  (by {who}, created {d.get('created_at', '?')})")
    if len(docs) > 25:
        print(f"   ...and {len(docs) - 25} more")
    return docs


async def main():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("=" * 70)
    print(f"Connected to database: {db_name}")
    print("Scanning for test-fixture data...")
    print("=" * 70)

    listing_docs = await preview(db.listings, "LISTINGS")
    design_docs = await preview(db.designs, "DESIGNS")

    total = len(listing_docs) + len(design_docs)
    if total == 0:
        print("\nNothing to clean up — no test-fixture data found. You're good!")
        client.close()
        return

    print("\n" + "=" * 70)
    print(f"TOTAL: {total} item(s) across listings + designs will be PERMANENTLY deleted.")
    print("Review the titles above carefully before continuing.")
    print("=" * 70)
    answer = input('\nType "yes" to delete these items, or anything else to cancel: ').strip().lower()

    if answer != "yes":
        print("Cancelled. Nothing was deleted.")
        client.close()
        return

    l_result = await db.listings.delete_many(TEST_DATA_FILTER)
    d_result = await db.designs.delete_many(TEST_DATA_FILTER)

    print(f"\nDone. Deleted {l_result.deleted_count} listing(s) and {d_result.deleted_count} design(s).")
    print("Refresh your marketplace page — the broken-image cards should be gone.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
