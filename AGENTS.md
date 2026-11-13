# AGENTS.md — Smart TODO Application (Phase 1)

## 1. Execution Mode: Story Sub-Phase Decomposition & Frequent Local Commits
CRITICAL INSTRUCTION FOR ANTIGRAVITY:
- We are developing Phase 1 in **incremental sub-phases** (Units of Work).
- **NEVER** attempt to implement the entire application or jump ahead to unrequested stories in a single run.
- Only implement the specific Story ID(s) requested in the current prompt.
- **Mandatory Story Sub-Phase Decomposition:**
  - Before writing code for any Story containing multiple functional concerns, distinct user actions, or architectural layers, break down the Story into **2–4 atomic Sub-Phases (Units of Work)**.
  - A sub-phase covers a single user intent (e.g., Sub-Phase 1: Profile Details & Theme Preference; Sub-Phase 2: Change Password).
  - Each sub-phase must include its models, store methods, component UI, and unit tests.
- **Git Best Practices & Checkpoint Gates:**
  1. Complete Sub-Phase 1 &rarr; Run verification checks (`tsc`, unit tests) &rarr; Execute `/auto-commit` (local commit).
  2. Complete Sub-Phase 2 &rarr; Run verification checks &rarr; Execute `/auto-commit` (local commit).
  3. **NEVER run `git push`**: All commits must remain strictly local.
  4. Report a summary with verification outputs and commit hashes after completing each unit.

## 2. Source of Truth Documentation
Before planning or writing code for any task, read the relevant specification in `docs/`:
- `docs/01-PRD.md`: Functional requirements, quotas (max 3 lists/user, max 40 todos/list), and UX rules.
- `docs/02-ROADMAP.md`: Epic sequence and global Definition of Done.
- `docs/03-BACKEND-ARCHITECTURE.md`: NestJS 12+, Prisma ORM (`_prisma_migrations`), MySQL 8.0 schema, `order` (`Float`) math, and `/v1` `ApiResponse<T>` contracts.
- `docs/04-FRONTEND-ARCHITECTURE.md`: Angular 22, Tomas Trajan 5-layer architecture (`core`, `layout`, `ui`, `features`, `patterns`), Spartan UI (`ui/components`), Tailwind CSS, `@ngrx/signals` + `@ngrx/signals/events`, and Vitest.
- `docs/05-EPICS-AND-STORIES.md`: Ordered implementation stories (`STORY-1.1` through `STORY-6.2`) and acceptance criteria.
- `docs/06-USER-FLOWS.md`: End-to-end behavioral flows between Angular SignalStores and NestJS.

## 3. Mandatory Angular Skills
When working in `smart-todo/`, you MUST follow the skills in `.agents/skills/`:
- Macro architecture (`core`, `layout`, `ui`, `features`, `pattern`): `.agents/skills/angular-architecture/SKILL.md` (Note: We use `ui/` instead of `shared/`).
- Dual-Layout setup (`full-screen-layout` & `main-layout`): `.agents/skills/angular-layouts/SKILL.md`
- 9-Folder Feature Structure (`pages`, `components`, `store`, `constants`, `models`, `pure-functions`, `services`, `directives`, `pipes`): `.agents/skills/angular-feature-structure/SKILL.md`
- Global Signal Stores (`AppStore`, `TodoListsStore` in `core/store/` using `@ngrx/signals/events`): `.agents/skills/angular-global-store/SKILL.md`
- Feature Signal Stores (`TodosStore`, `ProfileStore`, `LoginStore`, `RegisterStore` in `features/<name>/store/`): `.agents/skills/angular-feature-store/SKILL.md`

## 4. Mandatory NestJS Skills
When working in `smart-todo-api/`, you MUST follow the skills in `.agents/skills/`:
- **Architecture & DI:** Use feature modules. ZERO circular dependencies. Constructor injection only. Services must have Single Responsibility. Encapsulate DB queries in Repositories.
- **Error Handling:** Never swallow async errors. Throw HTTP Exceptions from services, and catch them via Global Exception Filters.
- **Security & APIs:** Validate all inputs using DTOs + `ValidationPipe`. Return serialized DTOs (exclude sensitive data), never raw entities. Use Guards for Auth/Roles. 
- **Database:** Enforce strict transactional boundaries for multi-step operations. Use incremental migrations (no `synchronize: true`). Avoid N+1 queries.
- **Testing & Config:** Mock external dependencies in unit tests using `Test.createTestingModule`. Use `ConfigModule` for env vars. Handle graceful application shutdowns.

You can refer to the complete rules at `agents/skills/nestjs-best-practices/AGENTS.md`

