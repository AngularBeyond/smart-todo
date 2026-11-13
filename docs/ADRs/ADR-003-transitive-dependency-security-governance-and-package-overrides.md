# ADR-003: Transitive Dependency Security Governance & Package Overrides

## Status
Accepted

## Date
2026-11-10

## Context
During production deployment to Hostinger, the host's automated vulnerability scanner (`hosting_nodejs_list-vulnerabilities`) flagged 24 CVE vulnerabilities across production dependencies:
- **`undici@6.20.1`** (9 High, 8 Moderate, 3 Low CVEs): TLS certificate validation bypass (CVE-2026-109383), DoS via TLS renegotiation (CVE-2026-87018), WebSocket protocol buffer overflows, CRLF injection, and HTTP request smuggling.
- **`tmp@0.0.33`** (1 High, 1 Low CVE): Path traversal via unsanitized prefix/postfix (CVE-2026-44705) and arbitrary file write via symlinks (CVE-2025-54798).
- **`deepmerge-ts@7.1.5`** (1 High CVE): Stack exhaustion when merging recursive object graphs (CVE-2026-40345).

Investigation revealed that these libraries were not direct dependencies specified in our source code:
1. `undici@6.20.1` and `tmp@0.0.33` were pulled in transitively by `@nestjs/mau` (an unused NestJS module in `smart-todo-api/package.json` devDependencies).
2. `deepmerge-ts@7.1.5` was pulled in transitively by `@prisma/config` within the Prisma CLI toolchain.

Because Hostinger evaluates all installed packages during container deployment and enforces security gates, these vulnerabilities required proactive resolution without destabilizing NestJS or Prisma.

## Decision
We decided to:
1. **Remove Unused Transitive Parents**:
   - Completely remove `@nestjs/mau` from `smart-todo-api/package.json`, immediately eliminating 23 of the 24 CVEs (`undici` and `tmp`).
2. **Enforce Monorepo Package Overrides**:
   - Add explicit `pnpm.overrides` to pin secure patch versions across both root and sub-project dependency graphs:
     ```json
     "pnpm": {
       "overrides": {
         "deepmerge-ts": "^8.0.2"
       }
     }
     ```
3. **Synchronize Independent Lockfiles**:
   - Because root, `smart-todo-api/`, and `smart-todo/` maintain separate `package.json` and `pnpm-lock.yaml` files, update sub-project lockfiles with `--no-frozen-lockfile` locally, verify that `pnpm audit` reports **0 vulnerabilities**, and commit the updated lockfiles.
4. **Enforce Zero-Vulnerability CI Deployment Gates**:
   - The CI workflow verifies lockfile integrity via `--frozen-lockfile`.
   - Hostinger deployments are verified using the Hostinger MCP tool `hosting_nodejs_list-vulnerabilities` to confirm an empty vulnerability list (`[]`).

## Alternatives Considered

### Alternative 1: Ignore DevDependency CVEs on Production Builds
- **Pros:** No dependency upgrades required.
- **Cons:** Hostinger's production scanner scans the entire build workspace during `npm install`/`pnpm install`. It does not differentiate between production and development dependencies during image inspection, triggering account alerts and potential deployment blocks.
- **Rejected:** Cloud platforms enforce security compliance across all installed packages.

### Alternative 2: Downgrade Prisma to an Older Major Release
- **Pros:** Might avoid `@prisma/config`.
- **Cons:** Loss of Prisma v6 optimizations, schema enhancements, and client stability; retrograde technical debt.
- **Rejected:** Upgrading the vulnerable transitive package via overrides is cleaner, preserves modern Prisma features, and does not break functionality.

### Alternative 3: `npm audit fix --force`
- **Pros:** Automated package resolution.
- **Cons:** Often introduces breaking major version upgrades to unrelated top-level packages in complex monorepos, breaking TypeScript builds.
- **Rejected:** Targeted `pnpm.overrides` provides deterministic control over exact package versions.

## Consequences

### Positive
- **Clean Security Audit:** `pnpm audit` and Hostinger `hosting_nodejs_list-vulnerabilities` report 0 vulnerabilities.
- **Deterministic Resolution:** Monorepo package overrides guarantee transitive security fixes without waiting for upstream library maintainers to publish patch releases.
- **Minimal Footprint:** Purging `@nestjs/mau` reduced `node_modules` size and installation time in CI/CD.

### Trade-offs / Considerations
- Overrides must be maintained in both root `package.json` and sub-project `package.json` files until upstream dependencies (such as `@prisma/config`) natively update their dependency specifications.
