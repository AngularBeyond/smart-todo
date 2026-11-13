# ADR-002: Dual-Token Lifecycle, Public Logout, & Refresh Recursion Prevention

## Status
Accepted

## Date
2026-11-10

## Context
The Smart TODO application uses a dual-token authentication architecture:
- **Access Token:** Short-lived JWT stored in-memory within the Angular `AppStore`, passed via the `Authorization: Bearer <token>` header for protected API requests.
- **Refresh Token:** Long-lived, rotated token transmitted exclusively inside a `SameSite=Lax`, `HttpOnly`, `Secure` HTTP cookie (`path: /api/v1/auth`), stored as a SHA-256 hash in the MySQL database.

When an access token expired, the Angular `authInterceptor` intercepted the resulting `401 Unauthorized` response and called `POST /api/v1/auth/refresh` to obtain a fresh access token without interrupting the user.

However, an infinite ping-pong loop occurred when:
1. An access token expired or became corrupted while the user was interacting with the application or closing a session.
2. The `POST /api/v1/auth/logout` endpoint in NestJS was originally protected by `@UseGuards(JwtAuthGuard)`, requiring a valid Bearer token.
3. When `AppStore` reacted to an unrecoverable auth failure or user action by invoking `/auth/logout`, the server returned `401 Unauthorized` because the Bearer access token was invalid.
4. The client's `authInterceptor` caught the `401` from `/auth/logout` and attempted to execute `/auth/refresh`.
5. When `/auth/refresh` failed, it dispatched `userLogout()`, which triggered another `/auth/logout` call &rarr; `401` &rarr; `/auth/refresh`, cycling rapidly until the NestJS rate limiter (`AppThrottlerGuard`) fired `429 Too Many Requests`. The client was inundated with error toasts and trapped in an unrecoverable loop.

## Decision
We decided to:
1. **Make `POST /api/v1/auth/logout` a Public Endpoint**:
   - Remove `@UseGuards(JwtAuthGuard)` from `AuthController.logout`.
   - Read the refresh token from `req.cookies['refresh_token']`. If present, revoke the token record in the database (`revokedAt: new Date()`).
   - Clear the `refresh_token` HTTP-only cookie using identical security flags (`httpOnly: true`, `secure: isProduction`, `sameSite: 'lax'`, `path: '/api/v1/auth'`, `maxAge: 0`).
   - Always return `HTTP 201 { success: true, data: { success: true } }` regardless of whether the user presents a valid or expired Bearer token.
2. **Exclude Session Lifecycle Routes from Interceptor Refresh**:
   - In `smart-todo`'s `auth.interceptor.ts`, define an exclusion list for routes that must **never** trigger automatic `/refresh` retries:
     - `/auth/login`
     - `/auth/register`
     - `/auth/refresh`
     - `/auth/logout`
     - `/auth/authenticated`
3. **Graceful Store Teardown on Session Expiry**:
   - When `/auth/refresh` returns an error or empty token, dispatch `userLogout()` to clear store state in memory and redirect to `/login` without attempting further network retries on auth endpoints.

## Alternatives Considered

### Alternative 1: Require Valid Bearer Token for Logout
- **Pros:** Guarantees that only authenticated sessions can hit the logout endpoint.
- **Cons:** If the access token has expired (the most common scenario leading to logout), the client cannot cleanly clear its HTTP-only cookie and server-side refresh token record without performing a prior refresh. If the refresh token has also expired, the user is trapped in an orphaned state with stale cookies.
- **Rejected:** Logout must always succeed at purging client cookies and local state.

### Alternative 2: Discard Cookies Purely Client-Side
- **Pros:** No server round-trip required.
- **Cons:** Refresh tokens are stored in `HttpOnly` cookies, which JavaScript cannot access or delete. The server-side token hash in the database would also remain unrevoked until the 90-day inactivity purge runs.
- **Rejected:** Violates HTTP-only cookie security architecture.

### Alternative 3: Exponential Backoff Without Route Exclusion
- **Pros:** Throttles rapid HTTP retries.
- **Cons:** Only slows down the infinite loop rather than eliminating it. Still displays confusing error toasts to the user.
- **Rejected:** The loop must be structurally prevented by excluding auth lifecycle endpoints.

## Consequences

### Positive
- **Zero Loop Risk:** Guaranteed prevention of the `401` &harr; `429` storm between logout, refresh, and rate limiters.
- **Clean Session Termination:** Users can reliably log out regardless of token validity or network connectivity state.
- **Deterministic Interceptor Flow:** Refresh logic executes solely on true business entity requests (e.g., lists, todos, profile).

### Trade-offs / Considerations
- Unauthenticated clients can trigger `/auth/logout`, but the endpoint performs an idempotent cookie wipe and safe database lookup, protected by the global 100 req/min rate limit tier.
