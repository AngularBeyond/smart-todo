# Rate Limiting Architecture & Configuration

This document explains the rate limiting strategy in **Smart TODO API**, the purpose of each configured threshold, and practical usage examples.

---

## 1. What is Rate Limiting?

Rate limiting restricts how many incoming HTTP requests an individual client (identified by client IP address) can make within a specified time window. 

### Why It Matters
1. **Security & Brute-Force Mitigation**: Protects sensitive endpoints (login, registration, password changes) against automated credential stuffing, password dictionary attacks, and user enumeration.
2. **Denial of Service (DoS) Prevention**: Prevents malicious actors or malfunctioning client scripts from overwhelming server CPU, memory, and database connections.
3. **Resource Fair Use**: Ensures stable throughput for all active users by preventing any single client from starving application resources.
4. **Resilience & Graceful Backoff**: Communicates clearly to clients via standard HTTP `429 Too Many Requests` responses and headers (`Retry-After`) when they should pause and retry.

---

## 2. Multi-Tier Configuration Variables

Smart TODO API organizes endpoints into three distinct rate-limiting tiers managed via environment variables in `.env`:

```env
# Rate Limiting Configuration (Throttler)
THROTTLE_DEFAULT_LIMIT=100
THROTTLE_DEFAULT_TTL=60000
THROTTLE_AUTH_LIMIT=40
THROTTLE_AUTH_TTL=60000
THROTTLE_REFRESH_LIMIT=20
THROTTLE_REFRESH_TTL=60000
```

> **Note on TTL (Time-To-Live):** All `TTL` values are expressed in **milliseconds**. `60000` ms equals 1 minute (60 seconds).

---

### Tier 1: Default Tier (`THROTTLE_DEFAULT_*`)

| Environment Variable | Default Value | Unit | Description |
| :--- | :--- | :--- | :--- |
| `THROTTLE_DEFAULT_LIMIT` | `100` | Requests | Maximum requests permitted within the TTL window |
| `THROTTLE_DEFAULT_TTL` | `60000` | Milliseconds (1 min) | Duration of the sliding tracking window |

#### Protected Endpoints
- Core CRUD operations:
  - `GET`, `POST`, `PATCH`, `DELETE` `/api/v1/todo-lists`
  - `GET`, `POST`, `PATCH`, `DELETE` `/api/v1/todos`
  - Reordering endpoints: `PATCH /api/v1/todos/:id/order`
- User Profile:
  - `GET`, `PATCH` `/api/v1/profile`
- General application endpoints:
  - `GET /api/v1/health`

#### Purpose
The default tier accommodates standard user interaction and frontend state synchronization. An active user navigating lists, checking off tasks, updating descriptions, and reordering items produces bursts of 10–30 requests over several minutes. A limit of **100 requests per minute** gives generous headroom for normal usage and single-page application (SPA) interactions while still blocking scrapers or unbounded loops.

---

### Tier 2: Auth Tier (`THROTTLE_AUTH_*`)

| Environment Variable | Default Value | Unit | Description |
| :--- | :--- | :--- | :--- |
| `THROTTLE_AUTH_LIMIT` | `40` | Requests | Maximum requests permitted within the TTL window |
| `THROTTLE_AUTH_TTL` | `60000` | Milliseconds (1 min) | Duration of the sliding tracking window |

#### Protected Endpoints
- `POST /api/v1/auth/register` (Account creation)
- `POST /api/v1/auth/login` (User authentication)
- `PATCH /api/v1/auth/change-password` (Password mutation)

#### Purpose
Authentication routes are high-risk targets. Unprotected login endpoints allow attackers to test thousands of stolen passwords per minute. Similarly, unthrottled registration allows spammers to flood the database with fake accounts.

The Auth limit is set to **40 requests per 60 seconds**:
- **Why 40?** In development, testing, and continuous integration (CI) workflows, developers and automated suites frequently create test users and log in multiple times in rapid succession. Setting this to 40 allows smooth testing without hitting `429` limits, while still preventing automated high-speed brute-force scripts (which execute hundreds or thousands of attempts per second).
- **In Strict Production:** Operators can easily lower this in `.env` (e.g., `THROTTLE_AUTH_LIMIT=5` or `10`) for maximum security.

