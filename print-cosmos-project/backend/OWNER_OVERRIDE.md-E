# Platform Owner Manual Override

The `is_platform_owner` flag must only be modified via backend/database interfaces.

## Scripted option

Run:

```bash
cd /app/backend
python seed_platform_owner.py --email your-admin-email@example.com
# or
python seed_platform_owner.py --user-id user_xxxxx
```

This script applies:
- `is_platform_owner = true`
- `is_admin = true`
- `is_pro = true`
- `verification_status = "Verified"`

## Direct DB option (manual)

MongoDB shell example:

```javascript
db.users.updateOne(
  { email: "your-admin-email@example.com" },
  {
    $set: {
      is_platform_owner: true,
      is_admin: true,
      is_pro: true,
      verification_status: "Verified"
    }
  }
)
```

## Security model

- The frontend profile update API does **not** expose `is_platform_owner` for user edits.
- Do not add this field to user-facing forms.
- Ownership elevation should remain an ops-only workflow.
