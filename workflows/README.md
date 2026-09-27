# CaineonJS Workflows for Caido

Ready-to-use JavaScript workflows for authorization testing in Caido.

---

## 📋 Available Workflows

### 1. **combined-workflow.js** - Recommended Starting Point
**Purpose:** Single request testing with automatic M1/M2 detection

**What it does:**
- Accepts any HTTP request
- Auto-detects if it's a read (M1) or write (M2) operation
- Tests with User 1 and User 2 credentials
- Shows detailed verdict and response comparison
- Highlights security vulnerabilities

**When to use:**
- Quick authorization checks on individual endpoints
- Exploratory testing during API review
- Verify specific authorization controls

**Example:**
```
Send: GET /api/users/123
↓
Workflow detects: M1 (Read operation)
↓
Executes:
  User 1: GET /api/users/123 → 200 OK
  User 2: GET /api/users/123 → 200 OK (mutated credentials)
↓
Verdict: 🚨 VULNERABLE (User 2 can read User 1's data)
```

**Output:**
- Real-time console feedback
- Verdict: VULNERABLE / SECURE / ANOMALY
- Detailed response comparison
- Severity assessment

---

### 2. **batch-history-workflow.js** - NEW! Batch Processing
**Purpose:** Test multiple requests from HTTP history

**What it does:**
- Accepts multiple requests from history
- Analyzes and filters requests intelligently
- Sorts by severity (highest risk first)
- Auto-detects M1 vs M2 for each request
- Tests prioritized batch
- Generates comprehensive report

**When to use:**
- Complete API security audit
- Processing captured HTTP history
- Large-scale authorization testing
- Regression testing

**Example:**
```
Select 50 requests from history
↓
Workflow analyzes:
  - Filters to 30 relevant (removes /static/, non-auth)
  - Scores by severity (IDOR patterns, mutations)
  - Sorts highest-risk first
↓
Tests top 20 by priority
↓
Reports:
  🚨 3 vulnerabilities found
  ✅ 16 secure
  ⚠️ 1 anomaly
```

**Output:**
- Batch analysis report
- Vulnerability summary
- Results by verdict
- Final statistics

---

### 3. **m1-workflow.js** - M1 Specific
**Purpose:** Test read operations only

**What it does:**
- Tests only M1 (GET, HEAD, OPTIONS) operations
- Focuses on data access control
- Optimized for read authorization testing

**When to use:**
- Testing read-only APIs
- Focusing on data disclosure vulnerabilities
- Quick M1-only audit

---

### 4. **m2-workflow.js** - M2 Specific
**Purpose:** Test write operations only

**What it does:**
- Tests only M2 (POST, PUT, PATCH, DELETE) operations
- Focuses on mutation authorization
- Can include rollback capabilities

**When to use:**
- Testing write-heavy APIs
- Focusing on modification vulnerabilities
- Careful testing (high risk operations)

---

## 🚀 Quick Start

### Step 1: Choose Your Workflow

| Scenario | Workflow |
|----------|----------|
| Single endpoint test | `combined-workflow.js` |
| Batch API audit | `batch-history-workflow.js` |
| Read-only testing | `m1-workflow.js` |
| Write operation testing | `m2-workflow.js` |

### Step 2: Import to Caido

1. Open Caido
2. **Workflows** panel
3. **Create New Workflow** → JavaScript
4. Copy entire content from chosen workflow file
5. Paste into editor

### Step 3: Configure Credentials

Find and update:
```javascript
const credentials = {
  user1: {
    type: "bearer",
    value: "YOUR_ADMIN_TOKEN_HERE",
  },
  user2: {
    type: "bearer",
    value: "YOUR_USER_TOKEN_HERE",
  },
};
```

### Step 4: Run

**Single request:**
- Send any HTTP request
- Results show in console

**Batch:**
- Select requests in history
- Run workflow
- Full report appears

---

## 🔧 Configuration

### Credential Types

All workflows support multiple authentication methods:

#### Bearer Token (JWT, OAuth)
```javascript
{
  type: "bearer",
  value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
}
```

#### Cookie
```javascript
{
  type: "cookie",
  value: "session=abc123; userId=1",
}
```

#### API Key (Custom Header)
```javascript
{
  type: "custom",
  headerName: "X-API-Key",
  value: "sk_live_abc123",
}
```

#### Basic Auth
```javascript
{
  type: "basic",
  value: "YWRtaW46cGFzc3dvcmQ=", // base64: admin:password
}
```

### Batch Workflow Options

```javascript
const config = {
  // Request filtering
  filters: {
    excludePaths: ["/static/", "/cdn/"],  // Skip static assets
    hasAuth: true,                         // Only auth'd requests
    statusCodeRange: [200, 299],           // Only 2xx responses
  },
  
  // Sorting and prioritization
  sortBy: "severity",  // Options: method, path, host, severity, testType
  sortOrder: "desc",   // desc = highest risk first
  
  // Batch limits
  maxRequests: 20,     // Test top 20 by severity
  minSeverityScore: 40, // Minimum score to include
  
  // Safety features
  safeMode: false,     // true = no actual mutations
  blockM2Delete: true, // true = prevent DELETE operations
  
  // Output
  verboseLogging: true,
  generateReport: true,
};
```

---

## 📊 Understanding Results

### Verdicts

| Verdict | Meaning | Example | Risk |
|---------|---------|---------|------|
| **VULNERABLE** | Authorization bypass detected | User 2 can access User 1's data | 🚨 HIGH |
| **SECURE** | Authorization properly enforced | User 2 gets 403 Forbidden | ✅ NONE |
| **ANOMALY** | Unexpected behavior | User 2 succeeded, User 1 failed | ⚠️ CRITICAL |
| **INCONCLUSIVE** | Cannot determine | Both requests failed | ❓ UNKNOWN |

