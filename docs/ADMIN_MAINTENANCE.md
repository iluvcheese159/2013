# Print Cosmos Admin Maintenance Documentation

## Table of Contents
1. [Warning Management System](#warning-management-system)
2. [Refund Manager](#refund-manager)
3. [User Management Dashboard](#user-management-dashboard)
4. [Admin Audit Logs](#admin-audit-logs)
5. [Security Cleanup Tools](#security-cleanup-tools)
6. [API Reference](#api-reference)
7. [Configuration](#configuration)

---

## Warning Management System

### Overview
The Warning Management system provides tools for platform owners to monitor, issue, and resolve user warnings. It includes cascade detection to identify patterns of problematic behavior.

### Features
- **Warning Search**: Search users by ID or username
- **Issue Warnings**: Submit new warnings with custom reasons
- **Resolve Warnings**: Clear resolved warnings from user history
- **Purge Warnings**: Permanently delete warning records
- **Cascade Analysis**: Detect similar warning patterns across users

### UI Components
- Warning Manager Section in OwnerAnalytics
- Search Form with validation
- Warnings Table with actions column
- Confirmation dialogs for destructive actions

### API Endpoints
```
GET    /api/owner/users/{user_id}/warnings
POST   /api/owner/users/{user_id}/warn
POST   /api/admin/warnings/resolve
DELETE /api/admin/warnings/purge/{user_id}
GET    /api/admin/warnings/cascade/{user_id}
```

### Usage Example
```javascript
// Issue a warning
await api.post(`/api/owner/users/${userId}/warn`, {
  reason: "Spamming users",
  level: "warning"
});

// Resolve a warning
await api.post(`/api/admin/warnings/resolve`, { 
  user_id: userId 
});

// Cascade analysis
const result = await api.get(`/api/admin/warnings/cascade/${userId}`);
```

---

## Refund Manager

### Overview
The Refund Manager provides a centralized interface for reviewing and processing refund requests from users.

### Features
- **Request Queue**: View all pending refund requests
- **Approval Workflow**: Approve refunds with single click
- **Denial Workflow**: Deny refunds with custom reason
- **Status Tracking**: Real-time status updates
- **Batch Processing**: Handle multiple requests efficiently

### UI Components
- Refund Requests Section in OwnerAnalytics
- Request table with user, amount, reason columns
- Action buttons with loading states
- Success/error toast notifications

### API Endpoints
```
GET  /api/owner/refund-requests
POST /api/owner/refund-requests/{request_id}/approve
POST /api/owner/refund-requests/{request_id}/deny
```

### Workflow
1. Admin reviews refund request in queue
2. Click Approve to process refund
3. Click Deny with reason if needed
4. System updates request status automatically

### Data Model
```javascript
interface RefundRequest {
  request_id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
  status: "pending" | "approved" | "denied";
}
```

---

## User Management Dashboard

### Overview
Comprehensive user management with search, verification, suspension, and termination capabilities.

### Features
- **User Search**: Filter by ID, username, email, or role
- **Verification Toggle**: Enable/disable user verification status
- **User Suspension**: Temporarily or permanently suspend accounts
- **Account Termination**: Permanently delete user accounts
- **Medal Awards**: Recognize outstanding contributors

### UI Components
- Search form with real-time filtering
- User table with role/status columns
- Dropdown menu for action selection
- Confirmation dialogs for destructive actions

### API Endpoints
```
GET  /api/owner/users/search?q={query}&limit={limit}
POST /api/owner/users/{user_id}/toggle-verification
POST /api/owner/users/{user_id}/suspend
POST /api/owner/users/{user_id}/terminate
POST /api/owner/users/{user_id}/award-medal
```

### Actions

#### Verification Toggle
```javascript
await api.post(`/api/owner/users/${userId}/toggle-verification`);
```

#### Suspend User
```javascript
await api.post(`/api/owner/users/${userId}/suspend`, {
  reason: "Violating terms of service",
  duration: "permanent" | "24h" | "7d"
});
```

#### Terminate Account
```javascript
await api.post(`/api/owner/users/${userId}/terminate`, {
  reason: "Pattern of violations"
});
```

#### Award Medal
```javascript
await api.post(`/api/owner/users/${userId}/award-medal`, {
  medal_type: "gold" | "silver" | "bronze",
  criteria: "Top contributor"
});
```

---

## Admin Audit Logs

### Overview
Complete audit trail of all administrative actions taken on the platform.

### Features
- **Action Timeline**: Chronological view of all admin actions
- **Role-Based Filtering**: Filter by action type or admin
- **Export Capability**: Download logs for compliance
- **Real-Time Updates**: Live sync of admin activities

### UI Components
- Audit Logs Section in OwnerAnalytics
- Filter dropdown for action types
- Export button for CSV download
- Infinite scroll for large datasets

### API Endpoints
```
GET /api/admin/audit-logs?limit={limit}&action={type}
```

### Log Entry Structure
```javascript
interface AuditLogEntry {
  timestamp: string;
  admin_id: string;
  action: string;
  target_id: string;
  details: string;
  ip_address?: string;
}
```

### Common Actions Tracked
- User warnings issued/resolved
- Refunds approved/denied
- Accounts suspended/terminated
- Content removed
- System configuration changes

---

## Security Cleanup Tools

### Overview
Automated tools for maintaining platform health by cleaning up stale data.

### Features
- **Session Purge**: Remove expired user sessions
- **Account Cleanup**: Delete unverified old accounts
- **Report Archival**: Archive resolved reports
- **Confirmation Prompts**: Prevent accidental data loss

---

## Policy Management

### Overview
The Policy Management system enables platform owners to dynamically update Terms of Service and Privacy Policy rules without code changes. Each rule can have a unique icon and is version-controlled.

### Features
- **Visual Rule Editor**: Rich text editing for each policy rule
- **Icon Selection**: Choose from 12 lucide-react icons per rule
- **Live Preview**: Changes save in real-time to database
- **Version Control**: Track policy versions and last-updated dates

### UI Components
- Policy cards in OwnerControlHub
- Inline editing with icon picker
- Auto-save on blur for quick edits
- Order control for rule sequencing

### API Endpoints
```
GET    /api/owner/policies             # Lists all policies
GET    /api/owner/policies/{type}      # Get specific policy (terms/privacy)
PUT    /api/owner/policies/{type}      # Update policy metadata
POST   /api/owner/policies/{type}/rules        # Add new rule
PUT    /api/owner/policies/{type}/rules/{id}   # Update rule
DELETE /api/owner/policies/{type}/rules/{id}   # Delete rule
```

### Usage Workflow
```javascript
// Access policy editor
navigate("/owner/policy/terms");

// Add new rule
await api.post("/api/owner/policies/terms/rules", {
  rule_id: `rule_${Date.now()}`,
  title: "Shipping Policy",
  content: "All orders ship within 7 business days...",
  icon: "Rocket",
  order: 10
});

// Update existing rule
await api.put("/api/owner/policies/terms/rules/abc-123", {
  title: "Updated Shipping Policy",
  icon: "FolderOpen"
});
```

### Rule Schema
```javascript
interface PolicyRule {
  rule_id: string;     // UUID
  title: string;       // Rule heading
  content: string;     // Rule body text
  icon: string;        // lucide icon name
  order: number;       // Display order
}

interface Policy {
  policy_type: "terms" | "privacy";
  title: string;
  version: string;
  last_updated: string;
  rules: PolicyRule[];
}
```

### Available Icons
Scale, User, ShieldCheck, AlertTriangle, Tag, FolderOpen, Rocket, LayoutGrid, Calculator, MessageSquare, Lightbulb, BookOpen

### Best Practices
- Keep rule titles concise (&lt; 50 chars)
- Use descriptive icons matching rule content
- Increment version on major changes
- Review before publishing updates

---

### Overview
Automated tools for maintaining platform health by cleaning up stale data.

### Features
- **Session Purge**: Remove expired user sessions
- **Account Cleanup**: Delete unverified old accounts
- **Report Archival**: Archive resolved reports
- **Confirmation Prompts**: Prevent accidental data loss

### Cleanup Operations

#### Expired Sessions
Removes all sessions older than 30 days.

#### Unverified Accounts
Deletes accounts that:
- Have not verified email
- Were created 90+ days ago
- Have no activity

#### Report Archive
Archives resolved reports older than 1 year to reduce database size.

### API Endpoints
```
POST /api/admin/cleanup/expired_sessions
POST /api/admin/cleanup/unverified_accounts
POST /api/admin/cleanup/old_reports
```

### Usage
```javascript
// Run cleanup operation
await api.post(`/api/admin/cleanup/${type}`, {
  dry_run: false  // Set true to preview without changes
});
```

---

## API Reference

### Authentication
All admin endpoints require `is_platform_owner: true` in the JWT token.

### Error Responses
```json
{
  "detail": "Forbidden: owner-only access",
  "status_code": 403
}
```

### Rate Limiting
- 60 requests/minute per IP
- 1000 requests/hour per user
- Excess requests return 429

### Pagination
All list endpoints support:
```
GET /endpoint?limit=50&skip=0
```

---

## Configuration

### Environment Variables
```bash
# Admin settings
ADMIN_REQUIRE_MFA=true
AUDIT_LOG_RETENTION_DAYS=365

# Cleanup schedules
CLEANUP_SESSION_INTERVAL="24h"
CLEANUP_ACCOUNT_AGE_DAYS=90
```

### Feature Flags
Disable features if needed:
```bash
FEATURE_WARNING_CASCADE=false
FEATURE_REFUND_QUEUE=true
```

### Security Settings
```bash
# Session cleanup
SESSION_EXPIRY_DAYS=30

# Account cleanup
UNVERIFIED_ACCOUNT_THRESHOLD=90

# Refund processing
REFUND_AUTO_APPROVE_THRESHOLD=10.00
```

---

## Troubleshooting

### Common Issues

**Warning won't resolve**
- Check if warning exists in database
- Verify user has warning status

**Refund approval fails**
- Verify transaction exists
- Check payment status

**User search returns no results**
- Verify search query format
- Check if user exists

### Support
Contact platform-admin@printcosmos.app for assistance.