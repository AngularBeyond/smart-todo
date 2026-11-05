# ADR-001: Configurable Multi-Tier Rate Limiting via Environment Variables

## Status
Accepted

## Date
2026-11-04

## Context
The Smart TODO backend API (`smart-todo-api`) exposes public and authenticated endpoints across multiple domains:
- Authentication & credentials (`/api/v1/auth/*`)
- Token refresh & rotation (`/api/v1/auth/refresh`)
- Core business entities (Todo Lists and Todos)
- User profile & preferences

To safeguard the service against Denial of Service (DoS), brute-force credential stuffing, password dictionary attacks, and client-side runaway loops, `@nestjs/throttler` was implemented.

Initially, rate limits were defined using static metadata (e.g., `@Throttle({ auth: { limit: 5, ttl: 60000 } })` for auth endpoints and static module options for global routes). However, this created critical friction points:
1. **Testing & QA Bottlenecks**: Developers and QA engineers executing extensive exploratory tests, automated UI tests, or E2E scripts were frequently locked out with `429 Too Many Requests` (especially by the 5 req/min auth limit).
2. **Environment Inflexibility**: Different environments (local development, CI/CD automated test pipelines, staging, production) require different throughput thresholds. Hard-coded values required codebase modifications and redeployment to alter limits.
3. **Operational Observability & Tuning**: Production operators could not adjust limits in response to incident mitigation or unexpected traffic surges without code changes.

## Decision
We decided to:
1. **Externalize all rate limiting thresholds into environment variables** (`.env` and `.env.example`) with secure fallback defaults:
   - `THROTTLE_DEFAULT_LIMIT` (default: 100) & `THROTTLE_DEFAULT_TTL` (default: 60,000 ms)
   - `THROTTLE_AUTH_LIMIT` (default: 40) & `THROTTLE_AUTH_TTL` (default: 60,000 ms)
   - `THROTTLE_REFRESH_LIMIT` (default: 20) & `THROTTLE_REFRESH_TTL` (default: 60,000 ms)
2. **Increase the Auth Tier default limit** from 5 to 40 requests per 60 seconds to provide sufficient headroom for local testing, rapid registration/login checks, and test suites while still preventing brute-force flooding.
3. **Introduce a custom `AppThrottlerGuard`** extending NestJS `ThrottlerGuard`:
   - Overrides `handleRequest(requestProps: ThrottlerRequest)` to dynamically resolve the configured limit and TTL from `ConfigService` on each request, matching the active throttler set or route handler name (`auth`, `refresh`, or `default`).
   - Ensures that `@Throttle()` decorator limits are dynamically sourced from environment configuration rather than frozen at compile time.
4. **Register `AppThrottlerGuard` globally** via `APP_GUARD` in `AppModule`.

## Alternatives Considered

### Alternative 1: Keep Hard-Coded Limits and Bypass Throttler in Development
- **Pros**: Simple; no custom guard required.
- **Cons**: Bypassing throttling in non-production environments means rate limit behavior, headers (`Retry-After`, `X-RateLimit-*`), and client-side `429` error handling cannot be tested in development or CI. Divergence between environments leads to undetected production defects.
- **Rejected**: Rate limiting must be tested in all environments with configurable thresholds.

### Alternative 2: Use an External Redis-Backed Throttler Storage
- **Pros**: Shares rate-limiting state across horizontally scaled NestJS instances.
- **Cons**: Adds an external Redis infrastructure dependency, complicating local development and container setup for Phase 1.
- **Rejected**: In-memory storage is sufficient for single-instance Phase 1 deployments. The environment variable and `AppThrottlerGuard` design remains fully compatible with a future swap to `ThrottlerStorageRedisService`.

### Alternative 3: Route-Level Middleware with Express `express-rate-limit`
- **Pros**: Familiar Express middleware pattern.
- **Cons**: Bypasses the idiomatic NestJS dependency injection system, execution context (`ExecutionContext`), and guard lifecycle; loses integration with NestJS metadata and test fixtures.
- **Rejected**: `@nestjs/throttler` is the standard, idiomatic approach in NestJS applications.

## Consequences

### Positive
- **Configurability**: Operators and developers can customize rate limits across any environment via `.env` without modifying code or rebuilding containers.
- **Smooth Developer Experience**: Increasing the auth limit to 40 req/min prevents interruptions during active development, automated UI test runs, and manual verification.
- **Security Maintained**: Brute-force and DoS protection remains enforced with customizable production-grade defaults.
- **Testability**: `AppThrottlerGuard` is easily unit tested with mocked `ConfigService` instances.

### Trade-offs / Considerations
- **In-Memory Storage Scope**: Default storage tracks IP requests in process memory; if multiple API replica instances are deployed in the future behind a load balancer, sticky sessions or a shared Redis storage (`ThrottlerStorageRedisService`) will be required.
- **Reverse Proxy Header Trust**: In production behind a reverse proxy (e.g., NGINX, Cloudflare, Traefik), Express `trust proxy` must be enabled so that `req.ip` reflects the client's actual IP address rather than the proxy's IP.
