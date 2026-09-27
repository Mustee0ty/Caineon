# HTTP History Processing - Quick Reference

Fast lookup for HTTP history functions and usage patterns.

## Import Statement

```javascript
import {
  filterHistory,
  sortHistory,
  groupHistory,
  deduplicateRequests,
  recommendRequests,
  buildTestBatch,
  analyzeRequestBatch,
  extractRequestMetadata,
} from "../src/utils/history-handler.js";
```

---

## Function Reference

### `filterHistory(requests, filters)`

Filter requests based on criteria.

```javascript
const filtered = filterHistory(requests, {
  methods: ["GET", "POST"],
  includePaths: ["/api/"],
  excludePaths: ["/static/", "/cdn/"],
  hasAuth: true,
  statusCodeRange: [200, 299],
  hosts: ["api.example.com"],
  contentTypes: ["application/json"],
  custom: (req, meta) => meta.path.includes("/users")
});
```

**Returns:** Array of matching requests

---

### `sortHistory(requests, sortBy, order)`

Sort requests by criteria.

```javascript
// Sort by severity (highest risk first)
const sorted = sortHistory(requests, "severity", "desc");

// Other options:
sortHistory(requests, "method", "asc");      // HTTP method
sortHistory(requests, "path", "asc");        // URL path
sortHistory(requests, "host", "asc");        // Hostname
sortHistory(requests, "timestamp", "desc");  // Most recent
sortHistory(requests, "testType", "desc");   // M2 first
```

**Returns:** Sorted array

---

### `groupHistory(requests, groupBy)`

Group requests by criteria.

```javascript
// Group by HTTP method
const byMethod = groupHistory(requests, "method");
// Returns: { GET: [...], POST: [...], DELETE: [...] }

// Other groupings:
groupHistory(requests, "path");        // By URL path
groupHistory(requests, "host");        // By hostname
groupHistory(requests, "testType");    // M1 vs M2
groupHistory(requests, "statusCode");  // By HTTP status
```

**Returns:** Object with groups as keys

---

### `deduplicateRequests(requests)`

Remove duplicate requests (same method + URL).

```javascript
const unique = deduplicateRequests(requests);
// Keeps first occurrence of each method+URL combination
```

**Returns:** Array of unique requests

---

### `recommendRequests(requests, options)`

Get recommended requests for testing (intelligent filtering).

```javascript
const candidates = recommendRequests(requests, {
  minScore: 40,          // Minimum severity score
  limit: 20,             // Max results
  includeM2: true,       // Include write operations
  excludeStatic: true,   // Skip /static/, /cdn/
});
```

**Scoring factors:**
- M2 operations: +50
- DELETE: +30
- PATCH: +20
- API ID patterns: +20
- Data endpoints: +10
- Auth headers: +5

**Returns:** Array of top recommendations

---

### `buildTestBatch(requests, options)`

Convert requests to test specifications.

```javascript
const tests = buildTestBatch(requests, {
  filterM1: false,  // Include M1 tests
  filterM2: false,  // Include M2 tests
  limit: 20,        // Max tests
  dedup: true,      // Remove duplicates
  sort: "severity", // Sort order
});

// Now use with executeBatch()
```

**Returns:** Array of test specifications

---

### `analyzeRequestBatch(requests)`

Generate analysis report for requests.

```javascript
const report = analyzeRequestBatch(requests);

console.log(report.totalRequests);           // 45
console.log(report.byMethod);                // { GET: 28, POST: 12, ... }
console.log(report.byTestType);              // { M1: 32, M2: 13 }
console.log(report.authentication);          // { withAuth: 43, withoutAuth: 2 }
console.log(report.pathPatterns);            // ["/api/users/{id}", ...]
console.log(report.statusCodeDistribution);  // { 200: 40, 404: 3, ... }
console.log(report.recommendations);         // { highPriorityM1: 5, ... }
```

**Returns:** Analysis object

---

### `extractRequestMetadata(request)`

Get metadata from a single request.

```javascript
const meta = extractRequestMetadata(request);

// Returns:
{
  method: "GET",
  url: "https://api.example.com/users/123",
  path: "/users/123",
  host: "api.example.com",
  statusCode: 200,
  timestamp: 1234567890,
  contentType: "application/json",
  isSecure: true,
  hasAuthHeader: true
}
```

**Returns:** Metadata object

---

## Common Patterns

### Get high-value requests for testing

```javascript
const candidates = recommendRequests(requests, {
  minScore: 50,
  limit: 15,
});

const tests = buildTestBatch(candidates);
```

### Test only M1 (read operations)

```javascript
const filtered = filterHistory(requests, {
  methods: ["GET", "HEAD"]
});

const tests = buildTestBatch(filtered, { filterM2: true });
```

### Test only M2 (write operations)

```javascript
const filtered = filterHistory(requests, {
  methods: ["POST", "PUT", "PATCH", "DELETE"]
});

const tests = buildTestBatch(filtered, { filterM1: true });
```

### Get API endpoints only

