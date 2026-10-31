# Epics and Stories Document: Smart TODO Application (Phase 1)

| Metadata | Details | 
| ----- | ----- | 
| **Document ID** | `05-EPICS-AND-STORIES` | 
| **Version** | `1.1.0` | 
| **Status** | Approved Baseline | 
| **Related Documents** | `01-PRD.md`, `02-ROADMAP.md`, `03-BACKEND-ARCHITECTURE.md`, `04-FRONTEND-ARCHITECTURE.md` | 
| **Frontend Stack** | Angular 22, `@ngrx/signals` + `@ngrx/signals/events`, Spartan UI, Tailwind CSS, Angular CDK, Vitest | 
| **Backend Stack** | NestJS 11+, Prisma ORM (Incremental Migrations), MySQL 8.0+ | 

## 1. How Antigravity Should Execute This Document

Each Epic is broken down into ordered, self-contained **User Stories**. Antigravity must implement stories sequentially within each epic, adhering to the following workflow:

1. **Scaffold First:** Use the project's Angular skills (`angular-architecture`, `angular-layouts`, `angular-feature-structure`, `angular-global-store`, `angular-feature-store`) when creating frontend artifacts.

2. **Bottom-Up Layer Implementation:**

   * **Backend:** Prisma Schema/Migration $\rightarrow$ Repository $\rightarrow$ DTOs $\rightarrow$ Service (with transactions & quotas) $\rightarrow$ Controller $\rightarrow$ Unit Tests.

   * **Frontend:** `models/` $\rightarrow$ `constants/` $\rightarrow$ `pure-functions/` $\rightarrow$ `services/` $\rightarrow$ `store/` (with Vitest spec) $\rightarrow$ `components/` $\rightarrow$ `pages/`.

3. **Verify Before Proceeding:** Run the story's verification commands (`tsc`, `eslint`, `vitest` / `jest`) before starting the next story.

## EPIC-01: Monorepo Foundation, Database & Core Infrastructure

### STORY-1.1: Initialize Monorepo, Docker MySQL & Prisma Incremental Migrations

* **User Story:** As a developer, I want a single Git repository housing `smart-todo-api`, `smart-todo`, and a Dockerized MySQL 8.0 database with Prisma Migrate configured so schema changes are tracked incrementally via `_prisma_migrations`.