## 5. Non-Negotiable Engineering Rules
1. **Frontend Layer Rules (`core` vs `ui`):**
   - `core/` contains `auth/`, `http/`, `services/`, `models/`, `pure-functions/`, and `store/` (only `custom-features/`, `events/`, and global stores).
   - `ui/` replaces `shared/`. All Spartan UI components reside in `src/app/ui/components/` (update `angular.json` as needed). Everything in `ui/` communicates strictly via `input()` and `output()`.
2. **Backend Layer Rules (NestJS + Prisma):**
   - Controllers handle HTTP routing only; Services handle transactions, quotas (`MAX_LISTS_PER_USER = 3`, `MAX_TODOS_PER_LIST = 40`), and `order: Float` calculation; Repositories encapsulate Prisma queries.
   - All responses use `{ success: true, data: T }`.
3. **Verification Gate Before Every Commit:**
   - Never commit or mark a story complete until TypeScript compilation (`tsc --noEmit`), linting (`eslint`), and unit tests (`vitest` / `jest`) pass with zero errors.
4. **Zero Hardcoded Credentials & Secret Hygiene:**
   - NEVER write, inline, default, or fallback any credentials, database passwords, API tokens, JWT secrets, or connection strings in code files, deployment scripts, or test fixtures that will be committed to the repository.
   - NEVER use, write, or expose real usernames, database user accounts, hosting account IDs, server hostnames, tenant identifiers, or actual user credentials in ANY code, scripts, configuration templates (`.env.example`), markdown documentation, commit messages, or test fixtures.
   - All secrets, tokens, and environment-dependent variables MUST strictly reside in `.env` (which must be gitignored) or be injected dynamically at runtime via CI/CD secret runners (e.g., GitHub Secrets). Always use `.env.example` templates with generic placeholder values (`your_username`, `db_user`, `password`, `your_token`) for documentation.

## 6. End-to-End (E2E) Testing Architecture & Rules (Playwright)

### 6.1 Strict Folder Hierarchy (Under `tests/`)
All E2E testing assets, configurations, and generated artifacts MUST reside strictly under `/tests/`:
- `tests/playwright.config.ts`: Master Playwright configuration file (`testDir: './e2e'`).
- `tests/.env.e2e`: Dedicated environment variables for E2E testing and database isolation.
- `tests/.env.e2e.example`: Environment template for E2E configurations.
- `tests/docker-compose.e2e.yml`: Dedicated Podman/Docker Compose definition for the isolated E2E MySQL container.
- `tests/tsconfig.e2e.json`: TypeScript configuration for E2E tests and Playwright fixtures.
- `tests/e2e/tests/`: Organized test suites by feature domain (`01-auth/`, `02-profile-settings/`, `03-todo-lists/`, `04-todos/`, `05-security/`, `06-about/`).
- `tests/e2e/pages/`: Page Object Models (POMs) extending `BasePage`.
- `tests/e2e/fixtures/`: Synthetic test data generators (`test-data.ts`).
- `tests/playwright-report/`: HTML test execution reports (gitignored).
- `tests/test-results/`: Execution screenshots, traces, and videos (gitignored).

### 6.2 Strict Database Isolation Mandate
> [!CRITICAL]
> **NEVER TOUCH THE DEVELOPMENT DATABASE (`smart_todo` ON PORT 3306)**
> - E2E tests MUST ALWAYS execute against the isolated **E2E MySQL container** (`smart_todo_e2e_mysql` on **port 3307**).
> - `smart-todo-api/.env` must ALWAYS point to `localhost:3306/smart_todo` so the developer's local dev server is never switched or polluted.
> - The Playwright `webServer` block in `tests/playwright.config.ts` automatically parses `tests/.env.e2e` and injects its variables directly into the test API process with `reuseExistingServer: false` to ensure test runs NEVER hijack the dev server running on port 3000.

### 6.3 E2E Commands
- **Start E2E Database Container:** `pnpm db:e2e:up`
- **Stop E2E Database Container:** `pnpm db:e2e:down`
- **Run All E2E Tests:** `pnpm test:e2e` (runs `playwright test -c tests/playwright.config.ts`)
- **Run Specific E2E Suite / Spec:** `pnpm test:e2e tests/e2e/tests/<suite>/<spec>.spec.ts`
- **Interactive UI Mode:** `pnpm test:e2e:ui`
- **Port 3000 Safety Rule:** If the local development API is running on port 3000 (`pnpm api`), stop it before running `pnpm test:e2e`. Playwright's `reuseExistingServer: false` acts as a fail-safe check, intentionally preventing test execution if port 3000 is already bound to a development server.

