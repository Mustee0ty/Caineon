# CaineonJS Advanced Configuration Guide

This guide covers advanced features, customization options, and integration patterns for CaineonJS.

## Advanced Credential Management

### Environment Variables

Load credentials from environment variables to keep them out of your workflow code:

```javascript
import { loadFromEnvironment } from "../src/config/credentials.js";

const credentials = loadFromEnvironment();

// Set environment variables:
// export CAINEON_USER1_TYPE=bearer
// export CAINEON_USER1_VALUE=eyJhbGci...
// export CAINEON_USER2_TYPE=bearer
// export CAINEON_USER2_VALUE=eyJhbGci...
```

### Multiple Credential Sets

Test with multiple user pairs:

```javascript
const credentialSets = {
  adminVsUser: {
    user1: { type: "bearer", value: "ADMIN_TOKEN" },
    user2: { type: "bearer", value: "USER_TOKEN" },
  },
  user1VsUser2: {
    user1: { type: "bearer", value: "USER1_TOKEN" },
    user2: { type: "bearer", value: "USER2_TOKEN" },
  },
  ownerVsGuest: {
    user1: { type: "bearer", value: "OWNER_TOKEN" },
    user2: { type: "bearer", value: "GUEST_TOKEN" },
  },
};

// Run test with specific credential set
const result = await executeTest(test, credentialSets.adminVsUser, sdk);
```

### Dynamic Token Refresh

Automatically refresh expired tokens:

```javascript
async function getCredentials(sdk) {
  // Check if tokens are expired
  if (isTokenExpired(cachedCredentials.user1.value)) {
    // Refresh User 1 token
    cachedCredentials.user1.value = await refreshToken(sdk, "user1");
  }
  
  if (isTokenExpired(cachedCredentials.user2.value)) {
    // Refresh User 2 token
    cachedCredentials.user2.value = await refreshToken(sdk, "user2");
  }
  
  return cachedCredentials;
}

// In your workflow
const credentials = await getCredentials(sdk);
const result = await executeTest(test, credentials, sdk);
```

## Batch Testing

### Test Multiple Endpoints

Create a batch test workflow:

```javascript
import { M1Batch, M2Batch } from "../src/core/m1.js";
import { executeBatch, generateReport } from "../src/core/executor.js";

export async function run({ requests }, sdk) {
  // Filter captured requests
  const readRequests = requests.filter(isM1Candidate);
  const writeRequests = requests.filter(isM2Candidate);
  
  // Generate tests
  const m1Tests = M1Batch(readRequests);
  const m2Tests = M2Batch(writeRequests, { safe: true });
  
  const allTests = [...m1Tests, ...m2Tests];
  
  // Execute batch
  sdk.console.log(`Running ${allTests.length} tests...`);
  const results = await executeBatch(allTests, credentials, sdk);
  
  // Generate report
  const report = generateReport(results);
  displayReport(report, sdk);
  
  return report;
}
```

### Resource Enumeration

Test multiple resource IDs automatically:

```javascript
import { M1WithEnumeration } from "../src/core/m1.js";

export async function run({ request }, sdk) {
  // Test IDs to enumerate
  const resourceIds = ["1", "2", "3", "100", "999", "admin"];
  
  // Generate tests for each ID
  const tests = M1WithEnumeration(request, resourceIds);
  
  // Execute all tests
  const results = await executeBatch(tests, credentials, sdk);
  
  // Find vulnerable IDs
  const vulnerable = results.filter(r => r.verdict === "VULNERABLE");
  
  sdk.console.log(`\nVulnerable Resource IDs:`);
  vulnerable.forEach(v => {
    sdk.console.log(`  - ${v.metadata.enumeratedId}`);
  });
  
  return vulnerable.length;
}
```

## Custom Test Scenarios

### Privilege Escalation Testing

```javascript
import { M2Scenario } from "../src/core/m2.js";

export async function run({ request }, sdk) {
  const test = M2Scenario(request, "privilege_escalation");
  
  const result = await executeTest(test, credentials, sdk);
  
  if (result.verdict === "VULNERABLE") {
    sdk.console.log("🚨 Privilege Escalation Detected!");
    sdk.console.log("User 2 can modify their own privileges");
  }
  
  return result;
}
```

### Data Tampering Detection

