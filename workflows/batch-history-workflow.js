/**
 * Batch HTTP History Workflow
 * 
 * Processes Caido HTTP history for authorization testing.
 * Intelligently filters, sorts, and tests multiple requests from history.
 * 
 * Usage:
 * 1. Copy content into a Caido Workflow JS node
 * 2. Configure credentials and filters below
 * 3. Select multiple requests in history panel or send single request
 * 4. Results shown in console with severity ranking
 * 
 * Features:
 * - Smart request filtering (exclude static, auth-required)
 * - Severity-based sorting and prioritization
 * - Batch M1/M2 auto-detection
 * - Detailed analysis report
 */

import {
  filterHistory,
  sortHistory,
  groupHistory,
  recommendRequests,
  buildTestBatch,
  analyzeRequestBatch,
  extractRequestMetadata,
} from "../src/utils/history-handler.js";

import { executeTest } from "../src/core/executor.js";
import { isM1Candidate, isM2Candidate, getMutationRisk } from "../src/core/m1.js";

/**
 * Configure credentials
 */
const credentials = {
  user1: {
    type: "bearer",
    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.USER1_TOKEN_HERE",
    label: "Admin User (High Privilege)",
  },
  user2: {
    type: "bearer",
    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.USER2_TOKEN_HERE",
    label: "Regular User (Low Privilege)",
  },
};

/**
 * Batch configuration
 */
const config = {
  // Request filtering
  filters: {
    excludePaths: ["/static/", "/cdn/", "/assets/", ".css", ".js", ".png", ".jpg", ".svg"],
    hasAuth: true, // Only test authenticated requests
    statusCodeRange: [200, 299], // Only successful requests
    excludeMethods: ["OPTIONS", "HEAD"], // Skip these methods
  },
  
  // Sorting and prioritization
  sortBy: "severity", // Options: method, path, host, timestamp, severity, testType
  sortOrder: "desc", // desc = highest risk first
  
  // Batch limits
  maxRequests: 20, // Limit batch size
  minSeverityScore: 40, // Minimum severity to include
  
  // Test execution
  safeMode: false, // Disable M2 mutations if true
  blockM2Delete: true, // Block DELETE operations
  
  // Output
  verboseLogging: true,
  generateReport: true,
};

/**
 * Main workflow execution
 */
export async function run({ requests }, sdk) {
  // Support both single request and batch
  let historyRequests = Array.isArray(requests) ? requests : [requests];
  
  if (!historyRequests || historyRequests.length === 0) {
    sdk.console.log("❌ No requests provided");
    return;
  }

  sdk.console.log(`\n${"=".repeat(80)}`);
  sdk.console.log(`🚀 CaineonJS Batch History Workflow`);
  sdk.console.log(`📦 Processing ${historyRequests.length} requests from history`);
  sdk.console.log(`${"=".repeat(80)}\n`);

  try {
    // Step 1: Analyze batch
    if (config.generateReport) {
      const analysis = analyzeRequestBatch(historyRequests);
      displayAnalysisReport(analysis, sdk);
    }

    // Step 2: Filter requests
    const filtered = filterRequests(historyRequests, config.filters, sdk);
    sdk.console.log(`✅ After filtering: ${filtered.length}/${historyRequests.length} requests\n`);

    if (filtered.length === 0) {
      sdk.console.log("❌ No requests matched filter criteria");
      return;
    }

    // Step 3: Sort by severity
    const sorted = sortHistory(filtered, config.sortBy, config.sortOrder);
    
    // Step 4: Limit batch
    const limited = sorted.slice(0, config.maxRequests);
    sdk.console.log(`📋 Testing top ${limited.length} requests by priority\n`);

    // Step 5: Build test batch
    const tests = buildTestBatch(limited, {
      sort: config.sortBy,
      limit: config.maxRequests,
      dedup: true,
    });

    // Step 6: Execute tests
    const results = await executeBatchTests(tests, credentials, config, sdk);

    // Step 7: Display results
    displayBatchResults(results, sdk);

    // Step 8: Summary
    displaySummary(results, sdk);

    return {
      totalTested: results.length,
      vulnerable: results.filter(r => r.verdict === "VULNERABLE").length,
      secure: results.filter(r => r.verdict === "SECURE").length,
      anomalies: results.filter(r => r.verdict === "ANOMALY").length,
      results,
    };

  } catch (error) {
    sdk.console.error(`❌ Batch execution failed: ${error.message}`);
    if (config.verboseLogging) {
      sdk.console.error(`Stack trace: ${error.stack}`);
    }
    return null;
  }
}

