# CaineonJS Caido Integration - Quick Start (5 minutes)

Get up and running with CaineonJS Caido workflows in 5 minutes.

---

## 🎯 What You'll Do

1. **Single Request Testing** - Test one endpoint for authorization bypass
2. **Batch History Testing** - Test 20+ endpoints at once
3. **Get Results** - See vulnerabilities immediately

---

## ⚡ In 5 Minutes

### Step 1: Get Your Credentials (1 min)

You need **two** user accounts for testing:

- **User 1**: Admin or high-privilege account
- **User 2**: Regular or low-privilege account

From these accounts, get authentication tokens (pick one format):
- Bearer tokens (JWT)
- Session cookies
- API keys

Example:
```
USER1_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.USER1..."
USER2_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.USER2..."
```

### Step 2: Open Caido & Create Workflow (2 min)

1. Open **Caido**
2. Go to **Workflows** panel
3. Click **Create New Workflow**
4. Choose **JavaScript**

### Step 3: Import Workflow (1 min)

**For Single Request Testing:**

Copy entire content from:
```
workflows/combined-workflow.js
```

Paste into Caido workflow editor.

**For Batch History Testing:**

Copy entire content from:
```
workflows/batch-history-workflow.js
```

Paste into Caido workflow editor.

### Step 4: Update Credentials (1 min)

Find this section in the workflow:

```javascript
const credentials = {
  user1: {
    type: "bearer",
    value: "YOUR_TOKEN_HERE",
  },
  user2: {
    type: "bearer",
    value: "YOUR_TOKEN_HERE",
  },
};
```

Replace with your actual tokens:

```javascript
const credentials = {
  user1: {
    type: "bearer",
    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.USER1_TOKEN_HERE",
  },
  user2: {
    type: "bearer",
    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.USER2_TOKEN_HERE",
  },
};
```

### Step 5: Test (0 min - instant!)

**Single Request:**
1. Send any HTTP request
2. It tests automatically
3. Get verdict: VULNERABLE / SECURE / ANOMALY

**Batch History:**
1. Explore your API normally (capture requests)
2. Select all requests in history (Ctrl+A)
3. Run the workflow
4. Get full report

---

## 🚨 Expected Output

### Single Request Result

```
🤖 CaineonJS Auto-Detection: GET /api/users/123

✅ Detected: M1 (Cross-Account Read)

────────────────────────────────────────────────────────────
🚨 VERDICT: VULNERABLE
────────────────────────────────────────────────────────────

📝 Reason: User 2 accessed User 1's resource successfully

👤 User 1 Status: 200
👤 User 2 Status: 200

This is a security vulnerability!
```

### Batch Result Summary

```
📊 Batch Analysis
Total: 47 requests
Testing: 20 (highest risk)

🚨 VULNERABILITIES FOUND: 3
  1. GET /api/users/123/profile
  2. PATCH /api/orders/456/shipping
  3. GET /api/posts/789/comments

✅ SECURE: 16
⚠️  ANOMALIES: 1

Total Vulnerable: 3 (15%)
```

---

## 🔧 Troubleshooting (Quick Fixes)

### "No requests provided"
- Single workflow: Send a request first
- Batch workflow: Select requests in history

### Workflow doesn't execute
- Check credentials section exists
- Verify JSON syntax is valid
- Ensure tokens are not expired

### Token format wrong
- Bearer: `eyJhbGci...`
- Cookie: `session=abc123; userId=1`
- API Key: `sk_live_abc123`
- Basic: Base64 encoded `user:pass`

### All requests filtered out
- Reduce `minSeverityScore` from 40 to 20
- Set `hasAuth: false` in filters
- Remove status code range filter

---

## 📚 Next Steps

Want to dive deeper?

| Goal | Document |
|------|----------|
| Detailed setup | `WORKFLOW_SETUP.md` |
| Function reference | `examples/http-history-quick-reference.md` |
| Practical examples | `examples/workflow-examples.md` |
| Complete guide | `examples/caido-integration-guide.md` |

---

## 🎓 What Gets Tested

### M1 Tests (Read Operations)
- User 2 tries to **read** User 1's data
- **Vulnerable if:** User 2 gets same data as User 1
- **Detected in:** GET requests

