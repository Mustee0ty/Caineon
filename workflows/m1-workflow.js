/**
 * M1 Workflow - Cross-Account Read Testing
 * 
 * This is a ready-to-use Caido Workflow JS node for M1 testing.
 * Import this into Caido and configure your credentials.
 * 
 * Usage:
 * 1. Copy this file content into a Caido Workflow JS node
 * 2. Update the credentials object with your User 1 and User 2 tokens
 * 3. Send requests through the workflow
 * 4. Review results in the console output
 */

import { M1 } from "../src/core/m1.js";
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
  sdk.console.log(`🔍 M1 Authorization Test: ${method} ${url}`);
  sdk.console.log(`${"=".repeat(80)}\n`);

  // Generate M1 test
  const test = M1(request, {
    sensitiveFields: ["userId", "email", "accountId", "ssn", "creditCard"],
  });

  sdk.console.log(`📋 Test: ${test.name}`);
  sdk.console.log(`🎯 Mutation: ${test.mutation}\n`);

  try {
    // Execute the test
    const result = await executeTest(test, credentials, sdk);

    // Display results
    displayResults(result, sdk);

    // Return verdict for workflow chaining
    return result.verdict;
  } catch (error) {
    sdk.console.error(`❌ Test execution failed: ${error.message}`);
    return "ERROR";
  }
}

/**
 * Display formatted test results
 */
function displayResults(result, sdk) {
  const icons = {
    VULNERABLE: "🚨",
    SECURE: "✅",
    ANOMALY: "⚠️",
    INCONCLUSIVE: "❓",
    ERROR: "❌",
  };

  const icon = icons[result.verdict] || "❓";
  
  sdk.console.log(`${icon} VERDICT: ${result.verdict}`);
  sdk.console.log(`📝 Reason: ${result.reason}\n`);

  // User 1 response
  sdk.console.log(`👤 User 1 (Baseline):`);
  sdk.console.log(`   Status: ${result.user1.status}`);
  sdk.console.log(`   Body Preview: ${result.user1.body.substring(0, 100)}...\n`);

  // User 2 response
  sdk.console.log(`👤 User 2 (Test Subject):`);
  sdk.console.log(`   Status: ${result.user2.status}`);
  sdk.console.log(`   Body Preview: ${result.user2.body.substring(0, 100)}...\n`);

  // Comparison details
  if (result.comparison) {
    sdk.console.log(`🔬 Analysis:`);
    sdk.console.log(`   Authorization Bypass: ${result.comparison.details.authorizationBypass ? "YES" : "NO"}`);
    if (result.comparison.severity !== "NONE") {
      sdk.console.log(`   Severity: ${result.comparison.severity}`);
    }
  }

  sdk.console.log(`\n⏱️  Execution Time: ${result.metadata.executionTime}`);
  sdk.console.log(`${"=".repeat(80)}\n`);
}
