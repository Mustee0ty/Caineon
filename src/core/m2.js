/**
 * M2: Cross-Account Write/Mutation Test Generator
 * 
 * Tests whether User 2 can modify, create, or delete data that belongs to User 1.
 * Applies to POST, PUT, PATCH, DELETE and other mutation operations.
 * 
 * @module m2
 */

/**
 * HTTP methods that are considered "write/mutation" operations
 */
const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Risk levels for different mutation types
 */
const MUTATION_RISK = {
  DELETE: "CRITICAL",
  PUT: "HIGH",
  PATCH: "HIGH",
  POST: "MEDIUM",
};

/**
 * Determines if a request qualifies as an M2 test based on HTTP method
 * 
 * @param {Object} request - Caido request object
 * @returns {boolean} True if request is a write/mutation operation
 */
export function isM2Candidate(request) {
  const method = request.getMethod().toUpperCase();
  return WRITE_METHODS.includes(method);
}

/**
 * Gets the risk level for a mutation operation
 * 
 * @param {string} method - HTTP method
 * @returns {string} Risk level (CRITICAL, HIGH, MEDIUM)
 */
export function getMutationRisk(method) {
  return MUTATION_RISK[method.toUpperCase()] || "MEDIUM";
}

/**
 * Generates M2 test specification for a captured request
 * 
 * @param {Object} request - Caido request object from User 1
 * @param {Object} options - Optional configuration
 * @param {string} options.description - Custom test description
 * @param {boolean} options.safe - If true, don't actually execute (dry-run)
 * @param {Object} options.rollback - Rollback information if mutation succeeds
 * @returns {Object} M2 test specification
 * 
 * @example
 * const test = M2(request, {
 *   description: "Check if User 2 can delete User 1's post",
 *   safe: false,
 *   rollback: { method: "POST", endpoint: "/api/posts", body: originalData }
 * });
 */
export function M2(request, options = {}) {
  const method = request.getMethod();
  const url = request.getUrl();
  
  // Extract potential identifiers from URL for test naming
  const pathParts = new URL(url).pathname.split("/").filter(Boolean);
  const resource = pathParts[pathParts.length - 2] || "resource";
  const identifier = pathParts[pathParts.length - 1] || "unknown";
  
  const testName = options.description || 
    `M2: Cross-Account ${method} - ${resource}/${identifier}`;
  
  const riskLevel = getMutationRisk(method);
  
  return {
    type: "M2",
    name: testName,
    request: request,
    method: method,
    url: url,
    mutation: "USER_2_AUTH",
    riskLevel: riskLevel,
    safe: options.safe || false,
    rollback: options.rollback || null,
    metadata: {
      resource: resource,
      identifier: identifier,
      timestamp: new Date().toISOString(),
      originalMethod: method,
      requiresRollback: !!options.rollback,
    },
  };
}

/**
 * Advanced M2 test generator with automatic rollback detection
 * 
 * @param {Object} request - Caido request object
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoRollback - Attempt to create rollback automatically
 * @returns {Object} Enhanced M2 test specification
 * 
 * @example
 * const test = M2Advanced(request, { autoRollback: true });
 * // Will attempt to create inverse operation for rollback
 */
export function M2Advanced(request, options = {}) {
  const method = request.getMethod().toUpperCase();
  let rollback = null;
  
  if (options.autoRollback) {
    // Attempt to create inverse operation
    rollback = generateRollback(request);
  }
  
  return M2(request, {
    ...options,
    rollback: rollback,
  });
}

/**
 * Generate rollback operation for a mutation
 * 
 * @param {Object} request - Caido request object
 * @returns {Object|null} Rollback specification or null if not possible
 */
function generateRollback(request) {
  const method = request.getMethod().toUpperCase();
  const url = request.getUrl();
  
  switch (method) {
    case "DELETE":
      // To rollback DELETE, we need the original data (not available here)
      return {
        method: "POST",
        endpoint: url.substring(0, url.lastIndexOf("/")),
        note: "Requires original data to restore",
      };
    
    case "POST":
      // To rollback POST, we need to DELETE the created resource
      return {
        method: "DELETE",
        endpoint: url + "/{CREATED_ID}",
        note: "Requires ID from creation response",
      };
    
    case "PUT":
    case "PATCH":
      // To rollback PUT/PATCH, we need the original state
      return {
        method: method,
        endpoint: url,
        note: "Requires original state before mutation",
      };
    
    default:
      return null;
  }
}

/**
 * Batch M2 test generator for multiple requests
 * 
 * @param {Array<Object>} requests - Array of Caido request objects
 * @param {Object} options - Shared options for all tests
 * @returns {Array<Object>} Array of M2 test specifications
 * 
 * @example
 * const tests = M2Batch([req1, req2, req3], { safe: true });
 * // Returns array of M2 tests in safe mode
 */
export function M2Batch(requests, options = {}) {
  return requests
    .filter(req => isM2Candidate(req))
    .map(req => M2(req, options));
}

/**
 * M2 test generator with safe mode enforcement
 * Creates read-only test that checks authorization without executing mutation
 * 
 * @param {Object} request - Caido request object
 * @returns {Object} Safe M2 test that won't execute the mutation
 * 
 * @example
 * const test = M2Safe(request);
 * // Will check if User 2 gets past authorization but won't execute
 */
export function M2Safe(request) {
  return {
    ...M2(request, { safe: true }),
    executionMode: "DRY_RUN",
    note: "Safe mode: Authorization check only, mutation will not execute",
  };
}

/**
 * M2 test generator for specific mutation scenarios
 * 
 * @param {Object} request - Caido request object
 * @param {string} scenario - Scenario type (privilege_escalation, data_tampering, etc.)
 * @returns {Object} M2 test with scenario-specific configuration
 * 
 * @example
 * const test = M2Scenario(request, "privilege_escalation");
 * // Configures test for privilege escalation detection
 */
export function M2Scenario(request, scenario) {
  const scenarios = {
    privilege_escalation: {
      description: "Test if User 2 can escalate their privileges",
      checkFields: ["role", "permissions", "isAdmin"],
    },
    data_tampering: {
      description: "Test if User 2 can modify User 1's data",
      checkFields: ["userId", "ownerId", "createdBy"],
    },
    resource_deletion: {
      description: "Test if User 2 can delete User 1's resources",
      riskOverride: "CRITICAL",
    },
    unauthorized_creation: {
      description: "Test if User 2 can create resources on behalf of User 1",
      checkFields: ["createdBy", "author", "userId"],
    },
  };
  
  const config = scenarios[scenario] || {};
  
  return {
    ...M2(request, {
      description: config.description,
    }),
    scenario: scenario,
    checkFields: config.checkFields || [],
    riskLevel: config.riskOverride || getMutationRisk(request.getMethod()),
  };
}

/**
 * M2 test generator with state tracking
 * Captures pre-mutation state for comparison
 * 
 * @param {Object} request - Caido request object
 * @param {Object} preState - State before mutation (from a GET request)
 * @returns {Object} M2 test with state tracking
 * 
 * @example
 * const originalState = await getResource(resourceId);
 * const test = M2WithStateTracking(request, originalState);
 */
export function M2WithStateTracking(request, preState) {
  return {
    ...M2(request),
    preState: preState,
    stateTracking: true,
    rollback: {
      method: "PUT",
      endpoint: request.getUrl(),
      body: preState,
      note: "Can restore to pre-mutation state",
    },
  };
}

export default {
  M2,
  M2Advanced,
  M2Batch,
  M2Safe,
  M2Scenario,
  M2WithStateTracking,
  isM2Candidate,
  getMutationRisk,
};