---

### Tier 3: Refresh Token Tier (`THROTTLE_REFRESH_*`)

| Environment Variable | Default Value | Unit | Description |
| :--- | :--- | :--- | :--- |
| `THROTTLE_REFRESH_LIMIT` | `20` | Requests | Maximum requests permitted within the TTL window |
| `THROTTLE_REFRESH_TTL` | `60000` | Milliseconds (1 min) | Duration of the sliding tracking window |

#### Protected Endpoints
- `POST /api/v1/auth/refresh` (Silent JWT access token rotation)

#### Purpose
Short-lived JWT access tokens expire periodically (e.g., every 15 minutes). The frontend sends the refresh token cookie to obtain a fresh access token without interrupting the user.

However, if an application bug causes an infinite refresh loop or an attacker attempts to replay a stolen refresh token, this endpoint could be hit constantly. A limit of **20 requests per minute** allows the frontend to refresh tokens seamlessly (even across multiple browser tabs) while bounding runaway refresh loops.

---

## 3. Practical Examples

### Example 1: Successful Request Within Limit

A client creates a new todo item:

**Request:**
```http
POST /api/v1/todos HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
Content-Type: application/json

{
  "title": "Complete quarterly review",
  "todoListId": "clx1234567890"
}
```

**Response (HTTP 201 Created):**
```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1730784000

{
  "success": true,
  "data": {
    "id": "todo_abc123",
    "title": "Complete quarterly review",
    "completed": false,
    "order": 1000.0,
    "todoListId": "clx1234567890",
    "createdAt": "2026-11-04T21:45:00.000Z",
    "updatedAt": "2026-11-04T21:45:00.000Z"
  }
}
```

---

### Example 2: Exceeding the Auth Tier Limit (HTTP 429)

If an automated script attempts rapid login attempts beyond `THROTTLE_AUTH_LIMIT` (e.g. 41st request within 60 seconds):

**Request (Attempt #41):**
```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "wrong-password-41"
}
```

**Response (HTTP 429 Too Many Requests):**
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json; charset=utf-8
Retry-After: 48
X-RateLimit-Limit: 40
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1730784060

{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

- `Retry-After: 48`: Informs the client to wait 48 seconds before retrying.
- The request does not reach the authentication handler or hit the database, saving server resources.

---

### Example 3: Client Handling in Angular (Frontend Interceptor)

Frontend applications can inspect the `429` status code and notify the user or back off:

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { ToastService } from '@core/services/toast.service';

export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 429) {
        const retryAfterSeconds = error.headers.get('Retry-After') ?? '60';
        toastService.showError(
          `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`
        );
      }
      return throwError(() => error);
    })
  );
};
```

---

## 4. Environment Profiles & Recommended Presets

Depending on the operational environment, tune the `.env` values accordingly:

### Local Development & E2E Testing
Maximum throughput to prevent developer or test suite interruption:
```env
THROTTLE_DEFAULT_LIMIT=200
THROTTLE_DEFAULT_TTL=60000
THROTTLE_AUTH_LIMIT=60
THROTTLE_AUTH_TTL=60000
THROTTLE_REFRESH_LIMIT=40
THROTTLE_REFRESH_TTL=60000
```

### Staging & User Acceptance Testing (Current Defaults)
Balanced profile supporting continuous manual testing:
```env
THROTTLE_DEFAULT_LIMIT=100
THROTTLE_DEFAULT_TTL=60000
THROTTLE_AUTH_LIMIT=40
THROTTLE_AUTH_TTL=60000
THROTTLE_REFRESH_LIMIT=20
THROTTLE_REFRESH_TTL=60000
```

### High-Security Production
Tight limits to strictly thwart brute-force and credential stuffing:
```env
THROTTLE_DEFAULT_LIMIT=60
THROTTLE_DEFAULT_TTL=60000
THROTTLE_AUTH_LIMIT=5
THROTTLE_AUTH_TTL=60000
THROTTLE_REFRESH_LIMIT=10
THROTTLE_REFRESH_TTL=60000
```
