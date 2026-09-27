/**
 * M1: Cross-Account Read Test Generator
 * 
 * Tests whether User 2 can read data that belongs to User 1.
 * Typically used for GET requests but can apply to any read operation.
 * 
 * @module m1
 */

/**
 * HTTP methods that are considered "read" operations
 */
const READ_METHODS = ["GET", "HEAD", "OPTIONS"];

/**
 * Determines if a request qualifies as an M1 test based on HTTP method
 * 
 * @param {Object} request - Caido request object
 * @returns {boolean} True if request is a read operation
 */
export function isM1Candidate(request) {
  const method = request.getMethod().toUpperCase();
  return READ_METHODS.includes(method);
}

/**
 * Generates M1 test specification for a captured request
 * 
 * @param {Object} request - Caido request object from User 1
 * @param {Object} options - Optional configuration
 * @param {string} options.description - Custom test description
 * @param {Array<string>} options.sensitiveFields - Fields to check in response
 * @returns {Object} M1 test specification
 * 
 * @example
 * const test = M1(request, {
 *   description: "Check if User 2 can read User 1's order",
 *   sensitiveFields: ["userId", "email", "creditCard"]
 * });
 */
export function M1(request, options = {}) {
  const method = request.getMethod();
  const url = request.getUrl();
  
  // Extract potential identifiers from URL for test naming
  const pathParts = new URL(url).pathname.split("/").filter(Boolean);
  const resource = pathParts[pathParts.length - 2] || "resource";
  const identifier = pathParts[pathParts.length - 1] || "unknown";
  
  const testName = options.description || 
    `M1: Cross-Account Read - ${method} ${resource}/${identifier}`;
  
  return {
    type: "M1",
    name: testName,
    request: request,
    method: method,
    url: url,
    mutation: "USER_2_AUTH",
    sensitiveFields: options.sensitiveFields || [],
    metadata: {
      resource: resource,
      identifier: identifier,
      timestamp: new Date().toISOString(),
      originalMethod: method,
    },
  };
}

/**
 * Advanced M1 test generator with automatic sensitive field detection
 * 
 * @param {Object} request - Caido request object
 * @param {Object} baselineResponse - Response from User 1 (optional, for comparison)
 * @returns {Object} Enhanced M1 test specification
 * 
 * @example
 * const test = M1Advanced(request, user1Response);
 * // Will automatically detect fields like userId, email, etc.
 */
export function M1Advanced(request, baselineResponse = null) {
  const commonSensitiveFields = [
    "userId", "user_id", "email", "username",
    "ssn", "phone", "address", "creditCard",
    "accountNumber", "balance", "salary"
  ];
  
  let detectedFields = [];
  
  if (baselineResponse) {
    try {
      const bodyText = baselineResponse.getBody()?.toString() || "{}";
      const body = JSON.parse(bodyText);
      
      // Find which sensitive fields exist in the response
      detectedFields = commonSensitiveFields.filter(field => 
        JSON.stringify(body).toLowerCase().includes(field.toLowerCase())
      );
    } catch (e) {
      // Not JSON or parse error, use default fields
      detectedFields = commonSensitiveFields;
    }
  }
  
  return M1(request, {
    sensitiveFields: detectedFields.length > 0 ? detectedFields : commonSensitiveFields,
  });
}

/**
 * Batch M1 test generator for multiple requests
 * 
 * @param {Array<Object>} requests - Array of Caido request objects
 * @returns {Array<Object>} Array of M1 test specifications
 * 
 * @example
 * const tests = M1Batch([req1, req2, req3]);
 * // Returns array of M1 tests, one for each request
 */
export function M1Batch(requests) {
  return requests
    .filter(req => isM1Candidate(req))
    .map(req => M1(req));
}

/**
 * M1 test generator with parameterized resource enumeration
 * Useful for testing multiple resource IDs
 * 
 * @param {Object} request - Caido request object
 * @param {Array<string>} resourceIds - Array of IDs to test
 * @returns {Array<Object>} Array of M1 tests for each ID
 * 
 * @example
 * const tests = M1WithEnumeration(request, ["123", "456", "789"]);
 * // Creates M1 tests for /api/orders/123, /api/orders/456, etc.
 */
export function M1WithEnumeration(request, resourceIds) {
  return resourceIds.map(id => {
    const url = request.getUrl();
    const urlParts = url.split("/");
    urlParts[urlParts.length - 1] = id;
    const newUrl = urlParts.join("/");
    
    return {
      ...M1(request),
      url: newUrl,
      name: `M1: Cross-Account Read - ${id}`,
      metadata: {
        ...M1(request).metadata,
        enumeratedId: id,
      },
    };
  });
}

export default {
  M1,
  M1Advanced,
  M1Batch,
  M1WithEnumeration,
  isM1Candidate,
};