### Example Response

```
────────────────────────────────────────────────────────────
🚨 VERDICT: VULNERABLE
────────────────────────────────────────────────────────────
📝 Reason: User 2 accessed User 1's resource successfully

📊 Response Comparison:
   
   👤 User 1 (Baseline):
      Status: 200
      Body: {"userId":123,"email":"user1@example.com",...}
   
   👤 User 2 (Test):
      Status: 200
      Body: {"userId":123,"email":"user1@example.com",...}

🚨 AUTHORIZATION BYPASS DETECTED!
   User 2 can READ User 1's data
   Severity: HIGH
```

---

## 🛡️ Safety Features

### Automatic Safety Controls
- ✅ DELETE operations blocked by default
- ✅ Safe mode available (no mutations execute)
- ✅ Response bodies truncated (500 char limit)
- ✅ Credentials not logged
- ✅ Configurable limits

### How to Enable Safe Mode

```javascript
const config = {
  safeMode: true,      // Mutations won't actually execute
  blockM2Delete: true, // Prevent DELETE operations
};
```

### Blocking Specific Operations

```javascript
// In batch-history-workflow.js config:
if (config.blockM2Delete && isM2Candidate(test) && test.method === "DELETE") {
  sdk.console.log(`⏭️ Skipped: DELETE operation (blocked by config)`);
  continue;  // Skip this test
}
```

---

## 📝 Workflow Types

### M1 (Cross-Account Read)
Tests whether User 2 can **read** User 1's data.

**Tested in:** GET, HEAD, OPTIONS requests

**Example:**
```
GET /api/users/123/profile
→ User 1: 200 OK (sees profile)
→ User 2: 200 OK (should be 403!)
→ VULNERABLE: IDOR detected
```

### M2 (Cross-Account Write/Mutation)
Tests whether User 2 can **modify** User 1's data.

**Tested in:** POST, PUT, PATCH, DELETE requests

**Example:**
```
PATCH /api/orders/456/shipping
→ User 1: 200 OK (updates)
→ User 2: 200 OK (should be 403!)
→ VULNERABLE: Cross-account modification
```

**Risk Levels:**
- DELETE: CRITICAL
- PATCH: HIGH
- POST: MEDIUM
- PUT: HIGH

---

## 🎯 Severity Scoring

Batch workflow prioritizes by severity (0-100 scale):

```
M2 operations:          +50
DELETE method:          +30
PATCH method:           +20
API ID pattern:         +20
Data endpoint:          +10
Auth header:            +5
────────────────
Maximum:               100
```

**Examples:**
- `GET /api/users/123` → 40 (read with ID)
- `POST /api/orders` → 55 (mutation)
- `DELETE /api/config/789` → 95 (critical)

Tests highest-risk endpoints first!

---

## 💡 Usage Examples

### Example 1: Test Single Endpoint
```
Workflow: combined-workflow.js
1. Configure credentials
2. Send: GET /api/users/123
3. Get verdict: VULNERABLE / SECURE
```

### Example 2: Full API Audit
```
Workflow: batch-history-workflow.js
1. Configure credentials
2. Explore API (capture 50+ requests)
3. Select all in history
4. Get: Prioritized vulnerabilities + report
```

### Example 3: Focused Testing
```
Workflow: m2-workflow.js
1. Configure credentials
2. Send: POST /api/users
3. Send: PATCH /api/users/123
4. Send: DELETE /api/data/456
5. Get verdicts for mutations only
```

---

## 🔍 Troubleshooting

### "No requests provided"
**Solution:**
- Single workflow: Send a request first
- Batch workflow: Select requests in history before running

### Workflow not executing
**Check:**
1. Credentials object is defined
2. JSON syntax is valid
3. Tokens are not expired
4. User 1 and User 2 are different accounts

### All results filtered out
**Solution:**
- Lower `minSeverityScore` (from 40 to 20)
- Set `hasAuth: false` in filters
- Remove `statusCodeRange` filter

### Timeout during batch
**Solution:**
- Reduce `maxRequests` (from 20 to 10)
- Filter out more requests
- Use m1-workflow or m2-workflow for smaller batches

---

## 📚 Documentation

For more information:

| Document | Content |
|----------|---------|
| `QUICKSTART.md` | 5-minute setup guide |
| `WORKFLOW_SETUP.md` | Complete setup & config |
| `../examples/caido-integration-guide.md` | Detailed guide |
| `../examples/http-history-quick-reference.md` | Function reference |
| `../examples/workflow-examples.md` | Practical examples |

---

## 🚀 Key Features

✅ Auto-detection (M1 vs M2)
✅ Multiple auth types supported
✅ Batch processing with prioritization
✅ Real-time verdict display
✅ Comprehensive reporting
✅ Safety controls (no accidental deletion)
✅ Error handling
✅ Detailed logging
✅ Performance optimized

---

## 📊 Performance

| Workflow | Requests | Time | Output |
|----------|----------|------|--------|
| combined | 1 | 2-3s | Single verdict |
| batch | 20 | 30-45s | Full report |
| m1-only | 10 | 15s | Read tests |
| m2-only | 5 | 10s | Write tests |

---

## ✨ Next Steps

1. ✅ Pick a workflow
2. ✅ Get credentials
3. ✅ Import to Caido
4. ✅ Configure tokens
5. ✅ Run on your API
6. ✅ Review findings

---

## 📞 Support

All workflows have inline comments explaining logic.

For questions:
- See documentation files in `../examples/`
- Check `QUICKSTART.md` for common issues
- Review `WORKFLOW_SETUP.md#troubleshooting`

---

**Ready to test?** Start with `combined-workflow.js` for a single endpoint, then try `batch-history-workflow.js` for comprehensive testing!