```javascript
import { M2Scenario } from "../src/core/m2.js";

export async function run({ request }, sdk) {
  const test = M2Scenario(request, "data_tampering");
  
  const result = await executeTest(test, credentials, sdk);
  
  // Check for ownership field tampering
  if (result.verdict === "VULNERABLE") {
    const ownershipFields = ["userId", "ownerId", "createdBy"];
    const detection = detectSensitiveData(
      result.user2.response,
      ownershipFields
    );
    
    if (detection.hasSensitiveData) {
      sdk.console.log("⚠️ User 2 can tamper with ownership fields!");
    }
  }
  
  return result;
}
```

### State Tracking with Rollback

```javascript
import { M2WithStateTracking } from "../src/core/m2.js";

export async function run({ request }, sdk) {
  // Capture pre-mutation state
  const resourceUrl = request.getUrl();
  const preState = await fetchResourceState(resourceUrl, sdk);
  
  // Create test with state tracking
  const test = M2WithStateTracking(request, preState);
  
  const result = await executeTest(test, credentials, sdk);
  
  // If vulnerable, rollback changes
  if (result.verdict === "VULNERABLE" && test.rollback) {
    sdk.console.log("⏪ Rolling back unauthorized mutation...");
    await rollbackMutation(test.rollback, sdk);
  }
  
  return result;
}

async function rollbackMutation(rollback, sdk) {
  const spec = sdk.requests.createSpec(rollback.method, rollback.endpoint);
  spec.setBody(JSON.stringify(rollback.body));
  
  await sdk.requests.send(spec);
  sdk.console.log("✅ Rollback complete");
}
```

## Response Comparison Customization

### Deep JSON Comparison

```javascript
import { compareResponseBodies, detectSensitiveData } from "../src/utils/comparator.js";

export async function run({ request }, sdk) {
  const result = await executeTest(test, credentials, sdk);
  
  // Perform deep comparison
  const comparison = compareResponseBodies(
    result.user1.response.getBody(),
    result.user2.response.getBody()
  );
  
  if (comparison.identical) {
    sdk.console.log("⚠️ Responses are IDENTICAL - definite bypass!");
  } else if (comparison.similarity > 0.8) {
    sdk.console.log(`⚠️ Responses are ${(comparison.similarity * 100).toFixed(1)}% similar`);
    sdk.console.log("Differences:", comparison.differences);
  }
  
  return result;
}
```

### Sensitive Field Detection

```javascript
const sensitiveFields = [
  "ssn", "socialSecurityNumber",
  "creditCard", "cardNumber",
  "password", "passwordHash",
  "apiKey", "secretKey",
];

const detection = detectSensitiveData(
  result.user2.response,
  sensitiveFields
);

if (detection.hasSensitiveData) {
  sdk.console.log("🚨 CRITICAL: Sensitive data exposed!");
  detection.detectedFields.forEach(field => {
    sdk.console.log(`  - ${field.field} found in ${field.location}`);
  });
}
```

## Safe Mode Configuration

### Dry-Run for M2 Tests

```javascript
import { M2Safe } from "../src/core/m2.js";

export async function run({ request }, sdk) {
  // Create safe M2 test (won't execute mutation)
  const test = M2Safe(request);
  
  sdk.console.log("🛡️ Running in DRY-RUN mode");
  sdk.console.log("Authorization will be checked but mutation won't execute");
  
  // Modify executor to skip actual execution
  const result = await checkAuthorizationOnly(test, credentials, sdk);
  
  return result;
}

async function checkAuthorizationOnly(test, credentials, sdk) {
  // Execute with User 2 credentials only
  const spec = test.request.toSpec();
  applyCredentials(spec, credentials.user2);
  
  const result = await sdk.requests.send(spec);
  
  // Check if authorization was enforced
  const status = result.response.getCode();
  
  if (status === 403 || status === 401 || status === 404) {
    return { verdict: "SECURE", reason: "Authorization check passed" };
  } else if (status >= 200 && status < 300) {
    return { verdict: "VULNERABLE", reason: "Authorization bypass detected" };
  }
  
  return { verdict: "INCONCLUSIVE", reason: `Unexpected status: ${status}` };
}
```

## Integration Patterns

### CI/CD Integration

Export results in machine-readable format:

