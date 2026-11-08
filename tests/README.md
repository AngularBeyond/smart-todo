# End-to-End (E2E) Testing Suite

Comprehensive automated End-to-End test suite for the **Smart TODO Application**, built with **Playwright**, **TypeScript**, and **Page Object Models (POM)**.

The suite validates critical business workflows, security boundaries, rate limiting, responsive dual-layout UX, theme persistence, drag-and-drop reordering, and data quotas across the full stack (Angular 22 frontend + NestJS 12+ API).

---

## 1. Directory Structure

All E2E testing assets, configurations, and generated artifacts reside strictly under `/tests/`:

```
tests/
├── README.md                    # This documentation file
├── playwright.config.ts         # Master Playwright configuration
├── docker-compose.e2e.yml       # Podman/Docker Compose definition for isolated E2E container
├── tsconfig.e2e.json            # TypeScript compiler configuration for tests and fixtures
├── .env.e2e                     # Local E2E environment variables (gitignored)
├── .env.e2e.example             # Template for E2E environment variables
├── playwright-report/           # HTML test execution reports (gitignored)
├── test-results/                # Failure screenshots, traces, and video artifacts (gitignored)
└── e2e/
    ├── fixtures/
    │   └── test-data.ts         # Synthetic test user and list data generators
    ├── pages/                   # Page Object Models extending BasePage
    │   ├── base.page.ts         # Shared navigation, theme toggling, and user menu helpers
    │   ├── auth.page.ts         # Login and registration form locators and actions
    │   ├── sidebar.component.ts # Sidebar navigation, list selection, stars, and quotas
    │   ├── workspace.page.ts    # Workspace shell, header titles, and view transitions
    │   ├── todos.page.ts        # Todo items, inline editing, drag-and-drop, search filter
    │   ├── settings.page.ts     # Settings page, theme selection, and notifications
    │   ├── profile.page.ts      # Profile display name and password change forms
    │   └── about.page.ts        # About showcase, tech stack cards, and creator links
    └── tests/                   # Domain-organized test specifications
        ├── 01-auth/             # Authentication, registration, token refresh, and route guards
        ├── 02-profile-settings/ # User profiles, appearance themes, and preferences
        ├── 03-todo-lists/       # List CRUD, quota limits (3 max), inline rename, reordering
        ├── 04-todos/            # Task CRUD, index 0 insertion, completion rule, 40-todo quota
        ├── 05-security/         # Multi-tenant IDOR protection and cross-user data isolation
        └── 06-about/            # About page navigation, typography, link security, themes
```

---

## 2. Database Isolation Mandate

> [!CRITICAL]
> **NEVER EXECUTE E2E TESTS AGAINST THE DEVELOPMENT DATABASE (`smart_todo` ON PORT 3306)**
> - E2E tests generate rapid, concurrent, and destructive operations (deletions, reordering, quota exhaustion, user generation).
> - E2E tests execute strictly against the isolated container: **`smart_todo_e2e_mysql`** mapped to host **port 3307**.
> - The development database container **`smart_todo_mysql`** on **port 3306** remains untouched.
> - `smart-todo-api/.env` must ALWAYS point to `localhost:3306/smart_todo`.

---

## 3. Prerequisites & Environment Setup

### 3.1 Install Dependencies & Playwright Browsers
From the monorepo root:
```bash
# Install monorepo dependencies
pnpm install

# Install Playwright browser binaries (Chromium)
pnpm exec playwright install chromium
```

### 3.2 Configure E2E Environment Variables
Copy the template to create your local `.env.e2e`:
```bash
cp tests/.env.e2e.example tests/.env.e2e
```

Default configuration in `tests/.env.e2e`:
```env
# E2E Database Container (Port 3307)
DB_ROOT_PASSWORD=rootpassword
DB_NAME=smart_todo
DB_USER=smart_todo_user
DB_PASSWORD=smart_todo_pass
DB_PORT=3307
DATABASE_URL="mysql://smart_todo_user:smart_todo_pass@localhost:3307/smart_todo"

# Test API & App
PORT=3000
NODE_ENV=test
FRONTEND_URL="http://localhost:4200"

# Dedicated JWT Secrets for Testing
JWT_ACCESS_SECRET="e2e-secret-access-token-key-for-testing-only"
JWT_REFRESH_SECRET="e2e-secret-refresh-token-key-for-testing-only"

# Throttling
THROTTLE_DEFAULT_LIMIT=1000
THROTTLE_DEFAULT_TTL=60000
THROTTLE_AUTH_LIMIT=500
THROTTLE_AUTH_TTL=60000
THROTTLE_REFRESH_LIMIT=500
THROTTLE_REFRESH_TTL=60000
```