```javascript
const api = filterHistory(requests, {
  includePaths: ["/api/"],
  excludePaths: ["/static/", "/cdn/"],
  hasAuth: true,
});

const sorted = sortHistory(api, "severity", "desc");
const tests = buildTestBatch(sorted, { limit: 20 });
```

### Group and prioritize by endpoint

```javascript
const byPath = groupHistory(requests, "path");

Object.entries(byPath).forEach(([path, reqs]) => {
  const sorted = sortHistory(reqs, "severity", "desc");
  console.log(`${path}: ${sorted.length} requests`);
});
```

### Find potential IDOR endpoints

```javascript
const idrCandidates = filterHistory(requests, {
  custom: (req, meta) => {
    // Pattern: /api/resource/{id}
    return /\/api\/[^/]+\/\d+/.test(meta.path) ||
           /\/api\/[^/]+\/[a-f0-9-]{36}/.test(meta.path);
  },
  hasAuth: true,
});
```

### Export analysis for reporting

```javascript
const analysis = analyzeRequestBatch(requests);

const report = {
  summary: {
    total: analysis.totalRequests,
    methods: Object.keys(analysis.byMethod),
    m1Count: analysis.byTestType.M1,
    m2Count: analysis.byTestType.M2,
  },
  pathPatterns: analysis.pathPatterns,
  recommendations: analysis.recommendations,
};

sdk.console.log(JSON.stringify(report, null, 2));
```

---

## Integration with Executor

```javascript
import { buildTestBatch } from "../src/utils/history-handler.js";
import { executeBatch, generateReport } from "../src/core/executor.js";

// 1. Filter and build batch
const tests = buildTestBatch(requests, {
  limit: 20,
  sort: "severity",
});

// 2. Execute all tests
const results = await executeBatch(tests, credentials, sdk);

// 3. Generate summary
const summary = generateReport(results);
```

---

## Filtering Recipes

### Only authenticated API requests
```javascript
filterHistory(requests, {
  includePaths: ["/api/"],
  hasAuth: true,
});
```

### High-confidence IDOR indicators
```javascript
filterHistory(requests, {
  custom: (req, meta) => {
    return /\/[a-z]+\/\d+|\/[a-z]+\/[a-f0-9-]{36}/.test(meta.path);
  },
  hasAuth: true,
  statusCodeRange: [200, 299],
});
```

### Exclude monitoring/health checks
```javascript
filterHistory(requests, {
  excludePaths: ["/health", "/ping", "/status", "/metrics", "/.well-known/"],
});
```

### JSON APIs only
```javascript
filterHistory(requests, {
  contentTypes: ["application/json"],
  hasAuth: true,
});
```

### Production domain
```javascript
filterHistory(requests, {
  hosts: ["api.prod.example.com"],
  statusCodeRange: [200, 299],
});
```

---

## Sorting Recipes

### By risk (highest first)
```javascript
sortHistory(requests, "severity", "desc");
```

### By HTTP method (mutations first)
```javascript
sortHistory(requests, "testType", "desc");  // M2 first
```

### By path (for organized testing)
```javascript
sortHistory(requests, "path", "asc");
```

### By recency (newest first)
```javascript
sortHistory(requests, "timestamp", "desc");
```

---

## Batch Processing Workflow

```javascript
// Step 1: Filter
const filtered = filterHistory(requests, {
  excludePaths: ["/static/", "/cdn/"],
  hasAuth: true,
});

// Step 2: Deduplicate
const unique = deduplicateRequests(filtered);

// Step 3: Sort
const sorted = sortHistory(unique, "severity", "desc");

// Step 4: Limit
const limited = sorted.slice(0, 20);

// Step 5: Build tests
const tests = buildTestBatch(limited);

// Step 6: Execute
const results = await executeBatch(tests, credentials, sdk);
```

---

## Tips & Tricks

**Combine filters:**
```javascript
let requests = allRequests;
requests = filterHistory(requests, { methods: ["GET", "POST"] });
requests = filterHistory(requests, { excludePaths: ["/static/"] });
requests = filterHistory(requests, { hasAuth: true });
```

**Chain operations:**
```javascript
const tests = buildTestBatch(
  sortHistory(
    deduplicateRequests(
      filterHistory(requests, { hasAuth: true })
    ),
    "severity",
    "desc"
  ),
  { limit: 15 }
);
```

**Analyze before testing:**
```javascript
const analysis = analyzeRequestBatch(requests);
if (analysis.byTestType.M2 > 0) {
  sdk.console.log("M2 tests detected - enable safe mode");
}
```

**Export for external tools:**
```javascript
const meta = requests.map(extractRequestMetadata);
const json = JSON.stringify(meta, null, 2);
// Send to Postman, Burp, etc.
```

---

## Performance Tips

- Use `deduplicateRequests()` before large batches
- Limit with `limit: 20-30` for reasonable execution time
- Filter early to reduce processing
- Sort at the end for better performance

```javascript
// Good order
const batch = buildTestBatch(
  deduplicateRequests(
    filterHistory(originalRequests, filters)
  ),
  { limit: 20, sort: "severity" }
);
```