/**
 * Filter requests based on configuration
 */
function filterRequests(requests, filters, sdk) {
  let filtered = [...requests];

  // Remove requests with paths in exclude list
  if (filters.excludePaths) {
    filtered = filtered.filter(req => {
      const meta = extractRequestMetadata(req);
      return !filters.excludePaths.some(pattern => meta.path.includes(pattern));
    });
  }

  // Filter by authentication presence
  if (filters.hasAuth !== undefined) {
    filtered = filtered.filter(req => {
      const meta = extractRequestMetadata(req);
      const hasAuth = !!(
        req.getHeader("authorization") ||
        req.getHeader("cookie") ||
        req.getHeader("x-api-key")
      );
      return hasAuth === filters.hasAuth;
    });
  }

  // Filter by status code
  if (filters.statusCodeRange && req.getCode) {
    const [min, max] = filters.statusCodeRange;
    filtered = filtered.filter(req => {
      const code = req.getCode && req.getCode();
      return code && code >= min && code <= max;
    });
  }

  // Exclude methods
  if (filters.excludeMethods) {
    filtered = filtered.filter(req => {
      const method = req.getMethod();
      return !filters.excludeMethods.includes(method);
    });
  }

  return filtered;
}

/**
 * Execute tests from batch
 */
async function executeBatchTests(tests, credentials, config, sdk) {
  const results = [];
  let tested = 0;

  for (const test of tests) {
    tested++;
    
    // Check for blocking conditions
    if (config.blockM2Delete && isM2Candidate(test) && test.method === "DELETE") {
      sdk.console.log(`⏭️  Skipped: DELETE operation (M2 DELETE blocked by config)\n`);
      continue;
    }

    if (config.safeMode && isM2Candidate(test)) {
      sdk.console.log(`⏭️  Skipped: M2 mutation (safe mode enabled)\n`);
      continue;
    }

    try {
      sdk.console.log(`[${tested}/${tests.length}] Testing: ${test.method} ${test.endpoint}`);
      
      const result = await executeTest(test, credentials, sdk);
      results.push(result);

      // Show quick result indicator
      const icon = getResultIcon(result.verdict);
      sdk.console.log(`   ${icon} ${result.verdict} - ${result.reason}\n`);

    } catch (error) {
      sdk.console.error(`   ❌ Error: ${error.message}\n`);
      results.push({
        testName: test.name,
        verdict: "ERROR",
        reason: error.message,
      });
    }
  }

  return results;
}

/**
 * Get icon for result verdict
 */
function getResultIcon(verdict) {
  const icons = {
    VULNERABLE: "🚨",
    SECURE: "✅",
    ANOMALY: "⚠️",
    INCONCLUSIVE: "❓",
    ERROR: "❌",
  };
  return icons[verdict] || "❓";
}

/**
 * Display analysis report
 */
function displayAnalysisReport(analysis, sdk) {
  sdk.console.log(`📊 Request Batch Analysis`);
  sdk.console.log(`${"─".repeat(80)}`);
  sdk.console.log(`Total Requests: ${analysis.totalRequests}`);
  
  // By method
  sdk.console.log(`\nBy HTTP Method:`);
  Object.entries(analysis.byMethod).forEach(([method, count]) => {
    sdk.console.log(`  ${method}: ${count}`);
  });

  // By test type
  sdk.console.log(`\nBy Test Type:`);
  sdk.console.log(`  M1 (Read): ${analysis.byTestType.M1}`);
  sdk.console.log(`  M2 (Write): ${analysis.byTestType.M2}`);

  // Authentication
  sdk.console.log(`\nAuthentication:`);
  sdk.console.log(`  With Auth Headers: ${analysis.authentication.withAuth}`);
  sdk.console.log(`  Without Auth: ${analysis.authentication.withoutAuth}`);

  // Recommendations
  sdk.console.log(`\nRecommendations:`);
  sdk.console.log(`  High Priority M1: ${analysis.recommendations.highPriorityM1}`);
  sdk.console.log(`  High Priority M2: ${analysis.recommendations.highPriorityM2}`);
  sdk.console.log(`  Static Resources: ${analysis.recommendations.staticResources}`);
  
  sdk.console.log(`${"─".repeat(80)}\n`);
}

