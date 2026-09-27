/**
 * HTTP History Handler for CaineonJS
 * 
 * Processes Caido HTTP history requests for batch authorization testing.
 * Supports filtering, sorting, and smart request selection for M1/M2 testing.
 * 
 * @module history-handler
 */

import { M1, isM1Candidate } from "../core/m1.js";
import { M2, isM2Candidate } from "../core/m2.js";

/**
 * Request metadata extraction
 */
function extractRequestMetadata(request) {
  return {
    method: request.getMethod(),
    url: request.getUrl(),
    path: request.getPath ? request.getPath() : new URL(request.getUrl()).pathname,
    host: new URL(request.getUrl()).host,
    statusCode: request.getCode ? request.getCode() : null,
    timestamp: request.getTimestamp ? request.getTimestamp() : Date.now(),
    contentType: request.getHeader("content-type") || "unknown",
    isSecure: request.getUrl().startsWith("https"),
    hasAuthHeader: !!(
      request.getHeader("authorization") ||
      request.getHeader("cookie") ||
      request.getHeader("x-api-key")
    ),
  };
}

/**
 * Filter HTTP history by criteria
 * 
 * @param {Array} requests - Array of HTTP requests from history
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered requests
 * 
 * @example
 * const filtered = filterHistory(requests, {
 *   methods: ["GET", "POST"],
 *   excludePaths: ["/static/", "/cdn/"],
 *   hasAuth: true,
 *   statusCodeRange: [200, 299]
 * });
 */
