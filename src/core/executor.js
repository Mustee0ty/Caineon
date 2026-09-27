/**
 * Caido Workflow Executor
 * 
 * Executes M1/M2 tests using Caido's native request.toSpec() and sdk.requests.send() API.
 * Performs two-account comparison and detects authorization bypasses.
 * 
 * @module executor
 */

import { M1, isM1Candidate } from "./m1.js";
import { M2, isM2Candidate, getMutationRisk } from "./m2.js";

/**
 * Execute an M1 or M2 test with two-account comparison
 * 
 * @param {Object} test - M1 or M2 test specification
 * @param {Object} credentials - User credentials { user1: {...}, user2: {...} }
 * @param {Object} sdk - Caido SDK object
 * @returns {Object} Test result with comparison
 * 
 * @example
 * const result = await executeTest(m1Test, credentials, sdk);
 * console.log(result.verdict); // "VULNERABLE" or "SECURE"
 */
export async function executeTest(test, credentials, sdk) {
  const startTime = Date.now();
  
  try {
    // Execute User 1 request (baseline)
    const user1Result = await executeAsUser(test.request, credentials.user1, sdk);
    
    // Execute User 2 request (mutated)
    const user2Result = await executeAsUser(test.request, credentials.user2, sdk);
    
    // Compare responses
    const comparison = compareResponses(user1Result.response, user2Result.response, test);
    
    const executionTime = Date.now() - startTime;
    
    return {
      testName: test.name,
      testType: test.type,
      verdict: comparison.verdict,
      reason: comparison.reason,
      user1: {
        status: user1Result.response.getCode(),
        body: truncateBody(user1Result.response.getBody()),
      },
      user2: {
        status: user2Result.response.getCode(),
        body: truncateBody(user2Result.response.getBody()),
      },
      comparison: comparison,
      metadata: {
        ...test.metadata,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      testName: test.name,
      testType: test.type,
      verdict: "ERROR",
      reason: `Test execution failed: ${error.message}`,
      error: error.toString(),
      metadata: test.metadata,
    };
  }
}

/**
 * Execute a request as a specific user
 * 
 * @param {Object} request - Caido request object
 * @param {Object} userCredentials - User credential specification
 * @param {Object} sdk - Caido SDK object
 * @returns {Object} Result with response
 */
async function executeAsUser(request, userCredentials, sdk) {
  // Convert request to spec
  const spec = request.toSpec();
  
  // Apply user credentials based on type
  applyCredentials(spec, userCredentials);
  
  // Send request via Caido SDK
  const result = await sdk.requests.send(spec);
  
  return result;
}

/**
 * Apply credentials to a request spec
 * 
 * @param {Object} spec - Caido RequestSpec object
 * @param {Object} credentials - Credential specification
 */
function applyCredentials(spec, credentials) {
  switch (credentials.type) {
    case "bearer":
      spec.setHeader("Authorization", `Bearer ${credentials.value}`);
      break;
    
    case "cookie":
      spec.setHeader("Cookie", credentials.value);
      break;
    
    case "custom":
      spec.setHeader(credentials.headerName, credentials.value);
      break;
    
    case "basic":
      spec.setHeader("Authorization", `Basic ${credentials.value}`);
      break;
    
    default:
      throw new Error(`Unsupported credential type: ${credentials.type}`);
  }
}

/**
 * Compare two responses and determine authorization status
 * 
 * @param {Object} user1Response - Response from User 1 (baseline)
 * @param {Object} user2Response - Response from User 2 (test)
 * @param {Object} test - Test specification
 * @returns {Object} Comparison result with verdict
 */
function compareResponses(user1Response, user2Response, test) {
  const user1Status = user1Response.getCode();
  const user2Status = user2Response.getCode();
  
  // Core authorization logic
  const isUser1Success = user1Status >= 200 && user1Status < 300;
  const isUser2Success = user2Status >= 200 && user2Status < 300;
  const isUser2Forbidden = user2Status === 403;
  const isUser2NotFound = user2Status === 404;
  const isUser2Unauthorized = user2Status === 401;
  
  // Determine verdict
  if (isUser1Success && isUser2Success) {
    // Both succeeded - VULNERABLE
    return {
      verdict: "VULNERABLE",
      reason: "User 2 accessed User 1's resource successfully",
      severity: test.type === "M2" ? getMutationRisk(test.method) : "HIGH",
      details: {
        user1Status,
        user2Status,
        authorizationBypass: true,
      },
    };
  }
  
  if (isUser1Success && (isUser2Forbidden || isUser2NotFound || isUser2Unauthorized)) {
    // User 1 succeeded, User 2 blocked - SECURE
    return {
      verdict: "SECURE",
      reason: `Authorization properly enforced (User 2: ${user2Status})`,
      severity: "NONE",
      details: {
        user1Status,
        user2Status,
        authorizationBypass: false,
      },
    };
  }
  
  if (!isUser1Success && isUser2Success) {
    // User 1 failed, User 2 succeeded - ANOMALY
    return {
      verdict: "ANOMALY",
      reason: "User 2 succeeded where User 1 failed - possible privilege escalation",
      severity: "CRITICAL",
      details: {
        user1Status,
        user2Status,
        possibleEscalation: true,
      },
    };
  }
  
  if (!isUser1Success && !isUser2Success) {
    // Both failed - INCONCLUSIVE
    return {
      verdict: "INCONCLUSIVE",
      reason: `Both users failed (User 1: ${user1Status}, User 2: ${user2Status})`,
      severity: "NONE",
      details: {
        user1Status,
        user2Status,
        note: "Baseline request may be invalid",
      },
    };
  }
  
  // Default case
  return {
    verdict: "UNKNOWN",
    reason: `Unexpected status combination (User 1: ${user1Status}, User 2: ${user2Status})`,
    severity: "UNKNOWN",
    details: {
      user1Status,
      user2Status,
    },
  };
}

/**
 * Truncate response body for logging
 * 
 * @param {Buffer|string} body - Response body
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated body
 */
function truncateBody(body, maxLength = 500) {
  if (!body) return "";
  
  const bodyStr = body.toString();
  if (bodyStr.length <= maxLength) {
    return bodyStr;
  }
  
  return bodyStr.substring(0, maxLength) + "... [truncated]";
}

/**
 * Auto-detect test type and execute
 * 
 * @param {Object} request - Caido request object
 * @param {Object} credentials - User credentials
 * @param {Object} sdk - Caido SDK object
 * @param {Object} options - Optional configuration
 * @returns {Object} Test result
 */
export async function autoExecute(request, credentials, sdk, options = {}) {
  let test;
  
  if (isM1Candidate(request)) {
    test = M1(request, options);
  } else if (isM2Candidate(request)) {
    test = M2(request, options);
  } else {
    throw new Error(`Request method ${request.getMethod()} is not supported for M1/M2 testing`);
  }
  
  return await executeTest(test, credentials, sdk);
}

/**
 * Execute multiple tests in batch
 * 
 * @param {Array<Object>} tests - Array of M1/M2 test specifications
 * @param {Object} credentials - User credentials
 * @param {Object} sdk - Caido SDK object
 * @returns {Array<Object>} Array of test results
 */
export async function executeBatch(tests, credentials, sdk) {
  const results = [];
  
  for (const test of tests) {
    const result = await executeTest(test, credentials, sdk);
    results.push(result);
    
    // Log progress
    sdk.console.log(`[${result.verdict}] ${result.testName}`);
  }
  
  return results;
}

/**
 * Generate summary report from test results
 * 
 * @param {Array<Object>} results - Array of test results
 * @returns {Object} Summary report
 */
export function generateReport(results) {
  const summary = {
    total: results.length,
    vulnerable: 0,
    secure: 0,
    anomaly: 0,
    inconclusive: 0,
    error: 0,
    criticalIssues: [],
    highIssues: [],
  };
  
  results.forEach(result => {
    switch (result.verdict) {
      case "VULNERABLE":
        summary.vulnerable++;
        if (result.comparison?.severity === "CRITICAL") {
          summary.criticalIssues.push(result);
        } else {
          summary.highIssues.push(result);
        }
        break;
      case "SECURE":
        summary.secure++;
        break;
      case "ANOMALY":
        summary.anomaly++;
        summary.criticalIssues.push(result);
        break;
      case "INCONCLUSIVE":
        summary.inconclusive++;
        break;
      case "ERROR":
        summary.error++;
        break;
    }
  });
  
  return summary;
}

export default {
  executeTest,
  autoExecute,
  executeBatch,
  generateReport,
};
