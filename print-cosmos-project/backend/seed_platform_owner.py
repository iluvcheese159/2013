"""Manual platform-owner elevation utility.

Usage:
  python seed_platform_owner.py --email owner@example.com
  python seed_platform_owner.py --user-id user_abc123

This script sets:
  - is_platform_owner = True
  - is_pro = True
  - verification_status = "Verified"

It is intentionally a backend/db-side operation only.
"""

import argparse
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio


async def main(email: str | None, user_id: str | None):
    root = Path(__file__).parent
    load_dotenv(root / ".env")

    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    query = {}
    if email:
        query["email"] = email.lower().strip()
    if user_id:
        query["user_id"] = user_id.strip()
    if not query:
        raise ValueError("Provide --email or --user-id")

    user = await db.users.find_one(query, {"_id": 0, "user_id": 1, "email": 1})
    if not user:
        print("No user found for query", query)
        client.close()
        return

    await db.users.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {
                "is_platform_owner": True,
                "is_admin": True,
                "is_pro": True,
                "verification_status": "Verified",
            }
        },
    )
    print(f"Updated {user['user_id']} ({user.get('email')}) as platform owner")
    client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", default=None)
    parser.add_argument("--user-id", default=None)
    args = parser.parse_args()
    asyncio.run(main(args.email, args.user_id))