/**
 * Display batch results
 */
function displayBatchResults(results, sdk) {
  sdk.console.log(`\n${"=".repeat(80)}`);
  sdk.console.log(`📈 Test Results Summary`);
  sdk.console.log(`${"=".repeat(80)}\n`);

  const grouped = {
    VULNERABLE: [],
    SECURE: [],
    ANOMALY: [],
    INCONCLUSIVE: [],
    ERROR: [],
  };

  results.forEach(result => {
    const category = result.verdict || "ERROR";
    if (grouped[category]) {
      grouped[category].push(result);
    }
  });

  // Display vulnerabilities
  if (grouped.VULNERABLE.length > 0) {
    sdk.console.log(`🚨 VULNERABILITIES FOUND: ${grouped.VULNERABLE.length}`);
    sdk.console.log(`${"─".repeat(80)}`);
    grouped.VULNERABLE.forEach((result, idx) => {
      sdk.console.log(`\n${idx + 1}. ${result.testName}`);
      sdk.console.log(`   Type: ${result.testType}`);
      sdk.console.log(`   Reason: ${result.reason}`);
      sdk.console.log(`   User 1: ${result.user1.status} | User 2: ${result.user2.status}`);
    });
  }

  // Display anomalies
  if (grouped.ANOMALY.length > 0) {
    sdk.console.log(`\n⚠️  ANOMALIES DETECTED: ${grouped.ANOMALY.length}`);
    sdk.console.log(`${"─".repeat(80)}`);
    grouped.ANOMALY.forEach((result, idx) => {
      sdk.console.log(`\n${idx + 1}. ${result.testName}`);
      sdk.console.log(`   Reason: ${result.reason}`);
      sdk.console.log(`   User 1: ${result.user1.status} | User 2: ${result.user2.status}`);
    });
  }

  // Display secure results
  if (grouped.SECURE.length > 0) {
    sdk.console.log(`\n✅ SECURE: ${grouped.SECURE.length}`);
  }

  sdk.console.log(`\n${"=".repeat(80)}\n`);
}

/**
 * Display final summary
 */
function displaySummary(results, sdk) {
  const counts = {
    total: results.length,
    vulnerable: 0,
    secure: 0,
    anomaly: 0,
    inconclusive: 0,
    error: 0,
  };

  results.forEach(result => {
    if (result.verdict === "VULNERABLE") counts.vulnerable++;
    else if (result.verdict === "SECURE") counts.secure++;
    else if (result.verdict === "ANOMALY") counts.anomaly++;
    else if (result.verdict === "INCONCLUSIVE") counts.inconclusive++;
    else if (result.verdict === "ERROR") counts.error++;
  });

  const percentage = counts.total > 0 
    ? Math.round((counts.vulnerable / counts.total) * 100)
    : 0;

  sdk.console.log(`📋 FINAL SUMMARY`);
  sdk.console.log(`${"=".repeat(80)}`);
  sdk.console.log(`Total Tests: ${counts.total}`);
  sdk.console.log(`🚨 Vulnerable: ${counts.vulnerable} (${percentage}%)`);
  sdk.console.log(`✅ Secure: ${counts.secure}`);
  sdk.console.log(`⚠️  Anomalies: ${counts.anomaly}`);
  sdk.console.log(`❓ Inconclusive: ${counts.inconclusive}`);
  sdk.console.log(`❌ Errors: ${counts.error}`);
  sdk.console.log(`${"=".repeat(80)}\n`);

  if (counts.vulnerable > 0) {
    sdk.console.log(`🚨 ACTION REQUIRED: ${counts.vulnerable} authorization vulnerability(ies) detected!\n`);
  } else {
    sdk.console.log(`✅ Good news: No authorization bypasses detected in this batch.\n`);
  }
}
