# API Design

Resource-oriented API design following industry standards.

## Resource-Oriented Design

### URL Structure

```
FORMAT: /v{version}/{collection}/{resource_id}/{sub-collection}/{sub_id}

EXAMPLES:
├─ GET  /v1/users                    # List users
├─ GET  /v1/users/123                # Get user 123
├─ POST /v1/users                    # Create user
├─ GET  /v1/users/123/orders         # List orders for user 123
├─ GET  /v1/users/123/orders/456     # Get order 456 for user 123
└─ POST /v1/users/123/orders         # Create order for user 123
```

### Naming Rules

| Element | Convention | Example |
|---------|------------|---------|
| Collection | plural nouns, camelCase | `users`, `orderItems` |
| Resource ID | lowercase, hyphens OK | `user-123`, `abc123` |
| Query params | camelCase | `pageSize`, `sortBy` |
| Headers | Title-Case | `Content-Type`, `X-Request-Id` |

```
AVOID:
├─ Verbs in URLs (/getUser, /createOrder)
├─ Uppercase in paths
├─ Underscores in paths
├─ Actions as resources (/user/123/delete)
└─ Deeply nested resources (> 3 levels)
```

## Standard Methods

| Method | HTTP Verb | Idempotent | Request Body | Response |
|--------|-----------|-----------|--------------|----------|
| List | GET | Yes | No | Collection |
| Get | GET | Yes | No | Resource |
| Create | POST | No | Resource | Created resource |
| Update | PATCH | No | Partial resource | Updated resource |
| Replace | PUT | Yes | Full resource | Replaced resource |
| Delete | DELETE | Yes | No | Empty or deleted resource |

### Custom Methods

For actions that don't fit standard CRUD:

```
FORMAT: POST /v1/{collection}/{id}:{action}

EXAMPLES:
├─ POST /v1/orders/123:cancel
├─ POST /v1/users/456:deactivate
├─ POST /v1/documents/789:publish
└─ POST /v1/batches:process
```

## Request/Response Format

### Request Headers

```
REQUIRED:
├─ Content-Type: application/json
├─ Accept: application/json
└─ Authorization: Bearer {token}

RECOMMENDED:
├─ X-Request-Id: {uuid}           # For tracing
├─ X-Client-Version: {version}    # For compatibility
└─ Accept-Language: {locale}      # For i18n
```

### Response Structure

```json
// Success (single resource)
{
  "data": {
    "id": "123",
    "type": "user",
    "attributes": { ... }
  }
}

// Success (collection)
{
  "data": [ ... ],
  "meta": {
    "totalCount": 100,
    "pageSize": 20
  },
  "links": {
    "next": "/v1/users?pageToken=abc",
    "prev": "/v1/users?pageToken=xyz"
  }
}

// Error
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "Email format is invalid",
    "details": [
      {
        "field": "email",
        "reason": "Must be valid email format"
      }
    ]
  }
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST that creates |
| 204 | No Content | Successful DELETE with no body |
| 400 | Bad Request | Invalid request format/syntax |
| 401 | Unauthorized | Missing or invalid auth |
| 403 | Forbidden | Valid auth, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | State conflict (duplicate, version) |
| 422 | Unprocessable | Valid syntax, invalid semantics |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Error | Server-side failure |
| 503 | Unavailable | Temporary overload/maintenance |

### Error Codes

```
STANDARD ERROR CODES:
├─ INVALID_ARGUMENT      # Client sent bad data
├─ NOT_FOUND            # Resource doesn't exist
├─ ALREADY_EXISTS       # Duplicate creation attempt
├─ PERMISSION_DENIED    # Not authorized
├─ UNAUTHENTICATED      # No/invalid auth
├─ RESOURCE_EXHAUSTED   # Rate limit or quota
├─ FAILED_PRECONDITION  # System not in required state
├─ INTERNAL             # Server error
├─ UNAVAILABLE          # Service temporarily unavailable
└─ DEADLINE_EXCEEDED    # Timeout
```

## Pagination

### Request Parameters

```
CURSOR-BASED (preferred):
├─ pageSize: number (default: 20, max: 100)
└─ pageToken: string (opaque cursor)

OFFSET-BASED (when needed):
├─ limit: number (default: 20, max: 100)
└─ offset: number (default: 0)
```

### Response

```json
{
  "data": [ ... ],
  "nextPageToken": "eyJsYXN0SWQiOiI...",  // Absent if no more
  "totalCount": 1000  // Optional, expensive for large sets
}
```

**Pagination rules:**
- Tokens are opaque (clients don't parse them)
- Missing `nextPageToken` = no more pages
- Total count is optional (can be expensive)
- Default page size = 20, max = 100

## Filtering & Sorting

### Filtering

```
SIMPLE FILTERS:
GET /v1/users?status=active&role=admin

COMPARISON OPERATORS:
GET /v1/orders?total[gte]=100&total[lte]=500
GET /v1/users?createdAt[gt]=2024-01-01

SUPPORTED OPERATORS:
├─ eq (equals, default)
├─ ne (not equals)
├─ gt, gte (greater than)
├─ lt, lte (less than)
├─ in (in list)
└─ contains (substring match)
```

### Sorting

```
FORMAT:
GET /v1/users?sortBy=createdAt&sortOrder=desc

MULTIPLE FIELDS:
GET /v1/users?sort=lastName:asc,firstName:asc
```

## Versioning

### URL Versioning (Preferred)

```
/v1/users
/v2/users
```

### Breaking Changes Require New Version

```
BREAKING (needs new version):
├─ Removing fields
├─ Renaming fields
├─ Changing field types
├─ Changing required/optional
├─ Removing endpoints
└─ Changing error codes

NON-BREAKING (same version OK):
├─ Adding optional fields
├─ Adding new endpoints
├─ Adding new optional parameters
└─ Adding new error codes
```

### Version Lifecycle

```
STAGES:
├─ Current: Active development, fully supported
├─ Deprecated: Still works, migration encouraged
└─ Sunset: Removed, returns 410 Gone

TIMELINE:
├─ Announce deprecation: 6+ months before sunset
├─ Deprecation period: 12+ months minimum
└─ Sunset notice: 30 days before removal
```

## Rate Limiting

### Headers

```
X-RateLimit-Limit: 1000        # Requests allowed per window
X-RateLimit-Remaining: 456     # Requests remaining
X-RateLimit-Reset: 1640000000  # Unix timestamp of reset
Retry-After: 60                # Seconds to wait (on 429)
```

### Response (429)

```json
{
  "error": {
    "code": "RESOURCE_EXHAUSTED",
    "message": "Rate limit exceeded. Retry after 60 seconds.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

## Authentication

### Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Token Requirements

```
JWT CLAIMS:
├─ sub: User/service ID
├─ iat: Issued at timestamp
├─ exp: Expiration timestamp
├─ scope: Permissions (space-separated)
└─ aud: Intended audience
```

## API Documentation

### Required for Every Endpoint

```
DOCUMENT:
├─ URL and method
├─ Description of purpose
├─ Request parameters (path, query, body)
├─ Request/response examples
├─ Error codes and meanings
├─ Authentication requirements
└─ Rate limits
```

### OpenAPI Spec Required

Every API must have an OpenAPI (Swagger) specification that:
- Is kept in sync with implementation
- Is validated in CI
- Generates client SDKs
