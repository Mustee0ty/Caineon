# CaineonJS Caido Workflow Integration Guide

Complete guide for integrating CaineonJS into Caido workflows and processing HTTP history for authorization testing.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Single Request Workflow](#single-request-workflow)
3. [Batch History Workflow](#batch-history-workflow)
4. [HTTP History Processing](#http-history-processing)
5. [Configuration Options](#configuration-options)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Step 1: Import CaineonJS into Caido

1. Open Caido
2. Go to **Workflows** → **Create New Workflow**
3. Choose **JavaScript** mode
4. Copy one of the workflow files:
   - `workflows/combined-workflow.js` (single request, auto-detect M1/M2)
   - `workflows/batch-history-workflow.js` (multiple requests from history)

### Step 2: Configure Credentials

Edit the credentials section in your workflow:

```javascript
const credentials = {
  user1: {
    type: "bearer",
    value: "YOUR_ADMIN_TOKEN_HERE",
    label: "Admin User (High Privilege)",
  },
  user2: {
    type: "bearer",
    value: "YOUR_USER_TOKEN_HERE",
    label: "Regular User (Low Privilege)",
  },
};
```

### Step 3: Run the Workflow

**For single request:**
- Send any HTTP request through the workflow
- Results appear in the console

**For batch history:**
- Select multiple requests in the history panel
- Run the workflow
- All requests are tested in one batch

---

## Single Request Workflow

### How It Works

```
1. User sends request through workflow
   ↓
2. Auto-detect test type (M1 or M2)
   ↓
3. Generate test specification
   ↓
4. Execute User 1 baseline request
   ↓
5. Execute User 2 mutated request
   ↓
6. Compare responses
   ↓
7. Display verdict: VULNERABLE / SECURE / ANOMALY
```

### Usage Example

```javascript
// 1. Capture a GET request
GET /api/users/123/profile

// 2. Send through workflow
// Automatically detected as M1 (Read operation)

// 3. Workflow performs:
// - User 1 (admin): GET /api/users/123/profile → 200 OK
// - User 2 (user): GET /api/users/123/profile → 403 Forbidden

// 4. Result: ✅ SECURE
```

### Supported Credential Types

#### Bearer Token (JWT)
```javascript
{
  type: "bearer",
  value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIn0.sig",
  label: "JWT Token"
}
```

#### Cookie
```javascript
{
  type: "cookie",
  value: "session=abc123; userId=user1",
  label: "Session Cookie"
}
```

#### API Key
```javascript
{
  type: "custom",
  headerName: "X-API-Key",
  value: "sk_live_abc123",
  label: "API Key"
}
```

#### Basic Auth
```javascript
{
  type: "basic",
  value: "YWRtaW46YWRtaW4xMjM=", // base64: admin:admin123
  label: "Basic Auth"
}
```

### Verdicts Explained

| Verdict | Meaning | Example | Risk |
|---------|---------|---------|------|
| **VULNERABLE** | User 2 accessed User 1's resource | Both return 200 → IDOR | 🚨 CRITICAL |
| **SECURE** | Authorization properly enforced | User 2 gets 403 | ✅ NONE |
| **ANOMALY** | User 2 succeeded where User 1 failed | Possible privilege escalation | ⚠️ CRITICAL |
| **INCONCLUSIVE** | Both requests failed | Baseline request invalid | ❓ UNKNOWN |

---

## Batch History Workflow

### How It Works

```
1. Select multiple requests from HTTP history
   ↓
2. Analyze request batch (report)
   ↓
3. Filter requests (remove static, non-auth, etc.)
   ↓
4. Sort by severity (IDOR indicators, mutation risk)
   ↓
5. Limit batch size (default: 20)
   ↓
6. Build test specifications
   ↓
7. Execute all tests
   ↓
8. Display results grouped by verdict
   ↓
9. Generate summary report
```

### Usage Example

**Scenario: Test authorization on entire API during pentest**

```bash
# 1. Perform manual testing of API
GET /api/users
GET /api/users/123
GET /api/users/123/posts
POST /api/users/123/profile
PATCH /api/orders/456
DELETE /api/settings/789

# 2. Switch to workflow view
# 3. Select all requests from history (Ctrl+A in history panel)
# 4. Run Batch History Workflow

# Output shows:
# ✅ Batch Analysis
#    Total: 6 requests
#    M1 (Read): 4
#    M2 (Write): 2
#
# 📋 Testing top 6 requests
#    [1/6] GET /api/users/123
#    🚨 VULNERABLE
#    [2/6] POST /api/users/123/profile
#    ✅ SECURE
#    ...
#
# 🚨 VULNERABILITIES FOUND: 2
#    1. GET /api/users/123
#       User 1: 200 | User 2: 200 → IDOR detected
#    2. PATCH /api/orders/456
#       User 1: 200 | User 2: 200 → Cross-account modification
```

### Batch Configuration

```javascript
const config = {
  // Request filtering
  filters: {
    excludePaths: ["/static/", "/cdn/", "/assets/"],
    hasAuth: true,                          // Only auth'd requests
    statusCodeRange: [200, 299],            // Only successful
    excludeMethods: ["OPTIONS", "HEAD"],
  },
  
  // Sorting
  sortBy: "severity",    // Options: method, path, host, severity, testType
  sortOrder: "desc",     // desc = highest risk first
  
  // Batch limits
  maxRequests: 20,
  minSeverityScore: 40,
  
  // Safety
  safeMode: false,
  blockM2Delete: true,   // Prevent DELETE operations
  
  // Output
  verboseLogging: true,
  generateReport: true,
};
```

### Output Format

```
📊 Request Batch Analysis
────────────────────────────────────────────────────────────
Total Requests: 47

By HTTP Method:
  GET: 28
  POST: 12
  PATCH: 5
  DELETE: 2

By Test Type:
  M1 (Read): 32
  M2 (Write): 15

Authentication:
  With Auth Headers: 45
  Without Auth: 2

────────────────────────────────────────────────────────────

🚨 VULNERABILITIES FOUND: 3
────────────────────────────────────────────────────────────

1. GET /api/users/123/profile
   Type: M1
   Reason: User 2 accessed User 1's resource successfully
   User 1: 200 | User 2: 200

2. PATCH /api/orders/456/shipping
   Type: M2
   Reason: User 2 modified User 1's data
   User 1: 200 | User 2: 200

3. GET /api/posts/789/comments
   Type: M1
   Reason: User 2 accessed User 1's data
   User 1: 200 | User 2: 200

⚠️  ANOMALIES DETECTED: 1
────────────────────────────────────────────────────────────

1. DELETE /api/sensitive-config/999
   Reason: User 2 succeeded where User 1 failed
   User 1: 403 | User 2: 200

✅ SECURE: 16

════════════════════════════════════════════════════════════

📋 FINAL SUMMARY
════════════════════════════════════════════════════════════
Total Tests: 20
🚨 Vulnerable: 3 (15%)
✅ Secure: 16
⚠️  Anomalies: 1
❓ Inconclusive: 0
❌ Errors: 0

🚨 ACTION REQUIRED: 3 authorization vulnerability(ies) detected!
```

---

## HTTP History Processing

### Using History Handler Directly

The `history-handler.js` module provides functions for processing HTTP history programmatically.

#### Filter Requests

```javascript
import { filterHistory } from "../src/utils/history-handler.js";

// Get only API requests with authentication
const filtered = filterHistory(requests, {
  includePaths: ["/api/"],
  hasAuth: true,
  excludePaths: ["/static/", "/cdn/"],
  statusCodeRange: [200, 299],
});
```

#### Sort by Severity

```javascript
import { sortHistory } from "../src/utils/history-handler.js";

// Sort by risk level (highest first)
const sorted = sortHistory(filtered, "severity", "desc");

// Sort by path (for grouping)
const byPath = sortHistory(filtered, "path", "asc");
```

#### Group Requests

```javascript
import { groupHistory } from "../src/utils/history-handler.js";

// Group by HTTP method
const byMethod = groupHistory(filtered, "method");
console.log(byMethod.GET.length);    // 45
console.log(byMethod.POST.length);   // 23

// Group by test type
const byType = groupHistory(filtered, "testType");
console.log(byType.M1.length);       // 32
console.log(byType.M2.length);       // 15
```

#### Get Recommendations

```javascript
import { recommendRequests } from "../src/utils/history-handler.js";

// Get high-value requests for testing
const candidates = recommendRequests(requests, {
  minScore: 40,
  limit: 20,
  includeM2: true,
  excludeStatic: true,
});
// Returns 20 most likely candidates for authorization issues
```

#### Build Test Batch

```javascript
import { buildTestBatch } from "../src/utils/history-handler.js";

// Convert requests to test specifications
const tests = buildTestBatch(filtered, {
  filterM1: false,    // Include both M1 and M2
  limit: 20,
  dedup: true,        // Remove duplicates
  sort: "severity",
});

// Now execute tests with executor.executeBatch()
```

#### Analyze Batch

```javascript
import { analyzeRequestBatch } from "../src/utils/history-handler.js";

const analysis = analyzeRequestBatch(requests);

console.log(analysis.totalRequests);
console.log(analysis.byMethod);           // { GET: 45, POST: 23, ... }
console.log(analysis.byTestType);         // { M1: 32, M2: 15 }
console.log(analysis.pathPatterns);       // Unique API patterns
console.log(analysis.recommendations);    // High priority count
```

---

## Configuration Options

### Credential Configuration

#### Environment Variables

Instead of hardcoding credentials, use environment variables:

```bash
export CAINEON_USER1_TYPE=bearer
export CAINEON_USER1_VALUE=eyJhbGci...
export CAINEON_USER2_TYPE=bearer
export CAINEON_USER2_VALUE=eyJhbGci...
```

Then load in workflow:

```javascript
import { loadFromEnvironment } from "../src/config/credentials.js";

const credentials = loadFromEnvironment();
```

#### Credential Helpers

```javascript
import {
  createBearerCredentials,
  createCookieCredentials,
  createCustomHeaderCredentials,
  createBasicAuthCredentials,
} from "../src/config/credentials.js";

// JWT/Bearer tokens
const jwt = createBearerCredentials(
  "admin_token_123",
  "user_token_456"
);

// Cookies
const cookies = createCookieCredentials(
  "session=admin123; userId=1",
  "session=user456; userId=2"
);

// API Keys
const apiKeys = createCustomHeaderCredentials(
  "X-API-Key",
  "sk_admin_123",
  "sk_user_456"
);

// Basic Auth
const basic = createBasicAuthCredentials(
  "admin", "admin123",
  "user", "user123"
);
```

### Filter Options

```javascript
const filters = {
  // Include requests matching these paths
  includePaths: ["/api/", "/data/"],
  
  // Exclude requests matching these paths
  excludePaths: ["/static/", "/cdn/", "/assets/"],
  
  // Specific HTTP methods
  methods: ["GET", "POST", "PATCH"],
  
  // Hosts to test
  hosts: ["api.example.com"],
  
  // Status code range (request response)
  statusCodeRange: [200, 299],
  
  // Must have authentication header
  hasAuth: true,
  
  // Content types
  contentTypes: ["application/json"],
  
  // Custom filter function
  custom: (request, meta) => {
    return meta.path.includes("/users");
  },
};
```

### Severity Calculation

Severity score (0-100) is calculated based on:

- **M2 operations** (+50): Mutations are higher risk
- **DELETE** (+30): Highest risk mutation
- **PATCH** (+20): Modification operations
- **API endpoint patterns** (+20): `/api/*/id` patterns are IDOR candidates
- **Data endpoints** (+10): Non-static resources
- **Has auth** (+5): Relevant for testing

**Example scores:**
- `GET /api/users/123` → 40 (read with ID pattern)
- `POST /api/orders` → 55 (mutation)
- `PATCH /api/users/456/profile` → 65 (M2 with ID)
- `DELETE /api/settings/789` → 95 (critical mutation)

---

## Advanced Usage

### Custom Test Batch Workflow

```javascript
// Create custom workflow combining history processing + testing

import { recommendRequests, buildTestBatch } from "../src/utils/history-handler.js";
import { executeBatch, generateReport } from "../src/core/executor.js";

export async function run({ requests }, sdk) {
  // Get intelligent recommendations
  const candidates = recommendRequests(requests, {
    minScore: 60,        // Only high-risk requests
    limit: 10,
    includeM2: true,
  });
  
  // Build test specifications
  const tests = buildTestBatch(candidates, {
    sort: "severity",
    dedup: true,
  });
  
  // Execute all tests
  const results = await executeBatch(tests, credentials, sdk);
  
  // Generate report
  const report = generateReport(results);
  
  sdk.console.log(JSON.stringify(report, null, 2));
}
```

### Export Results to File

```javascript
// Add to batch workflow to export results

function exportResults(results) {
  const csv = [
    "Test Name,Type,Verdict,User1 Status,User2 Status,Reason"
  ];
  
  results.forEach(r => {
    csv.push(
      `${r.testName},${r.testType},${r.verdict},` +
      `${r.user1.status},${r.user2.status},"${r.reason}"`
    );
  });
  
  return csv.join("\n");
}

// Usage
const csvData = exportResults(results);
sdk.console.log(csvData);
```

### Filtering by Path Patterns

```javascript
import { filterHistory } from "../src/utils/history-handler.js";

// Only test user-related endpoints
const userEndpoints = filterHistory(requests, {
  custom: (req, meta) => /\/users\/\d+/.test(meta.path)
});

// Test all order operations
const orderOps = filterHistory(requests, {
  includePaths: ["/orders/"]
});

// Skip admin endpoints
const nonAdmin = filterHistory(requests, {
  excludePaths: ["/admin/", "/settings/"]
});
```

### Testing with Deduplication

```javascript
import { deduplicateRequests, buildTestBatch } from "../src/utils/history-handler.js";

// Many requests to same endpoint
const allRequests = [
  { method: "GET", url: "/api/users/1" },   // Same endpoint
  { method: "GET", url: "/api/users/1" },   // Duplicate
  { method: "GET", url: "/api/users/2" },   // Different ID
];

// Remove duplicates
const unique = deduplicateRequests(allRequests);
// Results: 2 unique requests

// Build batch from unique
const tests = buildTestBatch(unique);
```

---

## Troubleshooting

### Issue: "No requests provided"

**Cause:** Workflow called with no requests

**Solution:**
- For single request: Send a request through the workflow
- For batch: Select requests in history before running workflow

### Issue: Requests are blocked by "blockCriticalOps"

**Cause:** DELETE operations are blocked by safety configuration

**Solution:**
```javascript
// In workflow config
const config = {
  blockCriticalOps: false  // Disable if you want to test DELETEs
};
```

### Issue: All requests filtered out

**Cause:** Filter criteria too strict

**Debug:**
```javascript
sdk.console.log(`Total: ${requests.length}`);
const filtered = filterHistory(requests, config.filters);
sdk.console.log(`After filter: ${filtered.length}`);
```

**Solutions:**
- Loosen `statusCodeRange`
- Remove `hasAuth` requirement
- Simplify `excludePaths`

### Issue: Credentials not working

**Check:**
1. Correct credential type in configuration
2. Token/key not expired
3. Bearer token format: `Bearer <token>` (not `Bearer: <token>`)
4. Cookie format: `name=value; name2=value2`

### Issue: Empty results

**Cause:** All tests executed but no results returned

**Debug:**
```javascript
sdk.console.log(`Tests built: ${tests.length}`);
const results = await executeBatch(tests, credentials, sdk);
sdk.console.log(`Results: ${results.length}`);
```

### Issue: Workflow timeout

**Cause:** Too many requests in batch

**Solution:**
```javascript
const config = {
  maxRequests: 10  // Reduce from default 20
};
```

---

## Next Steps

1. **Configure your credentials** - Set User 1 and User 2 tokens
2. **Test single request** - Start with combined-workflow.js
3. **Try batch testing** - Use batch-history-workflow.js with history
4. **Export findings** - Integrate with your reporting system
5. **Automate testing** - Create custom workflows for your API

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review example configurations in `examples/`
3. Examine workflow comments for inline documentation
4. Test with `verboseLogging: true` to see detailed logs