* **Implementation Details:**

  1. Create root `package.json`, `docker-compose.yml` (MySQL 8.0 on port `3306`, database `smart_todo`), and `.env.example`.

  2. Review `smart-todo-api/` (NestJS) and check that everything is OK (it's a brand new project), then install `prisma` and `@prisma/client`.

  3. Create `smart-todo-api/prisma/schema.prisma` with `User`, `RefreshToken`, `TodoList`, and `TodoItem` models, including `order Float @default(0) @db.Double` on `TodoList` and `TodoItem`, plus all composite indexes defined in `03-BACKEND-ARCHITECTURE.md`.

  4. Run `npx prisma migrate dev --name init` to generate the initial SQL migration and the `_prisma_migrations` control table.

  5. Implement `@Global()` `PrismaModule` and `PrismaService` with `onModuleInit` and `onModuleDestroy` hooks.

* **Acceptance Criteria:**

  * `docker compose up -d` starts MySQL cleanly.

  * `npx prisma migrate status` confirms the database schema is up to date and tracked by `_prisma_migrations`.

  * `TodoList` and `TodoItem` tables include `order DOUBLE NOT NULL DEFAULT 0` and `ON DELETE CASCADE` foreign keys.

### STORY-1.2: Configure NestJS Core Infrastructure, Security & Rate Limiting

* **User Story:** As a platform operator hosting a public demo, I want global validation, standardized `ApiResponse<T>` envelopes, security headers, and multi-tier rate limiting enabled on the NestJS backend so the API is resilient against abuse.

* **Implementation Details:**

  1. Configure global route prefix `/v1` in `smart-todo-api/src/main.ts`.

  2. Enable `helmet()`, `cookieParser()`, and strict `enableCors({ origin: env.FRONTEND_URL, credentials: true })`.

  3. Register global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.

  4. Create `ApiResponseInterceptor` wrapping successful responses in `{ success: true, data: T }`.

  5. Create `GlobalHttpExceptionFilter` formatting all errors as `{ success: false, statusCode, errorCode, message, timestamp, path }`.

  6. Configure `@nestjs/throttler` with two tiers: `default` ($100\text{ req} / 60\text{s}$) and `auth` ($5\text{ req} / 60\text{s}$).

  7. Define quota constants in `src/common/constants/quotas.constants.ts`: `MAX_LISTS_PER_USER = 3`, `MAX_TODOS_PER_LIST = 40`, `ORDER_STEP = 1000`.

* **Acceptance Criteria:**

  * Calling `GET /v1/health` returns `{ "success": true, "data": { "status": "ok" } }`.

  * Sending non-whitelisted DTO properties returns `400 Bad Request` with `{ "success": false, "message": "..." }`.

  * Exceeding the configured rate limit returns `429 Too Many Requests`.

### STORY-1.3: Scaffold Angular 22 Macro Architecture & Dual Layouts

* **User Story:** As a frontend engineer, I want the Angular 22 workspace initialized with the 5 macro architectural folders from Tomas Trajan's *Angular Enterprise Architecture* (`core`, `layout`, `ui`, `features`, `pattern`), Spartan UI + Tailwind CSS (class-based dark mode), and the Dual-Layout routing shell (`FullScreenLayout` and `MainLayout`).

* **Implementation Details:**

  1. Review the app in `smart-todo` and make sure is an Angular 22 with Vitest configured as the unit test runner, Tailwind CSS (`darkMode: 'class'`), `@spartan-ng/ui-*` primitives, `@angular/cdk`, and `@ngrx/signals`.

  2. Scaffold the 5 architectural directories: `src/app/core`, `src/app/layout`, `src/app/ui`, `src/app/features`, and `src/app/pattern`, plus path aliases (`@core`, `@ui`, `@layout`, `@pattern`) in `tsconfig.json`. Follow the skill angular-architecture

  3. Execute `angular-layouts` skill to scaffold:

     * `layout/full-screen-layout` (standalone `<router-outlet></router-outlet>`).

     * `layout/main-layout/main`, `layout/main-layout/header`, `layout/main-layout/sidebar`, and `layout/main-layout/footer`.

  4. Configure `app.config.ts` with `provideRouter(routes)`, `provideHttpClient(withInterceptors([...]))`, and `provideDispatcher()` from `@ngrx/signals/events`.

* **Acceptance Criteria:**

  * `npx tsc -p tsconfig.app.json --noEmit` succeeds with zero errors.

  * `FullScreenLayout` wraps unauthenticated routes (`/login`, `/register`) and `MainLayout` wraps authenticated workspace routes (`/`, `/tags`, `/settings`, `/profile`).

### STORY-1.4: Implement Angular `@core` HTTP, Request Status Feature & Pure Order Calculator

* **User Story:** As a frontend engineer, I want reusable `@core` utilities (`HttpService`, `ApiResponse<T>`, `withRequestStatus()`, and `calculateNewOrder()`) so Global Stores and Feature Stores share a consistent contract.

* **Implementation Details:**

  1. In `src/app/core/http/`, implement `ApiResponse<T>`, `ApiErrorResponse`, `HTTP_ERROR_MESSAGES`, and `HttpService` (`get`, `post`, `patch`, `delete` with `withCredentials: true`).

  2. In `src/app/core/store/custom-features/request-status.feature.ts`, implement `withRequestStatus()` along with `setPending()`, `setFulfilled()`, `setError(message)`, and `setIdle()`.

  3. In `src/app/core/store/pure-functions/order-calculator.util.ts`, implement `calculateNewOrder(items, targetIndex)` using $\text{ORDER\_STEP} = 1000$:

     * Empty list $\rightarrow 1000$

     * Index $0$ (top) $\rightarrow \text{items}[0].\text{order} - 1000$

     * Last index (bottom) $\rightarrow \text{items}[\text{last}].\text{order} + 1000$

     * Between $A$ and $B$ $\rightarrow (\text{order}_A + \text{order}_B) / 2$

  4. Write Vitest unit tests in `order-calculator.util.spec.ts` covering top, bottom, and midpoint drops.

* **Acceptance Criteria:**

  * All `@core` exports are accessible via `import { ... } from '@core'`.

  * `order-calculator.util.spec.ts` passes 100% in Vitest.

## EPIC-02: Authentication, Session Security & Account Lifecycle

### STORY-2.1: Backend Registration with Transactional Onboarding Seed Data

* **User Story:** As a new visitor, I want to create an account with my Name, Last Name, Email, and Password and immediately receive a default `"My Tasks"` list populated with starter tasks so I can explore the app right away.

* **Implementation Details:**

  1. Create `RegisterDto` in `modules/auth/dto/register.dto.ts` validating `name` ($1$–$50$ chars), `lastName` ($1$–$50$ chars), `email` (valid email, lowercase trimmed), and `password` ($\ge 8$ chars).

  2. In `AuthService.register()`, check for existing email (`409 Conflict` if taken) and hash the password using `argon2.hash()`.

  3. Execute `prisma.$transaction` to atomically:

     * Create the `User` (`preferredTheme: 'light'`, `lastLoginAt: new Date()`).

     * Create default `TodoList` (`name: 'My Tasks'`, `isStarred: false`, `order: 1000`).

     * Create $4$ active todos (`order: 1000, 2000, 3000, 4000`) and $1$ completed todo (`order: 5000, isCompleted: true`) inside `"My Tasks"`.

  4. Issue JWT Access Token and set HTTP-only `refresh_token` cookie.

* **Acceptance Criteria:**

  * `POST /v1/auth/register` creates the user, $1$ list, and $5$ todos in a single transaction.

  * Duplicate email registration returns `409 Conflict`.

  * Endpoint enforces the strict `auth` rate limit ($5\text{ req} / 60\text{s}$).

### STORY-2.2: Backend Login, Session Verification, Token Refresh & `lastLoginAt` Tracking

* **User Story:** As a registered user, I want to log in with my email and password and have my session securely maintained while recording my `lastLoginAt` date.

* **Implementation Details:**

  1. Implement `POST /v1/auth/login` (`LoginDto`): verifies credentials with `argon2.verify()`, updates `user.lastLoginAt = new Date()`, stores hashed refresh token in `refresh_tokens`, sets HTTP-only cookie, and returns `{ accessToken, user }`.

  2. Implement `GET /v1/auth/authenticated`: guarded by `JwtAuthGuard`, returns `{ success: true, data: { authenticated: true } }` for Angular route guard checks.

  3. Implement `POST /v1/auth/refresh`: validates the HTTP-only `refresh_token` cookie, rotates the refresh token, updates `user.lastLoginAt = new Date()`, and returns a new `accessToken`.

* **Acceptance Criteria:**

  * Valid login returns `200 OK` and updates `lastLoginAt` in MySQL.

  * Invalid credentials return `401 Unauthorized` without leaking whether the email or password was wrong.

  * `POST /v1/auth/login` is protected by `@Throttle({ auth: { limit: 5, ttl: 60000 } })`.

### STORY-2.3: Backend Change Password, Logout & 90-Day Inactivity Purge Cron

* **User Story:** As an authenticated user, I want to change my password or log out, and as the system owner, I want accounts inactive for more than $90$ days automatically deleted.

* **Implementation Details:**

  1. Implement `PATCH /v1/auth/change-password` (`ChangePasswordDto`: `currentPassword`, `newPassword`): verifies `currentPassword`, updates `passwordHash`, and revokes existing refresh tokens for the user.

  2. Implement `POST /v1/auth/logout`: revokes the active refresh token and clears the `refresh_token` cookie.

  3. In `modules/maintenance/inactive-accounts.cron.ts`, implement `@Cron(CronExpression.EVERY_DAY_AT_3AM)` `purgeInactiveAccounts()`:

     * Computes `cutoffDate = now - 90 days`.

     * Runs `prisma.user.deleteMany({ where: { lastLoginAt: { lt: cutoffDate } } })` (cascading to `todo_lists`, `todo_items`, and `refresh_tokens`).

* **Acceptance Criteria:**

  * Changing password with an incorrect `currentPassword` returns `400 Bad Request`.

  * `purgeInactiveAccounts()` deletes users whose `lastLoginAt` is $91$ days old and preserves users whose `lastLoginAt` is $89$ days old.

### STORY-2.4: Frontend Auth Guards, Interceptor & Global `AppStore` (`SKILL-global-store`)

* **User Story:** As a user, I want my authentication state, profile, and theme managed globally through decoupled `@ngrx/signals/events` so layout components and guards stay synchronized.

* **Implementation Details:**

  1. Follow `SKILL-global-store` to create `src/app/core/store/events/auth.events.ts` (`userAuthenticated`, `userLogout`, `profileSynced`, `themeChanged`) and `src/app/core/store/app.store.ts` (`AppStore` with `{ providedIn: 'root' }`).

  2. Implement `loadProfile$` on `events.on(userAuthenticated)` to fetch `GET /v1/profile`, update `AppStore`, and apply `preferredTheme` to `document.documentElement`.

  3. Implement `logout$` on `events.on(userLogout)` to call `POST /v1/auth/logout`, reset stores, and navigate to `/login`.

  4. Implement `authGuard` and `guestGuard` in `src/app/core/auth/`. When `authGuard` verifies a session, it dispatches `userAuthenticated()`.

  5. Create Vitest test suite `src/app/core/store/app.store.spec.ts` following `vitest-spec-template.md`.

* **Acceptance Criteria:**

  * `app.store.spec.ts` passes all unit tests (initial state, `userAuthenticated` success/error resilience, `userLogout` navigation).

  * Unauthenticated navigation to `/` redirects to `/login`.

### STORY-2.5: Frontend Login & Register Features (`SKILL-feature-structure`)

* **User Story:** As a user, I want clean, responsive Login and Create Account pages built with Spartan UI and Reactive Forms so I can sign in or register seamlessly.

* **Implementation Details:**

  1. Scaffold `src/app/features/auth/login` and `src/app/features/auth/register` with all **9 mandatory folders** (`pages/`, `components/`, `store/`, `constants/`, `models/`, `pure-functions/`, `services/`, `directives/`, `pipes/`).

  2. Implement `LoginStore` (`store/login.store.ts`) and `RegisterStore` (`store/register.store.ts`) using `withRequestStatus()` and `rxMethod` with inner `catchError(() => EMPTY)`. On success, dispatch `userAuthenticated()` and navigate to `/`.

  3. Build `LoginPage` (`pages/login-page`) and `RegisterPage` (`pages/register-page`) inside `FullScreenLayout` with email/password validation, loading spinners (`[disabled]="store.isPending()"`), and dismissible error banners (`store.error()`).

  4. Write Vitest specs for `login.store.spec.ts` and `register.store.spec.ts`.

* **Acceptance Criteria:**

  * Completing registration redirects to `/` and loads the seeded `"My Tasks"` list.

  * Failed login displays the backend error message inside the Spartan UI destructive alert banner.

## EPIC-03: User Profile & Reactive Theme System

### STORY-3.1: Backend Profile Module (`GET /v1/profile`, `PATCH /v1/profile`)

* **User Story:** As an authenticated user, I want endpoints to view and update my `name`, `lastName`, and `preferredTheme` (`light` | `dark`).

* **Implementation Details:**

  1. Create `ProfileModule`, `ProfileController`, `ProfileService`, and `UpdateProfileDto` (`name?`, `lastName?`, `preferredTheme?: 'light' | 'dark'`).

  2. Scope queries strictly by `@CurrentUser() user.sub`.

  3. Return `{ profile: { id, name, lastName, email, preferredTheme, lastLoginAt, createdAt, updatedAt } }`.

* **Acceptance Criteria:**

  * `GET /v1/profile` returns the authenticated user's profile.

  * `PATCH /v1/profile` updates `name`, `lastName`, and `preferredTheme` and persists changes in MySQL.

### STORY-3.2: Frontend Profile & Change Password Feature (`features/profile`)

* **User Story:** As a user, I want a Profile page where I can see and update my Name, Last Name, and Preferred Theme, as well as change my password, and toggle Light/Dark theme directly from the top header.

* **Implementation Details:**

  1. Scaffold `src/app/features/profile` using the **9-folder structure**.

  2. Implement component-scoped `ProfileStore` (`features/profile/store/profile.store.ts` **without** `{ providedIn: 'root' }`) with two `rxMethod` pipelines:

     * `updateProfile`: calls `PATCH /v1/profile` and dispatches `profileSynced({ profile })` to `AppStore`.

     * `changePassword`: calls `PATCH /v1/auth/change-password` and shows confirmation feedback.

  3. Implement `ProfileFormComponent` and `ChangePasswordFormComponent` inside `features/profile/components/`, orchestrated by `ProfilePage` (`providers: [ProfileStore]`).

  4. Add a quick Light/Dark theme toggle button and user profile link in `layout/main-layout/header/header.ts` that dispatches `themeChanged({ mode })`.

  5. Write Vitest spec `profile.store.spec.ts`.

* **Acceptance Criteria:**

  * Toggling Light/Dark theme in the header or Profile page immediately toggles `<html class="dark">` and persists `preferredTheme` to the database.

  * Users can update their First Name and Last Name and see the updated display name in `Header` immediately.

  * Users can change their password from the Profile page.

## EPIC-04: Todo Lists Management & Responsive Sidebar

### STORY-4.1: Backend Todo Lists Module (CRUD, $3$-List Quota, Star & `order` Reordering)

* **User Story:** As an authenticated user, I want backend APIs to fetch, create (up to $3$ lists), rename, star/unstar, reorder (`order: Float`), and delete my todo lists.

* **Implementation Details:**

  1. Create `TodoListsModule`, `TodoListsController`, `TodoListsService`, and `TodoListsRepository`.

  2. `GET /v1/lists`: returns all lists for `userId` ordered by `isStarred DESC`, then `updatedAt DESC` (for starred) and `order ASC` (for unstarred), including `totalCount` and `activeCount` per list.

  3. `POST /v1/lists`: inside `prisma.$transaction`, counts existing lists for `userId`. If $\text{count} \ge 3$, throws `UnprocessableEntityException` (`LIST_QUOTA_EXCEEDED`). Otherwise assigns $\text{order} = \text{MAX(order)} + 1000$ and creates the list.

  4. `PATCH /v1/lists/:id`: updates `name` and/or `isStarred` (verifying `userId` ownership).

  5. `PATCH /v1/lists/:id/reorder`: validates that the target list has `isStarred === false` (`400 Bad Request` if starred) and updates its `order` (`Float`) property.

  6. `DELETE /v1/lists/:id`: verifies ownership and deletes the list (cascading to `todo_items`).

* **Acceptance Criteria:**

  * Creating a $4\text{th}$ list returns `422 Unprocessable Entity` with `errorCode: "LIST_QUOTA_EXCEEDED"`.

  * Attempting to reorder a starred list returns `400 Bad Request`.

  * Deleting a list removes all its todos and frees $1$ list slot.

### STORY-4.2: Frontend Global `TodoListsStore` (`SKILL-global-store`)

* **User Story:** As a frontend developer, I want a root-scoped `TodoListsStore` driven by `@ngrx/signals/events` so both the `MainLayout` Sidebar and the `TodosPage` workspace header can interact with the user's lists cleanly.

* **Implementation Details:**

  1. Define events in `src/app/core/store/events/todo-lists.events.ts`: `loadTodoLists`, `selectTodoList`, `createTodoList`, `renameTodoList`, `toggleStarTodoList`, `reorderUnstarredList`, `deleteTodoList`, and `adjustListCounts`.

  2. Implement `TodoListsStore` in `src/app/core/store/todo-lists.store.ts` (`{ providedIn: 'root' }`) with `withState`, `withRequestStatus()`, `withComputed` (`starredLists`, `unstarredLists`, `selectedList`, `isQuotaReached`), and `withEventHandlers`.

  3. When `reorderUnstarredList` is dispatched, optimistically reorder the unstarred array, compute the new `order` (`Float`) via `calculateNewOrder()`, and call `PATCH /v1/lists/:id/reorder`.

  4. When `deleteTodoList` succeeds, automatically select the first remaining starred or unstarred list (or `null` if $0$ lists remain).

  5. Write Vitest spec `src/app/core/store/todo-lists.store.spec.ts`.

* **Acceptance Criteria:**

  * `starredLists()` always returns starred lists pinned at the top; `unstarredLists()` returns unstarred lists sorted by `order ASC`.

  * `isQuotaReached()` evaluates to `true` when `lists().length >= 3`.

  * `todo-lists.store.spec.ts` passes all unit tests.

### STORY-4.3: Frontend Responsive Sidebar Component (Starred Pinning, Drag-and-Drop & Quota UI)

* **User Story:** As a user, I want a sidebar displaying my Starred lists at the top and my sortable unstarred lists below, with an input to add new lists (up to $3$) and automatic drawer behavior on mobile.

* **Implementation Details:**

  1. Implement `layout/main-layout/sidebar/sidebar.ts` injecting `TodoListsStore` and `Dispatcher`.

  2. Render **Starred Lists** section at the top (when `starredLists().length > 0`). Items have click-to-select and star toggle button, with drag-and-drop disabled.

  3. Render **All Lists (Unstarred)** section below using `cdkDropList` (`(cdkDropListDropped)="onDrop($event)"`). Each item has a `cdkDragHandle`, click-to-select, active task count badge, and star toggle button.

  4. Render the **"New List"** form at the bottom of the sidebar. When `isQuotaReached()` is `true`, disable the input/button and display `"Max 3 lists in demo (3/3)"`.

  5. On mobile viewports ($< 768\text{px}$), wrap the sidebar in a Spartan UI Sheet drawer controlled by the hamburger button in `Header`, automatically closing the drawer when `selectTodoList` is dispatched.

* **Acceptance Criteria:**

  * Starring an unstarred list immediately moves it to the top Starred section.

  * Dragging and dropping unstarred lists updates their visual order immediately and persists the new `order` value.

  * Selecting a list on mobile closes the sidebar sheet and loads the list in the main area.

### STORY-4.4: Frontend Main Area List Header (Single-Click Inline Rename & Delete List)

* **User Story:** As a user viewing a selected list in the main workspace, I want to click/tap the list title once to rename it inline, toggle its star status, or delete the list via a confirmation dialog.

* **Implementation Details:**

  1. Inside `src/app/features/todos/components/list-header/`, create `ListHeaderComponent` using Signal inputs (`list = input.required<TodoListSummary>()`) and Signal outputs (`renamed = output<string>()`, `starToggled = output<void>()`, `deleted = output<void>()`).

  2. Clicking/tapping the list `<h1>` title switches `isEditingTitle = signal(true)` and renders `<input hlmInput appAutoFocus>` (importing `AutoFocusDirective` from `@ui`).

  3. Pressing `Enter` or blurring emits `renamed` if the trimmed name changed and is non-empty ($1$–$100$ chars); pressing `Escape` cancels.

  4. Clicking the Delete button opens a Spartan UI `HlmAlertDialog` confirming permanent deletion of the list and its tasks. Confirming emits `deleted`.

* **Acceptance Criteria:**

  * Single-clicking or tapping the list name in the main area turns it into an input focused with text selected.

  * Saving updates the list name in both the main header and the sidebar simultaneously.

  * Deleting the active list removes it and automatically selects the next available list.

## EPIC-05: Todo Items, Drag-and-Drop & Dual Infinite Scroll

### STORY-5.1: Backend Todos Creation at Top ($\text{order}_{\min} - 1000$) & $40$-Item Hard Quota

* **User Story:** As a user, I want newly created todos to appear at the very top of my active list, and as a platform owner, I want each list capped at a maximum of $40$ total todos (active + completed combined).

* **Implementation Details:**

  1. Create `TodosModule`, `TodosController`, `TodosService`, and `TodosRepository`.

  2. In `TodosService.createTodo(userId, listId, dto)`:

     * Run a `prisma.$transaction`.

     * Verify `TodoList` belongs to `userId` (`404 Not Found` otherwise).

     * Count total todos (`active + completed`) in `listId`. If $\text{totalCount} \ge 40$, throw `UnprocessableEntityException` (`TODO_QUOTA_EXCEEDED`).

     * Aggregate `minOrder = prisma.todoItem.aggregate({ where: { listId, isCompleted: false }, _min: { order: true } })`.

     * Compute $\text{order}_{\text{new}} = (\text{minOrder.\_min.order} ?? 2000) - 1000$.

     * Insert the `TodoItem` with `isCompleted: false` and `order: order_new`.

* **Acceptance Criteria:**

  * Every newly created todo receives an `order` smaller than all existing active todos in that list, placing it at index `0`.

  * Creating a $41\text{st}$ todo in a list returns `422 Unprocessable Entity` (`TODO_QUOTA_EXCEEDED`).

### STORY-5.2: Backend Todos Dual Cursor Pagination ($20$ Batch), Update, Uncomplete-to-Top, Reorder & Delete

* **User Story:** As a user, I want fast cursor-paginated queries ($20$ items per batch) for both active and completed todos, and I want updating, completing, uncompleting (returning to the top), reordering (`order: Float`), and deleting todos to persist reliably.

* **Implementation Details:**

  1. `GET /v1/lists/:listId/todos`:

     * Accepts `completed` (`boolean`), `cursor` (`string?`), and `limit` (`number`, default $20$, max $20$).

     * When `completed === false`: orders by `[{ order: 'asc' }, { id: 'asc' }]`.

     * When `completed === true`: orders by `[{ updatedAt: 'desc' }, { id: 'desc' }]`.

     * Fetches `take: limit + 1` to determine `hasMore` and `nextCursor`, and returns `meta: { totalCount, activeCount, completedCount, quotaLimit: 40 }`.

  2. `PATCH /v1/lists/:listId/todos/:todoId`:

     * Updates `text` and/or `isCompleted`.

     * **Uncomplete-to-Top Rule:** If transitioning from `isCompleted: true` $\rightarrow$ `false`, queries $\text{order}_{\min}$ of active todos in the list and sets $\text{order} = (\text{order}_{\min} ?? 2000) - 1000$ so the task returns to the **top** of the active list.

  3. `PATCH /v1/lists/:listId/todos/:todoId/reorder`:

     * Updates `order` (`Float`) for an active todo. If neighbor distance $< 10^{-9}$, re-normalizes active todos in the list to multiples of $1000$.

  4. `DELETE /v1/lists/:listId/todos/:todoId`:

     * Deletes the todo item and returns updated list counts.

* **Acceptance Criteria:**

  * Fetching active todos with $35$ active items returns $20$ items, `hasMore: true`, and `nextCursor`; passing `nextCursor` returns the remaining $15$ items and `hasMore: false`.

  * Unchecking a completed todo assigns it the lowest `order` value so it appears at the top of the active list.

### STORY-5.3: Frontend Feature-Scoped `TodosStore` (`SKILL-feature-store`)

* **User Story:** As a frontend engineer, I want a component-provided `TodosStore` inside `src/app/features/todos/store/` managing active todos, completed todos, dual $20$-item pagination cursors, and optimistic updates.

* **Implementation Details:**

  1. Scaffold `src/app/features/todos` with all **9 mandatory folders**.

  2. Implement `TodosStore` (`features/todos/store/todos.store.ts` **without** `{ providedIn: 'root' }`) using `withState`, `withRequestStatus()`, `withComputed` (`isQuotaReached`, `quotaBadgeText`), and `withMethods`.

  3. Implement `rxMethod` pipelines (each with inner `catchError(() => EMPTY)`):

     * `loadInitialForList(listId)`

     * `loadMoreActiveTodos()`

     * `toggleCompletedSection()` (lazy-loads first $20$ completed items on expand)

     * `loadMoreCompletedTodos()`

     * `createTodo({ text })` (prepends to top of `activeTodos` and dispatches `adjustListCounts`)

     * `updateTodoText({ todoId, text })`

     * `toggleTodoCompletion(todo)` (moves checked item to top of `completedTodos`; moves unchecked item to top of `activeTodos`)

     * `reorderActiveTodo({ todoId, previousIndex, currentIndex })` (calculates new `order: Float` via `calculateNewOrder()`)

     * `deleteTodo(todo)` (decrements quota count and dispatches `adjustListCounts`)

  4. Write Vitest spec `src/app/features/todos/store/todos.store.spec.ts` verifying all methods and stream resilience after HTTP errors.

* **Acceptance Criteria:**

  * `TodosStore` is provided at the `TodosPage` component level (`providers: [TodosStore]`).

  * `todos.store.spec.ts` passes 100% in Vitest.

### STORY-5.4: Frontend Todo Create Bar & Active Todo Item Row (Inline Edit, Drag Handle & Metadata)

* **User Story:** As a user, I want to type a task at the top and click Add to insert it at the top of the list, drag tasks to reorder them, click/double-click task text to edit inline, check tasks complete, view metadata timestamps, or delete tasks.

* **Implementation Details:**

  1. Build `TodoCreateBarComponent` (`features/todos/components/todo-create-bar/`):

     * Text input + `"Add"` button + quota badge (`{{ quotaBadgeText() }}`).

     * Disabled when `isQuotaReached()` is `true` ($40/40$ tasks).

  2. Build `TodoItemRowComponent` (`features/todos/components/todo-item-row/`):

     * **Drag Handle (`cdkDragHandle`):** Visible on active todos ($44 \times 44\text{px}$ touch target) so mobile vertical scrolling and text tapping never trigger accidental drags.

     * **Checkbox (`hlmCheckbox`):** Emits `toggleComplete`.

     * **Inline Editable Text:** Single-click/tap (`(click)`) or double-click (`(dblclick)`) switches to `<input hlmInput appAutoFocus>` (from `@ui`). Pressing `Enter` or blurring emits `textUpdated`; pressing `Escape` reverts.

     * **Metadata Display:** Displays formatted `createdAt` and `updatedAt` timestamps (subtle metadata subtitle/tooltip).

     * **Delete Button:** Emits `deleteClicked`.

* **Acceptance Criteria:**

  * Adding a new todo places it at index `0` of the active list and displaces previous todos downward.

  * Clicking or double-clicking a todo's text edits it inline and updates its `updatedAt` metadata.

  * Dragging via the handle reorders active todos smoothly and persists the new `order` value.

### STORY-5.5: Frontend Collapsible Completed Section & Dual 20-Item Infinite Scroll

* **User Story:** As a user, I want a collapsible Completed section positioned below the last active todo, and I want both active todos and completed todos to automatically fetch $20$ more items when I scroll to the bottom of each list.

* **Implementation Details:**

  1. Implement `InfiniteScrollSentinelDirective` (`src/app/ui/directives/infinite-scroll-sentinel.directive.ts`, exported via `@ui`) using `IntersectionObserver` to emit `reachedBottom` when the sentinel element enters the viewport.

  2. Place the active sentinel immediately after the active todos `@for` loop in `TodosPage`. When `activeHasMore() && !isLoadingMoreActive()`, emit `store.loadMoreActiveTodos()`.

  3. Below the active todos container (and its sentinel), render `CompletedSectionComponent` (`features/todos/components/completed-section/`):

     * Collapsible header button showing chevron icon and `"Completed ({{ completedCount() }})"`.

     * When expanded (`isCompletedExpanded() === true`), renders `completedTodos()` using `TodoItemRowComponent` (with drag disabled) followed by a second `appInfiniteScrollSentinel` bound to `store.loadMoreCompletedTodos()`.

* **Acceptance Criteria:**

  * The collapsible Completed section always renders below the last active todo.

  * When a list has $> 20$ active todos, scrolling to the $20\text{th}$ active todo automatically fetches and appends the next batch of up to $20$ active todos.

  * Expanding the Completed section when it has $> 20$ completed todos loads the first $20$ items and fetches the next $20$ upon scrolling to the bottom of the completed list.

## EPIC-06: Public Demo Hardening, QA & Deployment Readiness

### STORY-6.1: Backend Unit & E2E Security Verification Suite

* **User Story:** As the blog author deploying a public demo, I want automated tests verifying quota enforcement, rate limiting, tenant isolation, `order` midpoint math, and the $90$-day purge job.

* **Implementation Details:**

  1. Write unit tests for `AuthService`, `TodoListsService`, `TodosService`, and `InactiveAccountsCron`.

  2. Write E2E tests verifying:

     * $6\text{th}$ rapid login attempt returns `429 Too Many Requests`.

     * User B cannot read, update, reorder, or delete User A's lists or todos (`404 Not Found`).

     * Concurrent creation requests cannot exceed $3$ lists per user or $40$ todos per list.

* **Acceptance Criteria:**

  * `npm test` and `npm run test:e2e` in `smart-todo-api` pass with zero failures.

### STORY-6.2: Frontend Vitest Suite, ESLint Boundary Check & Production Build

* **User Story:** As a frontend engineer, I want all Global and Feature SignalStores tested in Vitest, architectural boundaries verified via ESLint, and a clean production build.

* **Implementation Details:**

  1. Run Vitest across all `*.spec.ts` files (`app.store.spec.ts`, `todo-lists.store.spec.ts`, `login.store.spec.ts`, `register.store.spec.ts`, `profile.store.spec.ts`, `todos.store.spec.ts`, `order-calculator.util.spec.ts`).

  2. Verify no feature imports from a sibling feature and `core/` and `ui/` have zero upward dependencies (`eslint-plugin-boundaries`).

  3. Run `ng build --configuration production` and verify bundle generation.

* **Acceptance Criteria:**

  * `npm test -- --watch=false` in `smart-todo` passes 100%.

  * `npx tsc -p tsconfig.app.json --noEmit` and `npx eslint "src/app/**/*.{ts,html}"` pass with zero errors.
