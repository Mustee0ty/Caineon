# CaineonJS IDOR Testing Setup Guide

## Quick Setup (5 minutes)

### 1. Gather Your Test Credentials

You need **two different user accounts** on your target API:
- **User 1**: High privilege (admin, or account owner) — gets baseline response
- **User 2**: Low privilege (regular user, different account) — tests access bypass

Get their authentication tokens/cookies:
```bash
# If Bearer tokens:
USER1_TOKEN="eyJhbGciOiJIUzI1NiIs..."
USER2_TOKEN="eyJhbGciOiJIUzI1NiIs..."

# If cookies:
USER1_COOKIE="session=abc123; userId=user1"
USER2_COOKIE="session=xyz789; userId=user2"

# If API keys:
USER1_API_KEY="sk_live_abc123"
USER2_API_KEY="sk_live_xyz789"
```

### 2. Configure CaineonJS

Edit `src/config/credentials.js`:

**For Bearer Tokens:**
```javascript
export const credentials = {
  user1: {
    type: "bearer",
    value: "YOUR_ADMIN_TOKEN_HERE",
    label: "Admin Account",
  },
  user2: {
    type: "bearer",
    value: "YOUR_REGULAR_USER_TOKEN_HERE",
    label: "Regular User Account",
  },
};
```

**For Cookies:**
```javascript
export const credentials = {
  user1: {
    type: "cookie",
    value: "session=admin_session_value",
    label: "Admin Session",
  },
  user2: {
    type: "cookie",
    value: "session=user_session_value",
    label: "User Session",
  },
};
```

**For API Keys:**
```javascript
export const credentials = {
  user1: {
    type: "custom",
    headerName: "X-API-Key",
    value: "admin_api_key",
    label: "Admin API Key",
  },
  user2: {
    type: "custom",
    headerName: "X-API-Key",
    value: "user_api_key",
    label: "User API Key",
  },
};
```

### 3. Import Workflow into Caido

1. Open **Caido**
2. Go to **Workflows** tab
3. Create new **JavaScript** workflow node
4. Copy content from `workflows/m1-workflow.js` into the node
5. Save and enable

### 4. Test It

1. Capture a request in Caido that accesses a resource by ID:
   - `GET /api/orders/12345`
   - `GET /api/users/67890/profile`
   - `GET /api/documents/ABC123`
2. Route the request through your M1 workflow node
3. Check console output for results

---

## What to Look For (IDOR Red Flags)

### Vulnerable Pattern (🚨 IDOR Found)
```
User 1 (Admin): GET /api/orders/5001
→ 200 OK - Returns full order details with sensitive data

User 2 (Regular User): GET /api/orders/5001 (same request with their auth)
→ 200 OK - Returns the SAME order details!

VERDICT: VULNERABLE - User 2 shouldn't access User 1's order!
```

### Secure Pattern (✅ Protected)
```
User 1 (Admin): GET /api/orders/5001
→ 200 OK - Returns order details

User 2 (Regular User): GET /api/orders/5001
→ 403 Forbidden OR 404 Not Found

VERDICT: SECURE - Proper access control in place
```

---

## Advanced Testing Scenarios

### Test Multiple Resources (Resource Enumeration)

Create a test file:
```javascript
import { M1WithEnumeration } from "../src/core/m1.js";

// Test if attacker can access orders 1-100 of victim
const orderIds = Array.from({length: 100}, (_, i) => String(1000 + i));
const tests = M1WithEnumeration(request, orderIds);
// Will generate 100 M1 tests, one for each ID
```

### Test Write Operations (M2)

For endpoints that modify data:
```javascript
// Use m2-workflow.js instead of m1-workflow.js
// For PATCH, PUT, DELETE, POST requests
```

Example:
```
User 1: PATCH /api/users/67890/email
Body: {"email": "newadmin@hack.com"}
→ 200 OK - Email changed

User 2: PATCH /api/users/67890/email (with regular user auth)
Body: {"email": "newadmin@hack.com"}
→ 200 OK - User 2 MODIFIED User 1's email!

VERDICT: VULNERABLE (M2) - Cross-account write vulnerability
```

---

## Common API Endpoints to Test

These are common IDOR targets:

| Endpoint Pattern | Example | IDOR Risk |
|------------------|---------|-----------|
| `/api/users/{userId}` | `/api/users/123` | View/modify other users |
| `/api/orders/{orderId}` | `/api/orders/5001` | View/modify other orders |
| `/api/documents/{docId}` | `/api/documents/ABC` | Access private documents |
| `/api/accounts/{accountId}` | `/api/accounts/456` | Access other accounts |
| `/api/invoices/{invoiceId}` | `/api/invoices/INV789` | View other invoices |
| `/api/reports/{reportId}` | `/api/reports/Q3-2024` | Access confidential reports |
| `/{userId}/profile` | `/123/profile` | View other profiles |
| `/{userId}/settings` | `/123/settings` | Modify other user settings |

---

## Troubleshooting

### "401 Unauthorized" for both users
- Check your credentials are valid
- Make sure tokens/cookies aren't expired
- Verify authentication header format

### "404 Not Found" for both users
- Verify the resource ID actually exists in the system
- Check User 1 can access it first manually

### All requests getting "403 Forbidden"
- May be legitimate API behavior
- Try different endpoints or resources
- Verify User 1 (admin) can actually access the resource

### No console output
- Check Caido workflow is properly enabled
- Verify workflow node is selected in request routing
- Check browser console for JavaScript errors

---

## Real-World Example: E-Commerce API

**Target API**: `https://shop.example.com/api`

**Step 1: Get two accounts**
```
Admin Account: admin@shop.local (token: admin_jwt_123)
User Account: customer@shop.local (token: user_jwt_456)
```

**Step 2: Configure credentials.js**
```javascript
export const credentials = {
  user1: {
    type: "bearer",
    value: "admin_jwt_123",
    label: "Admin",
  },
  user2: {
    type: "bearer",
    value: "user_jwt_456",
    label: "Customer",
  },
};
```

**Step 3: Test endpoints**
- `GET /api/orders/9001` → Order details including payment info
- `GET /api/users/user123/addresses` → Customer address book
- `PATCH /api/users/user123/email` → Change email (M2 test)
- `GET /api/invoices/inv-2024-001` → Invoice with customer data

**Results**:
- If customer can view/modify admin's orders → **IDOR FOUND**
- If customer can access invoices not theirs → **IDOR FOUND**
- If customer can change admin's email → **CRITICAL IDOR**

---

## Next Steps

1. **Start small**: Test one endpoint first
2. **Expand scope**: Once you find patterns, test similar endpoints
3. **Test M2**: Use write operations if applicable
4. **Batch test**: Use `M1Batch()` or `M1WithEnumeration()` for multiple IDs
5. **Document findings**: Note all vulnerable endpoints and severity

Happy hunting! 🎯
