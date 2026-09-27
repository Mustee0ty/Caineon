# CaineonJS Basic Usage Guide

This guide will walk you through setting up and using CaineonJS for authorization testing in Caido.

## Prerequisites

- Caido installed and running
- Two user accounts on your target application:
  - **User 1**: High-privilege account (admin, owner, etc.)
  - **User 2**: Low-privilege account (regular user)
- Authentication tokens/credentials for both accounts

## Quick Start

### Step 1: Obtain Credentials

First, capture authentication tokens from both users. Common methods:

#### Bearer Token (JWT)
1. Login as User 1 in your browser
2. Open DevTools → Network tab
3. Find an authenticated request
4. Copy the `Authorization: Bearer <token>` header value
5. Repeat for User 2

#### Session Cookie
1. Login as User 1
2. Open DevTools → Application → Cookies
3. Copy the session cookie value
4. Repeat for User 2

### Step 2: Choose a Workflow

CaineonJS provides three ready-to-use workflows:

- **`m1-workflow.js`**: For testing GET/read operations only
- **`m2-workflow.js`**: For testing POST/PUT/PATCH/DELETE operations
- **`combined-workflow.js`**: Auto-detects and tests both (recommended)

### Step 3: Configure Credentials

Open your chosen workflow file and update the credentials:

```javascript
const credentials = {
  user1: {
    type: "bearer",  // or "cookie", "custom", "basic"
    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_USER1_TOKEN",
    label: "Admin User",
  },
  user2: {
    type: "bearer",
    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_USER2_TOKEN",
    label: "Regular User",
  },
};
```

### Step 4: Import into Caido

1. Open Caido
2. Navigate to the Workflow section
3. Create a new Workflow JS node
4. Copy the contents of your chosen workflow file
5. Paste into the Caido workflow editor
6. Save the workflow

### Step 5: Run Tests

1. Capture a request in Caido (from User 1's session)
2. Send it through your CaineonJS workflow node
3. Review the results in the console output

## Example Test Flow

### Testing a Read Operation (M1)

**Scenario**: User 1 reads their own order details

```
Original Request:
GET /api/orders/12345
Authorization: Bearer USER1_TOKEN

Expected Behavior:
- User 1: 200 OK with order data
- User 2: 403 Forbidden or 404 Not Found

CaineonJS Result:
✅ SECURE - Authorization properly enforced
```

**Vulnerability Detected:**

```
CaineonJS Result:
🚨 VULNERABLE - User 2 accessed User 1's resource successfully
   Both users received 200 OK
   This is an IDOR vulnerability!
```

### Testing a Write Operation (M2)

**Scenario**: User 1 updates their profile

```
Original Request:
PATCH /api/users/67890
Authorization: Bearer USER1_TOKEN
Content-Type: application/json

{
  "email": "newemail@example.com"
}

Expected Behavior:
- User 1: 200 OK, profile updated
- User 2: 403 Forbidden

CaineonJS Result:
✅ SECURE - Authorization properly enforced
```

**Vulnerability Detected:**

```
CaineonJS Result:
🚨 VULNERABLE - User 2 was able to perform User 1's mutation
   Severity: HIGH
   User 2 can modify User 1's profile!
```

## Understanding Results

### Verdict Types

| Verdict | Meaning | Action |
|---------|---------|--------|
| **VULNERABLE** 🚨 | Authorization bypass detected | **Report as security bug** |
| **SECURE** ✅ | Authorization properly enforced | No action needed |
| **ANOMALY** ⚠️ | User 2 succeeded where User 1 failed | Investigate privilege escalation |
| **INCONCLUSIVE** ❓ | Both users failed | Check if baseline request is valid |
| **ERROR** ❌ | Test execution failed | Check logs and configuration |

### Risk Levels (M2 Tests)

- **CRITICAL**: DELETE operations (data loss)
- **HIGH**: PUT/PATCH operations (data modification)
- **MEDIUM**: POST operations (data creation)

## Common Credential Types

### Bearer Token (JWT)

```javascript
{
  type: "bearer",
  value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Session Cookie

```javascript
{
  type: "cookie",
  value: "session=abc123; userId=user1"
}
```

### API Key

```javascript
{
  type: "custom",
  headerName: "X-API-Key",
  value: "sk_live_abc123"
}
```

### Basic Auth

```javascript
{
  type: "basic",
  value: "YWRtaW46cGFzc3dvcmQxMjM="  // Base64 of "admin:password123"
}
```

## Tips and Best Practices

### 1. Start with Safe Mode (M2 Tests)

For M2 tests, enable safe mode initially:

```javascript
const config = {
  safeMode: true,  // Won't actually execute mutations
};
```

### 2. Test Different Resource IDs

Test multiple resource IDs to ensure consistent authorization:

```
GET /api/orders/12345  ← User 1's order
GET /api/orders/12346  ← User 1's another order
GET /api/orders/99999  ← Non-existent order
```

### 3. Test Edge Cases

- Access your own resources with both accounts
- Try accessing non-existent resources
- Test with expired/invalid tokens

### 4. Document Findings

When you find a vulnerability:
1. Note the exact endpoint and method
2. Record both User IDs
3. Capture response bodies
4. Document the expected vs actual behavior

### 5. Responsible Testing

- Test only on applications you have permission to test
- Avoid destructive operations on production data
- Use test/staging environments when possible
- Keep credentials secure and never commit them

## Troubleshooting

### "Both users failed (INCONCLUSIVE)"

**Cause**: The baseline request from User 1 is invalid

**Solution**: 
- Verify User 1's credentials are valid
- Check if the request endpoint exists
- Ensure the request parameters are correct

### "Test execution failed (ERROR)"

**Cause**: Network error, malformed request, or configuration issue

**Solution**:
- Check Caido console for detailed error messages
- Verify your credentials are properly formatted
- Ensure the target server is reachable

### Token Expires During Testing

**Solution**:
- Refresh tokens before each test session
- Use long-lived tokens for testing
- Consider automating token refresh

## Next Steps

- Read [Advanced Configuration](./advanced-config.md) for more features
- Explore batch testing for multiple endpoints
- Set up automated testing pipelines
- Integrate with bug bounty workflows

## Need Help?

- Check the main [README.md](../README.md)
- Review the workflow source code for customization options
- Open an issue on GitHub (if applicable)
