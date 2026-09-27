/**
 * Credential Management System
 * 
 * Manages User 1 and User 2 credentials for authorization testing.
 * Supports multiple authentication schemes and secure credential storage.
 * 
 * @module credentials
 */

/**
 * Default credential configuration
 * 
 * SECURITY WARNING: Do not commit real credentials to version control.
 * Use environment variables or external secret management instead.
 */
export const credentials = {
  user1: {
    type: "bearer",
    value: "NEON_ACCOUNT_A_TOKEN_HERE",
    label: "Account A (High Privilege - Admin/Owner)",
  },
  user2: {
    type: "bearer",
    value: "NEON_ACCOUNT_B_TOKEN_HERE",
    label: "Account B (Regular User)",
  },
};

/**
 * Load credentials from environment variables
 * 
 * Environment variable format:
 * - CAINEON_USER1_TYPE=bearer
 * - CAINEON_USER1_VALUE=eyJhbGci...
 * - CAINEON_USER2_TYPE=bearer
 * - CAINEON_USER2_VALUE=eyJhbGci...
 * 
 * @returns {Object} Credentials loaded from environment
 */
export function loadFromEnvironment() {
  return {
    user1: {
      type: process.env.CAINEON_USER1_TYPE || "bearer",
      value: process.env.CAINEON_USER1_VALUE || "",
      label: process.env.CAINEON_USER1_LABEL || "User 1",
    },
    user2: {
      type: process.env.CAINEON_USER2_TYPE || "bearer",
      value: process.env.CAINEON_USER2_VALUE || "",
      label: process.env.CAINEON_USER2_LABEL || "User 2",
    },
  };
}

/**
 * Create bearer token credentials
 * 
 * @param {string} user1Token - User 1 bearer token
 * @param {string} user2Token - User 2 bearer token
 * @returns {Object} Credential configuration
 * 
 * @example
 * const creds = createBearerCredentials(
 *   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * );
 */
export function createBearerCredentials(user1Token, user2Token) {
  return {
    user1: {
      type: "bearer",
      value: user1Token,
      label: "User 1 (Bearer)",
    },
    user2: {
      type: "bearer",
      value: user2Token,
      label: "User 2 (Bearer)",
    },
  };
}

/**
 * Create cookie-based credentials
 * 
 * @param {string} user1Cookie - User 1 cookie string
 * @param {string} user2Cookie - User 2 cookie string
 * @returns {Object} Credential configuration
 * 
 * @example
 * const creds = createCookieCredentials(
 *   "session=abc123; userId=user1",
 *   "session=def456; userId=user2"
 * );
 */
export function createCookieCredentials(user1Cookie, user2Cookie) {
  return {
    user1: {
      type: "cookie",
      value: user1Cookie,
      label: "User 1 (Cookie)",
    },
    user2: {
      type: "cookie",
      value: user2Cookie,
      label: "User 2 (Cookie)",
    },
  };
}

/**
 * Create custom header credentials
 * 
 * @param {string} headerName - Name of the authentication header
 * @param {string} user1Value - User 1 header value
 * @param {string} user2Value - User 2 header value
 * @returns {Object} Credential configuration
 * 
 * @example
 * const creds = createCustomHeaderCredentials(
 *   "X-API-Key",
 *   "key_abc123",
 *   "key_def456"
 * );
 */
export function createCustomHeaderCredentials(headerName, user1Value, user2Value) {
  return {
    user1: {
      type: "custom",
      headerName: headerName,
      value: user1Value,
      label: `User 1 (${headerName})`,
    },
    user2: {
      type: "custom",
      headerName: headerName,
      value: user2Value,
      label: `User 2 (${headerName})`,
    },
  };
}

/**
 * Create basic auth credentials
 * 
 * @param {string} user1Username - User 1 username
 * @param {string} user1Password - User 1 password
 * @param {string} user2Username - User 2 username
 * @param {string} user2Password - User 2 password
 * @returns {Object} Credential configuration
 * 
 * @example
 * const creds = createBasicAuthCredentials(
 *   "admin", "admin123",
 *   "user", "user123"
 * );
 */
export function createBasicAuthCredentials(user1Username, user1Password, user2Username, user2Password) {
  const user1Encoded = Buffer.from(`${user1Username}:${user1Password}`).toString("base64");
  const user2Encoded = Buffer.from(`${user2Username}:${user2Password}`).toString("base64");
  
  return {
    user1: {
      type: "basic",
      value: user1Encoded,
      label: `User 1 (${user1Username})`,
    },
    user2: {
      type: "basic",
      value: user2Encoded,
      label: `User 2 (${user2Username})`,
    },
  };
}

