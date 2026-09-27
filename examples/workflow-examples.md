# CaineonJS Workflow Examples

Practical examples for common testing scenarios with Caido integration.

---

## Table of Contents

1. [Basic Single Request Testing](#basic-single-request-testing)
2. [Batch History Analysis](#batch-history-analysis)
3. [Custom Filtering](#custom-filtering)
4. [Advanced Patterns](#advanced-patterns)
5. [Real-World Scenarios](#real-world-scenarios)

---

## Basic Single Request Testing

### Example 1: Test a Simple GET Request

**Scenario:** Testing if User 2 can read User 1's profile

```
Request:
GET /api/users/123/profile
Authorization: Bearer USER1_TOKEN

Expected:
User 1: 200 OK (sees own profile)
User 2: 403 Forbidden (cannot see other's profile)

Actual:
User 1: 200 OK
User 2: 200 OK → 🚨 VULNERABLE
```

**Steps:**
1. Capture request in Caido: `GET /api/users/123/profile`
2. Configure workflow with User 1 and User 2 tokens
3. Send request through workflow
4. Result: `🚨 VULNERABLE - User 2 accessed User 1's resource`

### Example 2: Test a POST Request

**Scenario:** Testing if User 2 can modify User 1's data

```
Request:
POST /api/users/123/profile
Content-Type: application/json
Authorization: Bearer USER1_TOKEN

{
  "email": "newemail@example.com",
  "phone": "555-1234"
}

Expected:
User 1: 200 OK (updates own profile)
User 2: 403 Forbidden (cannot modify other's profile)

Actual:
User 1: 200 OK
User 2: 200 OK → 🚨 VULNERABLE
```

**Steps:**
1. Send POST request with User 1 token
2. Run through workflow
3. Workflow mutates auth to User 2 credentials
4. Result shows if User 2 can modify User 1's data

### Example 3: Test with Different Auth Types

#### Cookie-Based Auth

```javascript
const credentials = {
  user1: {
    type: "cookie",
    value: "sessionId=abc123def456; userId=1",
    label: "User 1"
  },
  user2: {
    type: "cookie",
    value: "sessionId=xyz789ghi012; userId=2",
    label: "User 2"
  }
};

// Workflow will replace Cookie header with User 2's session
```

#### API Key Auth

```javascript
const credentials = {
  user1: {
    type: "custom",
    headerName: "X-API-Key",
    value: "admin_key_abc123",
    label: "Admin Key"
  },
  user2: {
    type: "custom",
    headerName: "X-API-Key",
    value: "user_key_xyz789",
    label: "User Key"
  }
};
```

---

## Batch History Analysis

### Example 1: Test All API Endpoints

**Scenario:** Complete API audit for authorization issues

**Setup:**
```javascript
const config = {
  filters: {
    excludePaths: ["/static/", "/cdn/", "/assets/"],
    hasAuth: true,
    statusCodeRange: [200, 299],
  },
  maxRequests: 20,
  sortBy: "severity",
};
```

**Process:**
1. Manually explore API and capture all requests
2. Select all requests in Caido history (Ctrl+A)
3. Run batch-history-workflow
4. Workflow processes all 50+ requests:
   - Filters to 30 relevant requests
   - Sorts by risk (mutations first)
   - Tests top 20
   - Reports vulnerabilities

**Output:**
```
📊 Batch Analysis
Total: 50 requests
After filtering: 30 (removed /static/, /assets/, non-auth)
Testing: top 20 by severity

🚨 VULNERABILITIES FOUND: 3
  1. GET /api/users/123 (IDOR)
  2. PATCH /api/orders/456 (Cross-account modification)
  3. GET /api/posts/789/comments (Data leak)

✅ SECURE: 16
⚠️  ANOMALIES: 1
```

### Example 2: Focus on Write Operations

**Scenario:** Test only mutation endpoints for higher risk

```javascript
// Custom workflow focusing on M2

import { filterHistory, buildTestBatch } from "../src/utils/history-handler.js";
import { executeBatch } from "../src/core/executor.js";

export async function run({ requests }, sdk) {
  // Keep only mutation methods
  const mutations = filterHistory(requests, {
    methods: ["POST", "PUT", "PATCH", "DELETE"],
    hasAuth: true,
  });
  
  // Build batch
  const tests = buildTestBatch(mutations, {
    limit: 15,
    sort: "severity",
  });
  
  // Execute all M2 tests
  const results = await executeBatch(tests, credentials, sdk);
  
  // Focus on DELETE operations (highest risk)
  const deletes = results.filter(r => r.testName.includes("DELETE"));
  sdk.console.log(`DELETE operation vulnerabilities: ${deletes.length}`);
}
```

### Example 3: API Endpoint Grouping

**Scenario:** Organize testing by endpoint category

```javascript
import { groupHistory, sortHistory } from "../src/utils/history-handler.js";

export async function run({ requests }, sdk) {
  // Group by path pattern
  const grouped = groupHistory(requests, "path");
  
  // Analyze each group
  Object.entries(grouped).forEach(([path, reqs]) => {
    const sorted = sortHistory(reqs, "severity", "desc");
    sdk.console.log(`${path}: ${sorted.length} requests, testing top 3`);
    
    // Test top 3 from each group
    // ...
  });
}
```

---

## Custom Filtering

### Example 1: IDOR-Specific Filtering

**Scenario:** Test only endpoints with resource IDs (IDOR candidates)

```javascript
import { filterHistory } from "../src/utils/history-handler.js";

// Pattern matching for resource IDs
const idorCandidates = filterHistory(requests, {
  custom: (req, meta) => {
    // Match: /api/users/123, /api/orders/456, etc.
    const numericId = /\/[^/]+\/\d+/.test(meta.path);
    // Match: /api/resource/uuid-format
    const uuidId = /\/[^/]+\/[a-f0-9-]{36}/.test(meta.path);
    
    return (numericId || uuidId) && meta.hasAuthHeader;
  },
  statusCodeRange: [200, 299],
});
```

### Example 2: Exclude Admin & Health Endpoints

**Scenario:** Skip sensitive and non-critical endpoints

```javascript
const filtered = filterHistory(requests, {
  excludePaths: [
    "/admin/",
    "/health",
    "/ping",
    "/metrics",
    "/status",
    "/.well-known/",
    "/internal/",
    "/debug/",
  ],
  hasAuth: true,
});
```

### Example 3: Filter by Host for Multi-Tenant

**Scenario:** Test only specific API domain

```javascript
const filtered = filterHistory(requests, {
  custom: (req, meta) => {
    return meta.host === "api.example.com" ||
           meta.host === "api.staging.example.com";
  },
});
```

### Example 4: Content-Type Specific

**Scenario:** Test only JSON APIs

```javascript
const jsonApis = filterHistory(requests, {
  contentTypes: ["application/json"],
  custom: (req, meta) => {
    return !meta.path.includes("/graphql/") && // Skip GraphQL
           !meta.path.includes("/rpc/");        // Skip RPC
  },
});
```

---

## Advanced Patterns

### Pattern 1: Severity-Based Batch Execution

**Scenario:** Run tests in waves by risk level

```javascript
import { sortHistory, buildTestBatch } from "../src/utils/history-handler.js";

export async function run({ requests }, sdk) {
  const sorted = sortHistory(requests, "severity", "desc");
  
  // Wave 1: Highest risk (70-100)
  const critical = sorted.slice(0, 10);
  sdk.console.log("Wave 1: Testing critical endpoints...");
  const criticalResults = await executeBatch(
    buildTestBatch(critical), 
    credentials, 
    sdk
  );
  
  // Wave 2: Medium risk (40-69)
  const medium = sorted.slice(10, 20);
  sdk.console.log("Wave 2: Testing medium-risk endpoints...");
  const mediumResults = await executeBatch(
    buildTestBatch(medium),
    credentials,
    sdk
  );
  
  // Combine results
  const allResults = [...criticalResults, ...mediumResults];
  displayBatchResults(allResults, sdk);
}
```

### Pattern 2: Deduplication and Grouping

**Scenario:** Test one request per unique endpoint

```javascript
import {
  deduplicateRequests,
  groupHistory,
  buildTestBatch,
} from "../src/utils/history-handler.js";

export async function run({ requests }, sdk) {
  // Remove exact duplicates
  const unique = deduplicateRequests(requests);
  sdk.console.log(`Dedup: ${requests.length} → ${unique.length}`);
  
  // Group by path pattern
  const grouped = groupHistory(unique, "path");
  
  // Test one per group (most recent)
  let testRequests = [];
  Object.values(grouped).forEach(group => {
    if (group.length > 0) {
      testRequests.push(group[0]); // First (most recent)
    }
  });
  
  // Build and execute
  const tests = buildTestBatch(testRequests);
  const results = await executeBatch(tests, credentials, sdk);
}
```

### Pattern 3: Smart Recommendations

**Scenario:** Use AI-like scoring for test prioritization

```javascript
import { recommendRequests, buildTestBatch } from "../src/utils/history-handler.js";

export async function run({ requests }, sdk) {
  // Get intelligent recommendations (high confidence IDOR candidates)
  const recommended = recommendRequests(requests, {
    minScore: 60,        // Only high-confidence targets
    limit: 25,
    includeM2: true,
    excludeStatic: true,
  });
  
  sdk.console.log(`Recommended ${recommended.length} high-value tests`);
  
  const tests = buildTestBatch(recommended);
  const results = await executeBatch(tests, credentials, sdk);
  
  // All these are likely to find issues
  const vulnerable = results.filter(r => r.verdict === "VULNERABLE");
  sdk.console.log(`Success rate: ${(vulnerable.length / results.length * 100).toFixed(1)}%`);
}
```

### Pattern 4: Per-Endpoint Analysis

**Scenario:** Detailed report by endpoint

```javascript
import { groupHistory, analyzeRequestBatch } from "../src/utils/history-handler.js";

export async function run({ requests }, sdk) {
  // Analyze overall batch
  const analysis = analyzeRequestBatch(requests);
  
  sdk.console.log("=== BATCH ANALYSIS ===");
  sdk.console.log(`Total: ${analysis.totalRequests}`);
  sdk.console.log(`Patterns: ${analysis.pathPatterns.length}`);
  
  // Group by endpoint pattern
  const byPath = groupHistory(requests, "path");
  
  // Report per endpoint
  Object.entries(byPath).forEach(([path, reqs]) => {
    const methods = new Set(reqs.map(r => r.getMethod()));
    const hasAuth = reqs.some(r => r.getHeader("authorization"));
    
    sdk.console.log(`\n${path}`);
    sdk.console.log(`  Methods: ${Array.from(methods).join(", ")}`);
    sdk.console.log(`  Count: ${reqs.length}`);
    sdk.console.log(`  Auth: ${hasAuth ? "Yes" : "No"}`);
  });
}
```

---

## Real-World Scenarios

### Scenario 1: Pentest Multi-Tenant SaaS

**Goal:** Verify tenant isolation in multi-tenant application

**Approach:**
```javascript
// 1. Get users from two different tenants
const user1 = { tenant: "acme-corp", token: "..." };
const user2 = { tenant: "globex-inc", token: "..." };

// 2. Test cross-tenant access
const credentials = {
  user1: { type: "bearer", value: user1.token },
  user2: { type: "bearer", value: user2.token },
};

// 3. Filter to data endpoints (exclude admin)
const filtered = filterHistory(requests, {
  includePaths: ["/api/"],
  excludePaths: ["/admin/", "/settings/"],
  hasAuth: true,
});

// 4. Run batch tests
const tests = buildTestBatch(filtered, { limit: 30 });
const results = await executeBatch(tests, credentials, sdk);

// 5. Report tenant isolation issues
const vulnerabilities = results.filter(r => r.verdict === "VULNERABLE");
sdk.console.log(`Tenant isolation: ${vulnerabilities.length} breaches found`);
```

### Scenario 2: API Security Regression Testing

**Goal:** Ensure authorization checks not bypassed in new version

**Approach:**
```javascript
// 1. Baseline against known-good version
// 2. Run batch against new version
// 3. Compare results

export async function run({ requests }, sdk) {
  // Known IDOR endpoints (from previous audits)
  const knownVulnerable = [
    "/api/users/{id}",
    "/api/orders/{id}/details",
    "/api/posts/{id}/comments",
  ];
  
  // Test if still vulnerable
  const tests = filterHistory(requests, {
    custom: (req, meta) => {
      return knownVulnerable.some(pattern =>
        meta.path.match(pattern.replace("{id}", "\\d+"))
      );
    },
  });
  
  const results = await executeBatch(buildTestBatch(tests), credentials, sdk);
  
  if (results.length === 0 || results.every(r => r.verdict === "SECURE")) {
    sdk.console.log("✅ Regression test passed - all known issues fixed");
  } else {
    sdk.console.log("❌ Regression detected - known issues still present");
  }
}
```

### Scenario 3: GraphQL Authorization Testing

**Goal:** Test GraphQL field-level permissions

**Approach:**
```javascript
// Test same query with different auth levels
const queries = [
  { field: "user.email", m1Risk: "high" },
  { field: "user.ssn", m1Risk: "critical" },
  { field: "user.role", m1Risk: "medium" },
];

export async function run({ requests }, sdk) {
  // Filter GraphQL requests
  const graphqlRequests = filterHistory(requests, {
    custom: (req, meta) => {
      return meta.path.includes("/graphql") ||
             meta.contentType.includes("application/json") &&
             req.getBody().includes("query");
    },
  });
  
  // Test each GraphQL operation
  for (const req of graphqlRequests) {
    const test = M1(req, { name: req.getBody().substring(0, 50) });
    const result = await executeTest(test, credentials, sdk);
    
    if (result.verdict === "VULNERABLE") {
      sdk.console.log(`⚠️  GraphQL field exposed: ${result.testName}`);
    }
  }
}
```

### Scenario 4: Before/After Configuration Change

**Goal:** Verify authorization works after deploying auth updates

**Approach:**
```javascript
import { analyzeRequestBatch } from "../src/utils/history-handler.js";

export async function run({ requests }, sdk) {
  // Capture baseline before change
  const before = analyzeRequestBatch(requests);
  sdk.console.log("BEFORE deployment:");
  sdk.console.log(`  Authenticated: ${before.authentication.withAuth}`);
  
  // After deployment - run same tests
  // ...
  
  const after = analyzeRequestBatch(newRequests);
  sdk.console.log("AFTER deployment:");
  sdk.console.log(`  Authenticated: ${after.authentication.withAuth}`);
  
  // Verify improvement
  if (after.recommendations.highPriorityM1 < before.recommendations.highPriorityM1) {
    sdk.console.log("✅ Authorization improvements detected");
  }
}
```

---

## Tips & Tricks

### Tip 1: Batch Size Optimization

```javascript
// Too small - misses issues
maxRequests: 5  // ❌ Not enough coverage

// Good balance
maxRequests: 15  // ✅ Fast, comprehensive

// Too large - times out
maxRequests: 100  // ❌ Slow, may timeout
```

### Tip 2: Severity Thresholds

```javascript
// Very permissive (might have false positives)
minSeverityScore: 20

// Balanced (recommended)
minSeverityScore: 40

// Very strict (misses some issues)
minSeverityScore: 70
```

### Tip 3: Safe Mode Testing

```javascript
// For high-risk environments, test mutations in safe mode

const config = {
  safeMode: true,      // Don't actually mutate
  blockM2Delete: true, // Don't delete
};

// After safe mode passes, enable for real testing
```

### Tip 4: Chain Multiple Workflows

```javascript
// Workflow 1: Quick M1 scan
// Workflow 2: Focused M2 testing  
// Workflow 3: Deep dive on vulnerabilities
```

---

## Performance Benchmarks

```
Test Type          Batch Size    Time      Result Quality
────────────────────────────────────────────────────────
M1 only (GET)      20 req        ~30s      Good
M2 only (POST)     10 req        ~25s      Good
Mixed M1+M2        15 req        ~40s      Excellent
High severity      20 req        ~35s      Excellent
All endpoints      50 req        ~120s     Comprehensive
```

---

## Troubleshooting Examples

### Issue: Very slow batch processing

**Debug:**
```javascript
const start = Date.now();
const filtered = filterHistory(requests, config.filters);
sdk.console.log(`Filter: ${Date.now() - start}ms`);

const sorted = sortHistory(filtered, "severity", "desc");
sdk.console.log(`Sort: ${Date.now() - start}ms`);

const tests = buildTestBatch(sorted);
sdk.console.log(`Build: ${Date.now() - start}ms, ${tests.length} tests`);
```

**Solution:** Reduce `maxRequests` from 20 to 10

### Issue: No vulnerabilities found (expected some)

**Debug:**
```javascript
// Lower minimum severity to be more inclusive
minSeverityScore: 20  // Was 40

// Include more request types
filterM1: false
filterM2: false

// Use recommendations instead of custom filter
const candidates = recommendRequests(requests, { minScore: 30 });
```

---

## Next Steps

1. Start with Example 1 (single request)
2. Try batch history analysis
3. Experiment with custom filters
4. Adapt for your specific API
5. Automate in your security workflow

Happy testing! 🚀
