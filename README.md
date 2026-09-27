# CaineonJS - M1/M2 Authorization Testing Engine for Caido

A Caido Workflow JavaScript engine that implements **M1 (Cross-Account Read)** and **M2 (Cross-Account Write)** authorization tests using Caido's native `request.toSpec()` API.

## Concept

Inspired by Autorize's "Mutated Request" approach, CaineonJS performs two-account comparison testing:

1. **Capture** a request from User 1 (high-privilege account)
2. **Generate** an M1 or M2 test specification
3. **Mutate** the request with User 2 credentials (low-privilege account)
4. **Send** both requests via `sdk.requests.send()`
5. **Compare** responses to detect authorization bypasses

## Architecture

```
Captured Request (User 1)
         ↓
M1 / M2 Test Generator
         ↓
request.toSpec()
         ↓
Mutate Authentication (User 2)
         ↓
sdk.requests.send(spec)
         ↓
Response Comparison
         ↓
Authorization Bypass Detection
```

## M1 vs M2

### M1: Cross-Account Read
Tests whether User 2 can **read** User 1's data.

**Example Scenario:**
- User 1 reads their order: `GET /api/orders/12345`
- User 2 attempts same read with their credentials
- **Expected:** 403 Forbidden or 404 Not Found
- **Vulnerability:** 200 OK with User 1's data

### M2: Cross-Account Write/Mutation
Tests whether User 2 can **modify** User 1's data.

**Example Scenario:**
- User 1 updates their profile: `PATCH /api/users/67890`
- User 2 attempts same mutation with their credentials
- **Expected:** 403 Forbidden or 404 Not Found
- **Vulnerability:** 200 OK with successful modification

## Directory Structure

```
CaineonJS/
├── README.md                    # This file
├── src/
│   ├── core/
│   │   ├── m1.js               # M1 test generator
│   │   ├── m2.js               # M2 test generator
│   │   └── executor.js         # Workflow execution engine
│   ├── config/
│   │   └── credentials.js      # Credential management
│   └── utils/
│       └── comparator.js       # Response comparison logic
├── workflows/
│   ├── m1-workflow.js          # Ready-to-use M1 workflow
│   ├── m2-workflow.js          # Ready-to-use M2 workflow
│   └── combined-workflow.js    # Auto-detect M1/M2
└── examples/
    ├── basic-usage.md
    └── advanced-config.md
```

## Quick Start

### 1. Configure Credentials

Edit `src/config/credentials.js`:

```javascript
export const credentials = {
  user1: {
    type: "bearer",
    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
  user2: {
    type: "bearer",
    value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
};
```

### 2. Import Workflow in Caido

Use the workflow files in `workflows/` directory as Caido Workflow JS nodes.

### 3. Capture and Test

Send requests through the workflow node. CaineonJS will automatically:
- Detect the test type (M1 for reads, M2 for writes)
- Execute both User 1 and User 2 requests
- Compare responses and flag authorization issues

## Response Comparison Logic

| User 1 Status | User 2 Status | Result |
|---------------|---------------|--------|
| 200 OK        | 200 OK        | **VULNERABLE** - Authorization bypass detected |
| 200 OK        | 403 Forbidden | **SECURE** - Proper authorization enforcement |
| 200 OK        | 404 Not Found | **SECURE** - Resource properly isolated |
| 200 OK        | 401 Unauthorized | **SECURE** - Authentication required |
| 403 Forbidden | 200 OK        | **ANOMALY** - Investigate privilege escalation |

## Authentication Types Supported

- **Bearer Token**: `Authorization: Bearer TOKEN`
- **Cookie**: `Cookie: session=VALUE`
- **Custom Header**: `X-API-Key: VALUE`
- **Basic Auth**: `Authorization: Basic BASE64`

## Caido Integration

CaineonJS uses Caido's native API:

```javascript
export async function run({ request }, sdk) {
  const spec = request.toSpec();
  spec.setHeader("Authorization", "Bearer USER_2_TOKEN");
  const result = await sdk.requests.send(spec);
  return result.response;
}
```

## Use Cases

- **API Authorization Testing**: Test REST APIs for IDOR vulnerabilities
- **Multi-Tenant Applications**: Verify tenant isolation
- **Role-Based Access Control**: Test privilege boundaries
- **Session Management**: Detect session fixation/hijacking
- **GraphQL Authorization**: Test field-level permissions

## Contributing

This project is designed to be extended. Add new test generators in `src/core/` or custom comparison logic in `src/utils/comparator.js`.

## License

MIT

---

**CaineonJS** - Authorization testing that speaks Caido's language.