/**
 * Validate credential configuration
 * 
 * @param {Object} credentials - Credential configuration to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 * 
 * @example
 * const result = validateCredentials(credentials);
 * if (!result.valid) {
 *   console.error("Invalid credentials:", result.errors);
 * }
 */
export function validateCredentials(credentials) {
  const errors = [];
  
  // Check required structure
  if (!credentials.user1 || !credentials.user2) {
    errors.push("Missing user1 or user2 configuration");
    return { valid: false, errors };
  }
  
  // Validate user1
  if (!credentials.user1.type) {
    errors.push("user1: missing 'type' field");
  }
  
  if (!credentials.user1.value) {
    errors.push("user1: missing 'value' field");
  }
  
  if (credentials.user1.type === "custom" && !credentials.user1.headerName) {
    errors.push("user1: custom type requires 'headerName' field");
  }
  
  // Validate user2
  if (!credentials.user2.type) {
    errors.push("user2: missing 'type' field");
  }
  
  if (!credentials.user2.value) {
    errors.push("user2: missing 'value' field");
  }
  
  if (credentials.user2.type === "custom" && !credentials.user2.headerName) {
    errors.push("user2: custom type requires 'headerName' field");
  }
  
  // Check if types match
  if (credentials.user1.type !== credentials.user2.type) {
    errors.push("user1 and user2 must use the same credential type");
  }
  
  // Validate supported types
  const supportedTypes = ["bearer", "cookie", "custom", "basic"];
  if (!supportedTypes.includes(credentials.user1.type)) {
    errors.push(`user1: unsupported type '${credentials.user1.type}'. Supported: ${supportedTypes.join(", ")}`);
  }
  
  if (!supportedTypes.includes(credentials.user2.type)) {
    errors.push(`user2: unsupported type '${credentials.user2.type}'. Supported: ${supportedTypes.join(", ")}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Mask sensitive credential values for logging
 * 
 * @param {Object} credentials - Credential configuration
 * @returns {Object} Masked credentials safe for logging
 * 
 * @example
 * const masked = maskCredentials(credentials);
 * console.log(masked); // Shows type and label, masks value
 */
export function maskCredentials(credentials) {
  const maskValue = (value) => {
    if (!value || value.length < 8) return "***";
    return value.substring(0, 4) + "..." + value.substring(value.length - 4);
  };
  
  return {
    user1: {
      ...credentials.user1,
      value: maskValue(credentials.user1.value),
    },
    user2: {
      ...credentials.user2,
      value: maskValue(credentials.user2.value),
    },
  };
}

/**
 * Credential template configurations for common scenarios
 */
export const templates = {
  jwt: {
    description: "JWT Bearer Token Authentication",
    example: {
      user1: {
        type: "bearer",
        value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMSIsInJvbGUiOiJhZG1pbiJ9.signature",
        label: "Admin User",
      },
      user2: {
        type: "bearer",
        value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMiIsInJvbGUiOiJ1c2VyIn0.signature",
        label: "Regular User",
      },
    },
  },
  
  sessionCookie: {
    description: "Session Cookie Authentication",
    example: {
      user1: {
        type: "cookie",
        value: "session=abc123def456; userId=user1",
        label: "User 1 Session",
      },
      user2: {
        type: "cookie",
        value: "session=xyz789ghi012; userId=user2",
        label: "User 2 Session",
      },
    },
  },
  
  apiKey: {
    description: "API Key Authentication",
    example: {
      user1: {
        type: "custom",
        headerName: "X-API-Key",
        value: "sk_live_abc123",
        label: "User 1 API Key",
      },
      user2: {
        type: "custom",
        headerName: "X-API-Key",
        value: "sk_live_xyz789",
        label: "User 2 API Key",
      },
    },
  },
  
  basicAuth: {
    description: "Basic Authentication",
    example: {
      user1: {
        type: "basic",
        value: "YWRtaW46YWRtaW4xMjM=", // admin:admin123
        label: "Admin",
      },
      user2: {
        type: "basic",
        value: "dXNlcjp1c2VyMTIz", // user:user123
        label: "Regular User",
      },
    },
  },
};

export default {
  credentials,
  loadFromEnvironment,
  createBearerCredentials,
  createCookieCredentials,
  createCustomHeaderCredentials,
  createBasicAuthCredentials,
  validateCredentials,
  maskCredentials,
  templates,
};