---

## 4. Execution Commands

### 4.1 Database Container Management
```bash
# Start isolated E2E MySQL container (port 3307)
pnpm db:e2e:up

# Check container status
podman ps --filter "name=smart_todo_e2e_mysql"

# Apply Prisma migrations to E2E database (one-time or schema changes)
DATABASE_URL="mysql://smart_todo_user:smart_todo_pass@localhost:3307/smart_todo" pnpm --prefix smart-todo-api exec prisma migrate deploy

# Stop isolated E2E MySQL container
pnpm db:e2e:down
```

### 4.2 Running Tests
```bash
# Run the entire E2E test suite (headless)
pnpm test:e2e

# Run tests in interactive UI mode (debugger & timeline)
pnpm test:e2e:ui

# Run a specific test suite or file
pnpm test:e2e tests/e2e/tests/06-about/about.spec.ts
pnpm test:e2e tests/e2e/tests/01-auth/auth.spec.ts
pnpm test:e2e tests/e2e/tests/04-todos/todos-crud.spec.ts

# View HTML report of the last test execution
pnpm exec playwright show-report tests/playwright-report
```

---

## 5. Port 3000 Safety Rule

> [!WARNING]
> If your local development API server is running (`pnpm api`), **stop it before executing `pnpm test:e2e`**.
>
> In `tests/playwright.config.ts`, the `webServer` block specifies `reuseExistingServer: false` for the API process. This acts as an intentional fail-safe check:
> - If port 3000 is already bound to a development server, Playwright immediately aborts with an error.
> - This prevents test suites from accidentally running against a dev API pointed at your production or development database on port 3306.

---

## 6. Test Suite Coverage

| Suite | Focus Area | Key Scenarios Validated |
|---|---|---|
| **`01-auth`** | Authentication & Session | Registration, duplicate email rejection (409), login validation, invalid password alerts (401), rate limiting (429), token refresh persistence, route guards (`guestGuard`, `authGuard`), logout. |
| **`02-profile-settings`** | Account & Appearance | Real-time display name synchronization, password change with old password rejection, dark/light theme toggling and page reload persistence, workspace notification toggle. |
| **`03-todo-lists`** | List Management | List creation, hard quota boundary (max 3 lists per user), inline title editing, star/pin list to top, delete list with fallback selection, drag-and-drop reordering of unstarred lists. |
| **`04-todos`** | Tasks & Interactions | New task creation at index 0 (top of list), inline task editing, complete task and move to accordion, uncomplete-to-top rule, trash deletion, 40-todo hard list quota boundary, live debounced search with `<mark>` highlighting, CDK drag-and-drop task reordering. |
| **`05-security`** | Multi-Tenancy & IDOR | Strict data isolation between concurrent browser sessions, preventing User B from viewing or mutating lists and tasks belonging to User A. |
| **`06-about`** | Showcase & External Links | Sidebar navigation to `/about`, active item styling, hero and value propositions layout, 5 technology stack cards, external social links security attributes (`target="_blank"`, `rel="noreferrer"`), theme persistence. |

---

## 7. Writing New E2E Tests

When adding a new test specification:
1. **Extend Page Objects:** Add reusable selectors and actions to `tests/e2e/pages/`. Never write raw CSS/XPath selectors directly inside test files when a Page Object can encapsulate them.
2. **Use Synthetic Data:** Generate unique test users with `generateUser('prefix')` from `tests/e2e/fixtures/test-data.ts` to ensure complete independence between parallel or sequential test runs.
3. **Respect Single Worker:** Tests rely on sequential execution (`workers: 1` in `playwright.config.ts`) to maintain predictable database state transitions.
