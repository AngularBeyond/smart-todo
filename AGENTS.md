# AGENTS.md — Smart TODO Application (Phase 1)

## 1. Execution Mode: Strict Sub-Phases & Frequent Git Commits/Pushes
CRITICAL INSTRUCTION FOR ANTIGRAVITY:
- We are developing Phase 1 in **incremental sub-phases** (Story-by-Story or Epic sub-phases).
- **NEVER** attempt to implement the entire application or jump ahead to unrequested stories in a single run.
- Only implement the specific Story ID(s) requested in the current prompt.
- **Git Best Practices & Frequent Checkpoints:**
  1. After completing each Story (or logical sub-phase), you MUST run all verification checks (`tsc`, `eslint`, unit tests).
  2. Stop and report a summary of the completed Story, verification output before moving to the next sub-phase.

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

