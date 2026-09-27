# CaineonJS Caido Workflow Setup & HTTP History Integration

Complete setup guide for Caido workflow integration with HTTP history processing for authorization testing.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Workflow Types](#workflow-types)
- [HTTP History Processing](#http-history-processing)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

CaineonJS now supports:

1. **Single Request Workflows** - Test one request at a time
   - Auto-detect M1 (read) vs M2 (write)
   - Real-time verdict in console
   - File: `workflows/combined-workflow.js`

2. **Batch History Workflows** - Test multiple requests from HTTP history
   - Intelligent filtering and sorting
   - Severity-based prioritization
   - IDOR detection
   - File: `workflows/batch-history-workflow.js`

3. **HTTP History Processing Module** - Programmatic request handling
   - Filter, sort, group requests
   - Deduplicate requests
   - Generate analysis reports
   - Module: `src/utils/history-handler.js`

---

## Setup Instructions

### Step 1: Prepare Your Credentials

Get tokens for two users:
- **User 1**: High-privilege account (admin, owner, etc.)
- **User 2**: Low-privilege account (regular user)

**Token types supported:**
- Bearer tokens (JWT)
- Cookies
- API keys
- Basic auth

### Step 2: Create Caido Workflow

1. Open Caido
2. Go to **Workflows** panel
3. Click **Create New Workflow**
4. Choose **JavaScript**

### Step 3: Copy Workflow Content

Choose based on your needs:

#### Single Request Testing

Copy from `workflows/combined-workflow.js`:

```javascript
// Paste entire content here
import { M1, isM1Candidate } from "../src/core/m1.js";
import { M2, isM2Candidate, getMutationRisk } from "../src/core/m2.js";
// ... rest of file
```

#### Batch History Testing

Copy from `workflows/batch-history-workflow.js`:

```javascript
// Paste entire content here
import {
  filterHistory,
  sortHistory,
  // ... etc
```

### Step 4: Configure Credentials

Update the credentials section:

```javascript
const credentials = {
  user1: {
    type: "bearer",  // or "cookie", "custom", "basic"
    value: "YOUR_ACTUAL_TOKEN_HERE",
    label: "Admin User",
  },
  user2: {
    type: "bearer",
    value: "YOUR_ACTUAL_TOKEN_HERE",
    label: "Regular User",
  },
};
```

### Step 5: Run Workflow

**Single request:**
- Send any HTTP request
- It will be tested automatically

**Batch history:**
- Select multiple requests in history
- Run workflow
- All get tested

---

## Workflow Types

### 1. Combined Workflow (Single Request)

**File:** `workflows/combined-workflow.js`

**When to use:**
- Testing individual requests
- Quick authorization checks
- Exploratory testing

**How it works:**
```
Request → Auto-detect M1/M2 → Execute both users → Compare → Verdict
```

**Output:**
```
🤖 CaineonJS Auto-Detection: GET /api/users/123

✅ Detected: M1 (Cross-Account Read)
📋 Test: M1-test-for-get-api-users-123
🎯 Mutation: Replace Authorization header with User 2 credentials

🔄 Executing test...

────────────────────────────────────────────────────────────
🚨 VERDICT: VULNERABLE
────────────────────────────────────────────────────────────
📝 Reason: User 2 accessed User 1's resource successfully

📊 Response Comparison:

   👤 User 1 (Baseline - High Privilege):
      Status: 200
      Body: {"userId":123,"email":"user1@example.com",...}

   👤 User 2 (Test Subject - Low Privilege):
      Status: 200
      Body: {"userId":123,"email":"user1@example.com",...}

🚨 AUTHORIZATION BYPASS DETECTED!
   User 2 can READ User 1's data
   Severity: HIGH
   This is a security vulnerability!
```

### 2. Batch History Workflow (Multiple Requests)

**File:** `workflows/batch-history-workflow.js`

**When to use:**
- Testing entire API during security assessment
- Processing captured HTTP history
- Comprehensive authorization audit

**How it works:**
```
Multiple Requests → Analyze → Filter → Sort by Severity
→ Deduplicate → Build Tests → Execute All → Generate Report
```

**Configuration:**
```javascript
const config = {
  filters: {
    excludePaths: ["/static/", "/cdn/"],
    hasAuth: true,
    statusCodeRange: [200, 299],
  },
  sortBy: "severity",
  maxRequests: 20,
  blockM2Delete: true,
};
```

**Output:**
```
📊 Request Batch Analysis
Total Requests: 47

By HTTP Method:
  GET: 28
  POST: 12
  PATCH: 5
  DELETE: 2

By Test Type:
  M1 (Read): 32
  M2 (Write): 15

[... more analysis ...]

🚨 VULNERABILITIES FOUND: 3
────────────────────────────────────────────────────────────

1. GET /api/users/123/profile
   User 1: 200 | User 2: 200 → IDOR

2. PATCH /api/orders/456/shipping
   User 1: 200 | User 2: 200 → Cross-account modification

3. GET /api/posts/789/comments
   User 1: 200 | User 2: 200 → Data access bypass

═══════════════════════════════════════════════════════════

📋 FINAL SUMMARY
Total Tests: 20
🚨 Vulnerable: 3 (15%)
✅ Secure: 16
⚠️  Anomalies: 1
❌ Errors: 0
```

---

## HTTP History Processing

### Functions Available

```javascript
import {
  filterHistory,        // Filter by criteria
  sortHistory,          // Sort by method, path, severity, etc.
  groupHistory,         // Group by method, path, test type, etc.
  deduplicateRequests,  // Remove duplicate requests
  recommendRequests,    // Get intelligent recommendations
  buildTestBatch,       // Convert to test specifications
  analyzeRequestBatch,  // Generate analysis report
} from "../src/utils/history-handler.js";
```

### Common Operations

#### Filter requests
```javascript
const filtered = filterHistory(requests, {
  includePaths: ["/api/"],
  excludePaths: ["/static/"],
  hasAuth: true,
  statusCodeRange: [200, 299],
});
```

#### Sort by severity (highest risk first)
```javascript
const sorted = sortHistory(filtered, "severity", "desc");
```

#### Get recommendations (intelligence filtering)
```javascript
const candidates = recommendRequests(requests, {
  minScore: 40,
  limit: 20,
});
```

#### Build test batch
```javascript
const tests = buildTestBatch(candidates, {
  limit: 15,
  dedup: true,
});
```

#### Analyze batch
```javascript
const analysis = analyzeRequestBatch(requests);
console.log(analysis.byMethod);        // Count by HTTP method
console.log(analysis.byTestType);      // M1 vs M2
console.log(analysis.recommendations); // High priority count
```

---

## Examples

### Example 1: Test Single Authorization Check

1. Send a request: `GET /api/users/123`
2. Open workflow (combined-workflow.js)
3. Configure credentials
4. Send request through workflow
5. Get verdict: VULNERABLE / SECURE / ANOMALY

### Example 2: Audit Entire API

1. Perform manual API exploration
2. Capture requests in Caido history
3. Select all requests (Ctrl+A in history)
4. Run batch-history-workflow.js
5. Get prioritized list of authorization issues

### Example 3: Test API Subset

```javascript
// Custom workflow to test only user endpoints

import { filterHistory, buildTestBatch } from "../src/utils/history-handler.js";
import { executeBatch } from "../src/core/executor.js";

export async function run({ requests }, sdk) {
  // Filter to user endpoints
  const userRequests = filterHistory(requests, {
    custom: (req, meta) => /\/users\//.test(meta.path)
  });
  
  // Build tests
  const tests = buildTestBatch(userRequests, { limit: 10 });
  
  // Execute
  const results = await executeBatch(tests, credentials, sdk);
  
  // Report
  const vulnerable = results.filter(r => r.verdict === "VULNERABLE");
  sdk.console.log(`Found ${vulnerable.length} authorization issues in /users/ endpoints`);
}
```

### Example 4: Export Results for Reporting

```javascript
// Add to workflow to export CSV

function resultsToCSV(results) {
  const rows = ["Test,Type,Verdict,User1,User2,Reason"];
  results.forEach(r => {
    rows.push(
      `${r.testName},${r.testType},${r.verdict},` +
      `${r.user1.status},${r.user2.status},"${r.reason}"`
    );
  });
  return rows.join("\n");
}

const csv = resultsToCSV(results);
sdk.console.log(csv);
// Copy to external file for reporting
```

---

## Request Filtering

### Filter by HTTP Method

```javascript
// Only read operations (safe to test)
filterHistory(requests, {
  methods: ["GET", "HEAD", "OPTIONS"]
});

// Only write operations (more risky)
filterHistory(requests, {
  methods: ["POST", "PUT", "PATCH", "DELETE"]
});
```

### Filter by Path Patterns

```javascript
// Only API endpoints
filterHistory(requests, {
  includePaths: ["/api/"]
});

// Exclude static assets
filterHistory(requests, {
  excludePaths: ["/static/", "/cdn/", "/assets/", ".css", ".js", ".png"]
});

// Only specific resource types
filterHistory(requests, {
  custom: (req, meta) => /\/api\/(users|orders|products)\/\d+/.test(meta.path)
});
```

### Filter by Authentication

```javascript
// Only authenticated requests
filterHistory(requests, {
  hasAuth: true
});

// Only successful requests
filterHistory(requests, {
  statusCodeRange: [200, 299]
});
```

---

## Severity Scoring

Requests are scored (0-100) based on risk indicators:

```
M2 (write) operations:     +50
DELETE method:             +30
PATCH method:              +20
API endpoint with ID:      +20
Data endpoint (not static):+10
Has auth header:           +5
────────────────────────────
Maximum score:             100
```

**Examples:**
- `GET /api/users/123` → 40 (read + ID)
- `POST /api/orders` → 55 (mutation)
- `DELETE /api/settings/789` → 95 (critical)

---

## Credential Configuration

### Bearer Token (JWT)

```javascript
{
  type: "bearer",
  value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
}
```

### Cookie

```javascript
{
  type: "cookie",
  value: "session=abc123; userId=user1; preferences=dark"
}
```

### API Key (Custom Header)

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
  value: "YWRtaW46YWRtaW4xMjM=" // base64: admin:admin123
}
```

---

## Troubleshooting

### "No requests provided"

**Problem:** Workflow shows this message

**Solution:**
- Single workflow: Send a request first
- Batch workflow: Select requests in history before running

### Requests filtered out / empty results

**Problem:** All requests removed by filters

**Debug:**
```javascript
sdk.console.log(`Before filter: ${requests.length}`);
const filtered = filterHistory(requests, config.filters);
sdk.console.log(`After filter: ${filtered.length}`);
```

**Solution:**
- Loosen `excludePaths`
- Change `statusCodeRange`
- Set `hasAuth: false`

### Credentials not working

**Check:**
1. Token/key format correct for type
2. Token not expired
3. Bearer format: `Bearer <token>` (not `Bearer: <token>`)
4. Cookie format: `name=value; name2=value2`

**Test:**
```javascript
sdk.console.log("User 1 cred:", maskCredentials(credentials).user1);
sdk.console.log("User 2 cred:", maskCredentials(credentials).user2);
```

### Timeout during batch testing

**Problem:** Workflow times out with many requests

**Solution:** Reduce batch size
```javascript
const config = {
  maxRequests: 10  // Was 20
};
```

### No verdicts showing

**Problem:** Requests execute but no results appear

**Solution:**
1. Check credentials are valid
2. Verify endpoints are responding
3. Check for network errors in console
4. Increase `verboseLogging: true`

---

## Performance Tips

1. **Deduplicate first** - Remove duplicate requests before testing
2. **Filter early** - Exclude static assets and non-auth endpoints
3. **Limit batch** - Keep to 20-30 requests per batch
4. **Sort strategically** - Test highest-risk items first

```javascript
// Optimal order
const batch = buildTestBatch(
  deduplicateRequests(
    filterHistory(requests, {
      excludePaths: ["/static/", "/cdn/"],
      hasAuth: true
    })
  ),
  { limit: 20, sort: "severity" }
);
```

---

## Next Steps

1. ✅ Copy workflow to Caido
2. ✅ Configure credentials
3. ✅ Test with single request
4. ✅ Try batch history workflow
5. ✅ Document findings
6. ✅ Integrate with reporting

---

## Files Reference

```
CaineonJS/
├── workflows/
│   ├── combined-workflow.js          ← Single request auto-detect
│   └── batch-history-workflow.js     ← Batch history processing
├── src/
│   ├── core/
│   │   ├── m1.js
│   │   ├── m2.js
│   │   └── executor.js
│   ├── config/
│   │   └── credentials.js
│   └── utils/
│       ├── comparator.js
│       └── history-handler.js        ← NEW: Request processing
├── examples/
│   ├── caido-integration-guide.md    ← Comprehensive guide
│   ├── http-history-quick-reference.md ← Function reference
│   └── ...
└── WORKFLOW_SETUP.md                 ← This file
```

---

## API Reference

### History Handler Functions

```javascript
// Filter requests
filterHistory(requests, filters) → Array

// Sort requests
sortHistory(requests, sortBy, order) → Array

// Group requests
groupHistory(requests, groupBy) → Object

// Deduplicate
deduplicateRequests(requests) → Array

// Get recommendations
recommendRequests(requests, options) → Array

// Build test batch
buildTestBatch(requests, options) → Array

// Analyze batch
analyzeRequestBatch(requests) → Object

// Extract metadata
extractRequestMetadata(request) → Object
```

---

## Support

For detailed information, see:
- `examples/caido-integration-guide.md` - Complete guide
- `examples/http-history-quick-reference.md` - Function reference
- Workflow files have inline comments

Questions? Check the troubleshooting section or review example configurations.
