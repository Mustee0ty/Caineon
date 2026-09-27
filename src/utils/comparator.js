/**
 * Response Comparator Utilities
 * 
 * Advanced comparison logic for detecting authorization bypasses.
 * Provides detailed analysis of response differences.
 * 
 * @module comparator
 */

/**
 * Deep compare two response bodies
 * 
 * @param {Buffer|string} body1 - User 1 response body
 * @param {Buffer|string} body2 - User 2 response body
 * @returns {Object} Comparison result
 */
export function compareResponseBodies(body1, body2) {
  const str1 = body1?.toString() || "";
  const str2 = body2?.toString() || "";
  
  // Exact match
  if (str1 === str2) {
    return {
      identical: true,
      similarity: 1.0,
      differences: [],
    };
  }
  
  // Try JSON comparison
  try {
    const json1 = JSON.parse(str1);
    const json2 = JSON.parse(str2);
    
    return compareJSON(json1, json2);
  } catch (e) {
    // Not JSON, do text comparison
    return compareText(str1, str2);
  }
}

/**
 * Compare JSON objects
 * 
 * @param {Object} obj1 - First JSON object
 * @param {Object} obj2 - Second JSON object
 * @returns {Object} Comparison result
 */
function compareJSON(obj1, obj2) {
  const differences = [];
  const allKeys = new Set([
    ...Object.keys(obj1 || {}),
    ...Object.keys(obj2 || {}),
  ]);
  
  for (const key of allKeys) {
    if (!(key in obj1)) {
      differences.push({
        type: "missing_in_first",
        key: key,
        value: obj2[key],
      });
    } else if (!(key in obj2)) {
      differences.push({
        type: "missing_in_second",
        key: key,
        value: obj1[key],
      });
    } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      differences.push({
        type: "value_mismatch",
        key: key,
        first: obj1[key],
        second: obj2[key],
      });
    }
  }
  
  const similarity = 1 - (differences.length / Math.max(allKeys.size, 1));
  
  return {
    identical: differences.length === 0,
    similarity: similarity,
    differences: differences,
    format: "json",
  };
}

/**
 * Compare text strings
 * 
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {Object} Comparison result
 */
function compareText(text1, text2) {
  const len1 = text1.length;
  const len2 = text2.length;
  
  // Simple length comparison
  if (len1 === 0 && len2 === 0) {
    return {
      identical: true,
      similarity: 1.0,
      differences: [],
      format: "text",
    };
  }
  
  // Calculate similarity (basic Levenshtein-like ratio)
  const maxLen = Math.max(len1, len2);
  const minLen = Math.min(len1, len2);
  const similarity = minLen / maxLen;
  
  return {
    identical: false,
    similarity: similarity,
    differences: [
      {
        type: "length_mismatch",
        firstLength: len1,
        secondLength: len2,
      },
    ],
    format: "text",
  };
}

/**
 * Check if response contains sensitive fields
 * 
 * @param {Object} response - Caido response object
 * @param {Array<string>} sensitiveFields - List of field names to check
 * @returns {Object} Detection result
 */
export function detectSensitiveData(response, sensitiveFields) {
  const body = response.getBody()?.toString() || "";
  const detected = [];
  
  try {
    const json = JSON.parse(body);
    
    for (const field of sensitiveFields) {
      if (hasNestedKey(json, field)) {
        detected.push({
          field: field,
          found: true,
          location: "body",
        });
      }
    }
  } catch (e) {
    // Not JSON, do text search
    for (const field of sensitiveFields) {
      if (body.toLowerCase().includes(field.toLowerCase())) {
        detected.push({
          field: field,
          found: true,
          location: "body",
        });
      }
    }
  }
  
  return {
    hasSensitiveData: detected.length > 0,
    detectedFields: detected,
  };
}

/**
 * Check if object has nested key
 * 
 * @param {Object} obj - Object to search
 * @param {string} key - Key to find
 * @returns {boolean} True if key exists at any nesting level
 */
function hasNestedKey(obj, key) {
  if (obj === null || typeof obj !== "object") {
    return false;
  }
  
  if (key.toLowerCase() in Object.keys(obj).map(k => k.toLowerCase())) {
    return true;
  }
  
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && hasNestedKey(value, key)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Analyze response headers for authorization indicators
 * 
 * @param {Object} response - Caido response object
 * @returns {Object} Header analysis
 */
export function analyzeHeaders(response) {
  const headers = response.getHeaders() || {};
  const indicators = [];
  
  // Check for common authorization headers
  const authHeaders = [
    "www-authenticate",
    "authorization",
    "x-authenticated-user",
    "x-user-id",
  ];
  
  for (const header of authHeaders) {
    if (header.toLowerCase() in Object.keys(headers).map(k => k.toLowerCase())) {
      indicators.push({
        header: header,
        present: true,
      });
    }
  }
  
  return {
    authIndicators: indicators,
    hasAuthHeaders: indicators.length > 0,
  };
}

export default {
  compareResponseBodies,
  detectSensitiveData,
  analyzeHeaders,
};