### M2 Tests (Write Operations)
- User 2 tries to **modify** User 1's data
- **Vulnerable if:** User 2 can change User 1's data
- **Detected in:** POST, PUT, PATCH, DELETE requests

### Examples

```
GET /api/users/123 → M1 test
  User 1: 200 (sees profile) | User 2: 200 (sees profile) → 🚨 VULNERABLE

POST /api/users/123 → M2 test
  User 1: 200 (updates profile) | User 2: 200 (updates profile) → 🚨 VULNERABLE

PATCH /api/orders/456 → M2 test
  User 1: 200 (updates order) | User 2: 403 (forbidden) → ✅ SECURE

DELETE /api/posts/789 → M2 test (highest risk)
  User 1: 200 (deletes) | User 2: 200 (deletes) → 🚨 CRITICAL
```

---

## 💡 Pro Tips

### Tip 1: Start Simple
- Test single endpoint first
- Then try batch on 5-10 requests
- Scale up gradually

### Tip 2: Safe Testing
By default, workflows:
- Don't execute dangerous DELETE operations
- Can run in "safe mode" (no mutations)
- Block critical changes

### Tip 3: Different Auth Types
Workflows support:
- JWT/Bearer tokens
- Cookies
- API keys
- Basic auth

Just change the `type` field!

### Tip 4: Filter Smart
Batch workflow automatically excludes:
- `/static/`, `/cdn/` (static assets)
- Non-authenticated requests
- Failed responses (non-200)

### Tip 5: Severity Matters
Tests sorted by risk:
1. DELETE operations (highest risk)
2. PATCH operations (medium risk)
3. POST operations (medium risk)
4. GET operations (lower risk)

Tests highest risk first!

---

## 📊 Batch Testing Benefits

Instead of testing 5-10 endpoints:
- ❌ Manual process, slow
- ❌ Miss edge cases
- ❌ Boring repetitive work

With CaineonJS batch:
- ✅ Test 20+ endpoints automatically
- ✅ Prioritized by risk
- ✅ Duplicate removal
- ✅ Full report in seconds

Example: 50 requests → 20 tested → 3 vulnerabilities found in 45 seconds

---

## 🚀 Common Scenarios

### Scenario 1: Quick Authorization Check
```
Send: GET /api/users/123
→ Auto-test with User 2
→ Verdict in console
→ Done!
```

### Scenario 2: Full API Audit
```
Explore API → Capture requests → Select all → Run batch
→ Prioritized vulnerabilities → Full report
```

### Scenario 3: IDOR Hunting
```
Batch workflow finds endpoints with `/resource/{id}`
→ Auto-prioritizes
→ Tests with User 2
→ IDOR vulnerabilities highlighted
```

---

## 🔐 Security

### Credentials Are Safe
- Stored locally in your workflow
- Never sent anywhere except to your API
- You control token scope

### Testing Is Safe
- Safe mode prevents mutations
- DELETE operations blocked by default
- Configure restrictions as needed

### Data Is Protected
- Response bodies truncated (500 chars)
- Secrets not logged
- Results stay in Caido console

---

## 📞 Get Help

### Quick Questions
See: `examples/http-history-quick-reference.md`

### How It Works
See: `examples/caido-integration-guide.md`

### Examples
See: `examples/workflow-examples.md`

### Stuck?
See: `WORKFLOW_SETUP.md#troubleshooting`

---

## ✅ Checklist

- [ ] Have two user accounts ready
- [ ] Got auth tokens for both users
- [ ] Opened Caido
- [ ] Created new JavaScript workflow
- [ ] Copied workflow content
- [ ] Updated credentials
- [ ] Tested with single request
- [ ] Tried batch history workflow
- [ ] Found vulnerabilities (or confirmed security)

---

## 🎉 You're Done!

That's it! You're now testing authorization with CaineonJS.

**Next:**
- Use in your security testing routine
- Adapt for your API
- Share results with your team

---

## One More Thing

The workflows are **production-ready**:
- ✅ Error handling
- ✅ Safety controls
- ✅ Detailed logging
- ✅ Performance optimized
- ✅ All auth types supported

No additional setup needed. Just copy, configure, and test!

---

**Happy testing!** 🚀

For more details → `WORKFLOW_SETUP.md`
