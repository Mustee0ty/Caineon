/**
 * Combined M1/M2 Workflow - Auto-Detection
 * 
 * Automatically detects whether to run M1 or M2 based on HTTP method.
 * This is the most versatile workflow for general authorization testing.
 * 
 * Auto-detection rules:
 * - GET, HEAD, OPTIONS → M1 (Cross-Account Read)
 * - POST, PUT, PATCH, DELETE → M2 (Cross-Account Write/Mutation)
 * 
 * Usage:
 * 1. Copy this file content into a Caido Workflow JS node
 * 2. Update the credentials object with your User 1 and User 2 tokens
 * 3. Configure settings as needed
 * 4. Send any request through the workflow
 * 5. Review results in the console output
 */

import { M1, isM1Candidate } from "../src/core/m1.js";
import { M2, isM2Candidate, getMutationRisk } from "../src/core/m2.js";
import { executeTest } from "../src/core/executor.js";

/**
 * Configure your credentials here
 * SECURITY: Do not commit real credentials to version control
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
 * Configuration
 */
const config = {
  safeMode: false, // Set to true for M2 tests to prevent actual mutations
  blockCriticalOps: true, // Block DELETE operations by default
  verboseLogging: true, // Show detailed logs
  sensitiveFields: [
    "userId", "user_id", "email", "username",
    "ssn", "phone", "address", "creditCard",
    "accountNumber", "balance", "salary"
  ],
};

/**
 * Main workflow execution function
 * Called by Caido for each request
 */
export async function run({ request }, sdk) {
  // Validate request exists
  if (!request) {
    sdk.console.log("❌ No request provided");
    return;
  }

  const method = request.getMethod();
  const url = request.getUrl();
  
  sdk.console.log(`\n${"=".repeat(80)}`);
  sdk.console.log(`🤖 CaineonJS Auto-Detection: ${method} ${url}`);
  sdk.console.log(`${"=".repeat(80)}\n`);

  // Detect test type
  let test;
  let testType;
  
  if (isM1Candidate(request)) {
    testType = "M1";
    test = M1(request, {
      sensitiveFields: config.sensitiveFields,
    });
    sdk.console.log(`✅ Detected: M1 (Cross-Account Read)`);
  } else if (isM2Candidate(request)) {
    testType = "M2";
    const riskLevel = getMutationRisk(method);
    
    // Check if critical operation should be blocked
    if (config.blockCriticalOps && riskLevel === "CRITICAL") {
      sdk.console.log(`⚠️  Detected: M2 (Cross-Account Mutation) - ${riskLevel} RISK`);
      sdk.console.log(`❌ BLOCKED: Critical operations are disabled by configuration`);
      sdk.console.log(`   Set config.blockCriticalOps = false to enable\n`);
      return "BLOCKED";
    }
    
    test = M2(request, {
      safe: config.safeMode,
    });
    sdk.console.log(`⚠️  Detected: M2 (Cross-Account Mutation) - ${test.riskLevel} RISK`);
    
    if (config.safeMode) {
      sdk.console.log(`🛡️  Safe Mode: ENABLED (mutations will not execute)`);
    }
  } else {
    sdk.console.log(`❌ Unsupported HTTP method: ${method}`);
    return "UNSUPPORTED";
  }

  sdk.console.log(`📋 Test: ${test.name}`);
  sdk.console.log(`🎯 Mutation: ${test.mutation}\n`);

  try {
    // Execute the test
    if (config.verboseLogging) {
      sdk.console.log(`🔄 Executing test...`);
    }
    
    const result = await executeTest(test, credentials, sdk);

    // Display results
    displayResults(result, testType, sdk);

    // Return verdict for workflow chaining
    return result.verdict;
  } catch (error) {
    sdk.console.error(`❌ Test execution failed: ${error.message}`);
    if (config.verboseLogging) {
      sdk.console.error(`Stack trace: ${error.stack}`);
    }
    return "ERROR";
  }
}

/**
 * Display formatted test results
 */
function displayResults(result, testType, sdk) {
  const icons = {
    VULNERABLE: "🚨",
    SECURE: "✅",
    ANOMALY: "⚠️",
    INCONCLUSIVE: "❓",
    ERROR: "❌",
  };

  const icon = icons[result.verdict] || "❓";
  
  sdk.console.log(`\n${"─".repeat(80)}`);
  sdk.console.log(`${icon} VERDICT: ${result.verdict}`);
  sdk.console.log(`${"─".repeat(80)}`);
  sdk.console.log(`📝 Reason: ${result.reason}\n`);

  // Critical alert for vulnerabilities
  if (result.verdict === "VULNERABLE") {
    sdk.console.log(`${"!".repeat(80)}`);
    sdk.console.log(`🚨 AUTHORIZATION BYPASS DETECTED!`);
    sdk.console.log(`${"!".repeat(80)}`);
    
    if (testType === "M1") {
      sdk.console.log(`   User 2 can READ User 1's data`);
    } else if (testType === "M2") {
      sdk.console.log(`   User 2 can MODIFY User 1's data`);
    }
    
    sdk.console.log(`   Severity: ${result.comparison.severity}`);
    sdk.console.log(`   This is a security vulnerability!\n`);
  }

  // Anomaly alert
  if (result.verdict === "ANOMALY") {
    sdk.console.log(`⚠️  ANOMALY: User 2 succeeded where User 1 failed`);
    sdk.console.log(`   This may indicate privilege escalation\n`);
  }

  // Response comparison
  sdk.console.log(`📊 Response Comparison:`);
  sdk.console.log(`\n   👤 User 1 (Baseline - High Privilege):`);
  sdk.console.log(`      Status: ${result.user1.status}`);
  if (config.verboseLogging) {
    sdk.console.log(`      Body: ${result.user1.body.substring(0, 200)}...`);
  }

  sdk.console.log(`\n   👤 User 2 (Test Subject - Low Privilege):`);
  sdk.console.log(`      Status: ${result.user2.status}`);
  if (config.verboseLogging) {
    sdk.console.log(`      Body: ${result.user2.body.substring(0, 200)}...`);
  }

  // Analysis details
  if (result.comparison && config.verboseLogging) {
    sdk.console.log(`\n🔬 Detailed Analysis:`);
    sdk.console.log(`   Authorization Bypass: ${result.comparison.details.authorizationBypass ? "YES ⚠️" : "NO ✅"}`);
    
    if (result.comparison.details.possibleEscalation) {
      sdk.console.log(`   Privilege Escalation: POSSIBLE ⚠️`);
    }
    
    if (result.comparison.severity && result.comparison.severity !== "NONE") {
      sdk.console.log(`   Severity Level: ${result.comparison.severity}`);
    }
  }

  // Metadata
  sdk.console.log(`\n📈 Test Metadata:`);
  sdk.console.log(`   Test Type: ${testType}`);
  sdk.console.log(`   Execution Time: ${result.metadata.executionTime}`);
  sdk.console.log(`   Timestamp: ${result.metadata.timestamp}`);
  
  sdk.console.log(`\n${"=".repeat(80)}\n`);
}