export function filterHistory(requests, filters = {}) {
  return requests.filter(request => {
    const meta = extractRequestMetadata(request);
    
    // Filter by HTTP methods
    if (filters.methods && !filters.methods.includes(meta.method)) {
      return false;
    }
    
    // Filter by status code range
    if (filters.statusCodeRange && meta.statusCode) {
      const [min, max] = filters.statusCodeRange;
      if (meta.statusCode < min || meta.statusCode > max) {
        return false;
      }
    }
    
    // Filter by path patterns
    if (filters.includePaths) {
      const matches = filters.includePaths.some(pattern =>
        meta.path.includes(pattern)
      );
      if (!matches) return false;
    }
    
    // Exclude by path patterns
    if (filters.excludePaths) {
      const excluded = filters.excludePaths.some(pattern =>
        meta.path.includes(pattern)
      );
      if (excluded) return false;
    }
    
    // Filter by host
    if (filters.hosts && !filters.hosts.includes(meta.host)) {
      return false;
    }
    
    // Filter by authentication presence
    if (filters.hasAuth !== undefined) {
      if (meta.hasAuthHeader !== filters.hasAuth) {
        return false;
      }
    }
    
    // Filter by content type
    if (filters.contentTypes) {
      const matches = filters.contentTypes.some(type =>
        meta.contentType.includes(type)
      );
      if (!matches) return false;
    }
    
    // Custom filter function
    if (filters.custom && typeof filters.custom === "function") {
      if (!filters.custom(request, meta)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort HTTP history by criteria
 * 
 * @param {Array} requests - Array of HTTP requests
 * @param {string} sortBy - Sort key (method, path, host, timestamp, severity)
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted requests
 * 
 * @example
 * const sorted = sortHistory(requests, "path", "asc");
 * const bySeverity = sortHistory(requests, "severity", "desc");
 */
export function sortHistory(requests, sortBy = "timestamp", order = "desc") {
  const sorted = [...requests];
  
  sorted.sort((a, b) => {
    const metaA = extractRequestMetadata(a);
    const metaB = extractRequestMetadata(b);
    
    let valueA, valueB;
    
    switch (sortBy) {
      case "method":
        valueA = metaA.method;
        valueB = metaB.method;
        break;
      
      case "path":
        valueA = metaA.path;
        valueB = metaB.path;
        break;
      
      case "host":
        valueA = metaA.host;
        valueB = metaB.host;
        break;
      
      case "timestamp":
        valueA = metaA.timestamp;
        valueB = metaB.timestamp;
        break;
      
      case "url":
        valueA = metaA.url;
        valueB = metaB.url;
        break;
      
      case "severity":
        valueA = calculateRequestSeverity(a);
        valueB = calculateRequestSeverity(b);
        break;
      
      case "testType":
        valueA = isM2Candidate(a) ? 1 : 0;
        valueB = isM2Candidate(b) ? 1 : 0;
        break;
      
      default:
        return 0;
    }
    
    // Handle string comparison
    if (typeof valueA === "string") {
      if (order === "asc") {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    }
    
    // Handle numeric comparison
    if (order === "asc") {
      return valueA - valueB;
    } else {
      return valueB - valueA;
    }
  });
  
  return sorted;
}

/**
 * Group HTTP history by criteria
 * 
 * @param {Array} requests - Array of HTTP requests
 * @param {string} groupBy - Grouping key (method, path, host, testType)
 * @returns {Object} Grouped requests
 * 
 * @example
 * const byMethod = groupHistory(requests, "method");
 * console.log(byMethod.GET.length); // 45
 * console.log(byMethod.POST.length); // 23
 */
export function groupHistory(requests, groupBy = "method") {
  const groups = {};
  
  requests.forEach(request => {
    const meta = extractRequestMetadata(request);
    
    let key;
    
    switch (groupBy) {
      case "method":
        key = meta.method;
        break;
      
      case "path":
        key = meta.path;
        break;
      
      case "host":
        key = meta.host;
        break;
      
      case "testType":
        key = isM2Candidate(request) ? "M2" : "M1";
        break;
      
      case "statusCode":
        key = meta.statusCode ? `${meta.statusCode}` : "unknown";
        break;
      
      default:
        key = "ungrouped";
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    
    groups[key].push(request);
  });
  
  return groups;
}

/**
 * Calculate risk severity of a request for sorting/prioritization
 * 
 * @param {Object} request - HTTP request
 * @returns {number} Severity score (0-100)
 */
function calculateRequestSeverity(request) {
  let score = 0;
  const meta = extractRequestMetadata(request);
  
  // Mutation operations are higher risk
  if (isM2Candidate(request)) {
    score += 50;
    
    if (meta.method === "DELETE") score += 30;
    if (meta.method === "PATCH") score += 20;
  }
  
  // API endpoints with IDs in path are potential IDOR vectors
  if (/\/api\/.*\/\d+|\/api\/.*\/[a-f0-9-]{36}/.test(meta.path)) {
    score += 20;
  }
  
  // Data endpoints (not static) are higher risk
  if (!meta.path.includes("/static") && !meta.path.includes("/cdn")) {
    score += 10;
  }
  
  // Requests with auth headers are relevant
  if (meta.hasAuthHeader) {
    score += 5;
  }
  
  return Math.min(score, 100);
}

/**
 * Deduplicate requests by URL + method combination
 * 
 * @param {Array} requests - Array of HTTP requests
 * @returns {Array} Deduplicated requests (keeps first occurrence)
 */
export function deduplicateRequests(requests) {
  const seen = new Set();
  const unique = [];
  
  requests.forEach(request => {
    const meta = extractRequestMetadata(request);
    const key = `${meta.method} ${meta.url}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(request);
    }
  });
  
  return unique;
}

/**
 * Recommend requests for authorization testing
 * 
 * Uses heuristics to identify high-value requests for M1/M2 testing:
 * - API endpoints with resource IDs
 * - Requests with proper authentication
 * - Mutation operations (M2)
 * - Non-static resources
 * 
 * @param {Array} requests - Array of HTTP requests
 * @param {Object} options - Recommendation options
 * @returns {Array} Recommended requests sorted by test value
 * 
 * @example
 * const candidates = recommendRequests(history, {
 *   minScore: 40,
 *   limit: 20,
 *   includeM2: true
 * });
 */
export function recommendRequests(requests, options = {}) {
  const {
    minScore = 30,
    limit = 50,
    includeM2 = true,
    excludeStatic = true,
  } = options;
  
  // Score each request
  const scored = requests.map(request => {
    const meta = extractRequestMetadata(request);
    let score = calculateRequestSeverity(request);
    
    // Bonus for API patterns with IDs
    if (/\/api\/.*\/\d+|\/api\/.*\/[a-f0-9-]{36}/.test(meta.path)) {
      score += 15;
    }
    
    // Bonus for common data endpoints
    if (/\/(users|orders|posts|products|items|resources)\/\d+/.test(meta.path)) {
      score += 20;
    }
    
    // Penalty for static resources
    if (excludeStatic && (meta.path.includes("/static") || meta.path.includes("/cdn"))) {
      score -= 40;
    }
    
    return { request, score, meta };
  });
  
  // Filter by minimum score and exclusions
  let candidates = scored
    .filter(item => item.score >= minScore)
    .filter(item => includeM2 || !isM2Candidate(item.request));
  
  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  
  // Limit results and return requests only
  return candidates.slice(0, limit).map(item => item.request);
}

/**
 * Build test batch from history
 * 
 * @param {Array} requests - Array of HTTP requests
 * @param {Object} options - Batch options
 * @returns {Array} Array of test specifications
 * 
 * @example
 * const tests = buildTestBatch(history, {
 *   filterM1: true,
 *   limit: 10,
 *   dedup: true
 * });
 */
export function buildTestBatch(requests, options = {}) {
  const {
    filterM1 = false,
    filterM2 = false,
    limit = null,
    dedup = true,
    sort = "severity",
  } = options;
  
  let candidates = [...requests];
  
  // Deduplicate if requested
  if (dedup) {
    candidates = deduplicateRequests(candidates);
  }
  
  // Filter by test type
  if (filterM1) {
    candidates = candidates.filter(isM1Candidate);
  }
  if (filterM2) {
    candidates = candidates.filter(isM2Candidate);
  }
  
  // Sort candidates
  candidates = sortHistory(candidates, sort, "desc");
  
  // Limit results
  if (limit) {
    candidates = candidates.slice(0, limit);
  }
  
  // Convert to test specifications
  const tests = candidates.map((request, index) => {
    const meta = extractRequestMetadata(request);
    const isM2 = isM2Candidate(request);
    
    if (isM2) {
      return M2(request, { name: `M2-${index + 1}` });
    } else {
      return M1(request, { name: `M1-${index + 1}` });
    }
  });
  
  return tests;
}

/**
 * Generate analysis report for request batch
 * 
 * @param {Array} requests - Array of HTTP requests
 * @returns {Object} Analysis report
 */
export function analyzeRequestBatch(requests) {
  const report = {
    totalRequests: requests.length,
    byMethod: {},
    byHost: {},
    byTestType: { M1: 0, M2: 0 },
    authentication: {
      withAuth: 0,
      withoutAuth: 0,
    },
    pathPatterns: [],
    statusCodeDistribution: {},
    recommendations: {
      highPriorityM1: 0,
      highPriorityM2: 0,
      staticResources: 0,
    },
  };
  
  requests.forEach(request => {
    const meta = extractRequestMetadata(request);
    const severity = calculateRequestSeverity(request);
    
    // Count by method
    report.byMethod[meta.method] = (report.byMethod[meta.method] || 0) + 1;
    
    // Count by host
    report.byHost[meta.host] = (report.byHost[meta.host] || 0) + 1;
    
    // Count by test type
    if (isM2Candidate(request)) {
      report.byTestType.M2++;
    } else {
      report.byTestType.M1++;
    }
    
    // Count authentication
    if (meta.hasAuthHeader) {
      report.authentication.withAuth++;
    } else {
      report.authentication.withoutAuth++;
    }
    
    // Extract path patterns
    const pathPattern = meta.path.replace(/\/\d+/g, "/{id}").replace(/\/[a-f0-9-]{36}/g, "/{uuid}");
    if (!report.pathPatterns.includes(pathPattern)) {
      report.pathPatterns.push(pathPattern);
    }
    
    // Status code distribution
    if (meta.statusCode) {
      const code = `${meta.statusCode}`;
      report.statusCodeDistribution[code] = (report.statusCodeDistribution[code] || 0) + 1;
    }
    
    // Recommendations
    if (severity >= 70 && isM2Candidate(request)) {
      report.recommendations.highPriorityM2++;
    } else if (severity >= 50 && !isM2Candidate(request)) {
      report.recommendations.highPriorityM1++;
    }
    
    if (meta.path.includes("/static") || meta.path.includes("/cdn")) {
      report.recommendations.staticResources++;
    }
  });
  
  return report;
}

export default {
  filterHistory,
  sortHistory,
  groupHistory,
  deduplicateRequests,
  recommendRequests,
  buildTestBatch,
  analyzeRequestBatch,
  extractRequestMetadata,
};