```javascript
export async function run({ requests }, sdk) {
  const results = await executeBatch(tests, credentials, sdk);
  const report = generateReport(results);
  
  // Export as JSON
  const output = {
    timestamp: new Date().toISOString(),
    summary: report,
    details: results,
    cicd: {
      exitCode: report.vulnerable > 0 ? 1 : 0,
      message: report.vulnerable > 0 
        ? `Found ${report.vulnerable} vulnerabilities`
        : "All tests passed",
    },
  };
  
  // Write to file or stdout
  sdk.console.log(JSON.stringify(output, null, 2));
  
  return output.cicd.exitCode;
}
```

### Bug Bounty Workflow

Generate bug bounty reports automatically:

```javascript
function generateBugBountyReport(result) {
  if (result.verdict !== "VULNERABLE") return null;
  
  return {
    title: `IDOR: ${result.testType} Authorization Bypass`,
    severity: result.comparison.severity,
    description: `
# Vulnerability Details

## Summary
${result.reason}

## Affected Endpoint
- **Method**: ${result.metadata.originalMethod}
- **URL**: ${result.testName}

## Steps to Reproduce
1. Login as User 1 (high-privilege account)
2. Execute: ${result.metadata.originalMethod} ${result.testName}
3. Observe: User 1 receives ${result.user1.status}
4. Login as User 2 (low-privilege account)
5. Execute same request with User 2 credentials
6. Observe: User 2 receives ${result.user2.status}

## Expected Behavior
User 2 should receive 403 Forbidden or 404 Not Found

## Actual Behavior
User 2 receives ${result.user2.status} and can access User 1's data

## Impact
${result.testType === "M1" 
  ? "User 2 can read sensitive data belonging to User 1"
  : "User 2 can modify data belonging to User 1"}

## Severity
${result.comparison.severity}

## Timestamp
${result.metadata.timestamp}
    `.trim(),
  };
}

export async function run({ request }, sdk) {
  const result = await executeTest(test, credentials, sdk);
  
  if (result.verdict === "VULNERABLE") {
    const report = generateBugBountyReport(result);
    sdk.console.log("\n📝 Bug Bounty Report Generated:");
    sdk.console.log(report.description);
  }
  
  return result;
}
```

### Slack/Discord Notifications

Send alerts when vulnerabilities are found:

```javascript
async function sendAlert(result, webhookUrl) {
  if (result.verdict !== "VULNERABLE") return;
  
  const message = {
    text: `🚨 Authorization Bypass Detected!`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Vulnerability Found*\n${result.testName}`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Type:*\n${result.testType}` },
          { type: "mrkdwn", text: `*Severity:*\n${result.comparison.severity}` },
        ],
      },
    ],
  };
  
  // Send to webhook (implementation depends on your environment)
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
}
```

## Performance Optimization

### Parallel Execution

```javascript
export async function run({ requests }, sdk) {
  const tests = M1Batch(requests);
  
  // Execute tests in parallel (with rate limiting)
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < tests.length; i += batchSize) {
    const batch = tests.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(test => executeTest(test, credentials, sdk))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

### Caching

```javascript
const responseCache = new Map();

export async function run({ request }, sdk) {
  const cacheKey = `${request.getMethod()}_${request.getUrl()}`;
  
  if (responseCache.has(cacheKey)) {
    sdk.console.log("Using cached result");
    return responseCache.get(cacheKey);
  }
  
  const result = await executeTest(test, credentials, sdk);
  responseCache.set(cacheKey, result);
  
  return result;
}
```

## Debugging

### Verbose Logging

```javascript
const config = {
  debug: true,
};

export async function run({ request }, sdk) {
  if (config.debug) {
    sdk.console.log("🐛 Debug: Request details");
    sdk.console.log("  Method:", request.getMethod());
    sdk.console.log("  URL:", request.getUrl());
    sdk.console.log("  Headers:", request.getHeaders());
  }
  
  const result = await executeTest(test, credentials, sdk);
  
  if (config.debug) {
    sdk.console.log("🐛 Debug: Full result");
    sdk.console.log(JSON.stringify(result, null, 2));
  }
  
  return result;
}
```

## Security Best Practices

1. **Never commit real credentials** - Use environment variables or secret management
2. **Use safe mode for M2 tests** - Prevent accidental data modification
3. **Test in staging first** - Validate your setup before production testing
4. **Rate limit your tests** - Avoid overwhelming the target server
5. **Log responsibly** - Don't log sensitive data in plain text
6. **Rotate test credentials** - Use dedicated test accounts with limited access

## Next Steps

- Explore the source code in `src/core/` for customization
- Create custom test generators for specific scenarios
- Build automated testing pipelines
- Contribute improvements back to the project
