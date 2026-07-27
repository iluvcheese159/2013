# Auth Testing Playbook for Print Cosmos
See integration_playbook_expert_v2 response for Emergent Auth.

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test Maker',
  picture: 'https://via.placeholder.com/150',
  is_seller: true,
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
curl -X GET "$BACKEND_URL/api/auth/me" -H "Authorization: Bearer SESSION_TOKEN"
curl -X GET "$BACKEND_URL/api/listings"
```

## Step 3: Browser cookie injection (Playwright)
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": SESSION_TOKEN,
    "domain": "your-app.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
```
