# User Flows Document: Smart TODO Application (Phase 1)

| Metadata | Details | 
| ----- | ----- | 
| **Document ID** | `06-USER-FLOWS` | 
| **Version** | `1.0.0` | 
| **Status** | Approved Baseline | 
| **Related Documents** | `01-PRD.md`, `04-FRONTEND-ARCHITECTURE.md`, `05-EPICS-AND-STORIES.md` | 

## 1. Introduction

This document details the step-by-step interactions between the user, the Angular frontend (`SignalStores`), and the NestJS backend for the critical paths of the application. It serves as a behavioral blueprint for development and end-to-end testing.

## 2. Authentication & Onboarding Flows

### Flow 2.1: First-Time Account Registration & Onboarding Seed

**Objective:** A new user registers and is immediately dropped into a fully working workspace with sample data.

1. **User Action:** Navigates to `/register` and fills out Name, Last Name, Email, and Password. Clicks "Create Account".

2. **Frontend:** `RegisterStore` sets `isPending() = true` and calls `POST /v1/auth/register`.

3. **Backend:**

   * Validates payload (checks for duplicate email).

   * Opens a single database transaction.

   * Creates the `User` record (`preferredTheme: 'light'`).

   * Creates a default `TodoList` named "My Tasks".

   * Creates 4 active `TodoItem` records and 1 completed `TodoItem` inside "My Tasks".

   * Issues JWT and HTTP-only refresh cookie. Returns `201 Created`.

4. **Frontend:**

   * `RegisterStore` sets `isFulfilled() = true`.

   * Dispatches the global `@ngrx/signals/events` event: `userAuthenticated()`.

   * Redirects the user to `/`.

5. **AppStore Reaction:** Hears `userAuthenticated()`, fetches the user profile, sets the global `profile` signal, and applies the `light` theme to the document.

6. **User Result:** User sees the "My Tasks" list selected automatically, populated with the onboarding tutorial tasks.

### Flow 2.2: Login & Session Hydration

**Objective:** A returning user logs in and their `lastLoginAt` is tracked.

1. **User Action:** Navigates to `/login`, enters credentials, clicks "Sign In".

2. **Backend:** Verifies Argon2 hash. Updates `lastLoginAt` to `now()`. Sets HTTP-only cookie and returns JWT.

3. **Frontend:** Dispatches `userAuthenticated()`, fetches profile, applies user's saved `preferredTheme` (e.g., `dark` mode activates instantly), and redirects to `/`.

## 3. Profile & Theme Flows

### Flow 3.1: Toggling Light / Dark Theme

**Objective:** User switches to Dark mode and it persists.

1. **User Action:** Clicks the Sun/Moon toggle button in the Main Layout Header.

2. **Frontend:**

   * Layout dispatches the `themeChanged({ mode: 'dark' })` event.

   * `AppStore` immediately updates the local signal, and the `ThemeService` adds the `dark` class to the `<html>` root element (instant visual update).

   * `AppStore` triggers a background `PATCH /v1/profile` with `{ preferredTheme: 'dark' }`.

3. **Backend:** Updates the user's `preferredTheme` in MySQL.

### Flow 3.2: Updating Profile Information

**Objective:** User changes their First Name.

1. **User Action:** Opens the Profile page (`/profile`), updates the First Name input, and clicks "Save".

2. **Frontend:** `ProfileStore` calls `PATCH /v1/profile`.

3. **Backend:** Updates the database and returns the updated profile.

4. **Frontend:** `ProfileStore` receives the response and dispatches `profileSynced({ profile })`.

5. **AppStore Reaction:** Updates the global `profile()` signal. The User's name in the Top Header immediately reflects the change.

## 4. Sidebar List Management Flows

### Flow 4.1: Creating a List (Quota Enforcement)

**Objective:** User creates their 3rd (and final) allowed list.

1. **User Action:** Types "Groceries" into the "New List" input at the bottom of the sidebar and hits Enter.

2. **Backend:**

   * Transactionally counts existing lists. Count is currently 2.

   * Finds max `order` among user's lists, adds 1000.

   * Inserts list and returns `201 Created`.

3. **Frontend:**

   * `TodoListsStore` appends the new list to `unstarredLists()`.

   * Computes `isQuotaReached() = true` (because length is now 3).

4. **User Result:** "Groceries" appears in the sidebar. The "New List" input becomes disabled and displays "Max 3 lists in demo (3/3)".

### Flow 4.2: Drag-and-Drop Reordering Unstarred Lists

**Objective:** User reorders their lists in the sidebar.

1. **User Action:** Clicks the drag handle on List C and drops it between List A (`order: 1000`) and List B (`order: 2000`).

2. **Frontend:**

   * CDK Drop event fires. Angular immediately visually swaps the items.

   * `calculateNewOrder` utility computes `(1000 + 2000) / 2 = 1500`.

   * `TodoListsStore` calls `PATCH /v1/lists/:id/reorder` with `{ order: 1500 }`.

3. **Backend:** Updates the `order` column for List C to `1500`.

### Flow 4.3: Starring a List

**Objective:** User pins a list to the top.

1. **User Action:** Clicks the hollow Star icon next to an unstarred list.

2. **Frontend:** `TodoListsStore` triggers an optimistic update, moving the list from `unstarredLists()` to `starredLists()` immediately. Calls `PATCH /v1/lists/:id`.

3. **User Result:** The list instantly snaps to the top Starred section of the sidebar.

## 5. Main Workspace & Task Flows

### Flow 5.1: Single-Click List Rename

**Objective:** User edits the name of the active list.

1. **User Action:** Single-clicks the large `<h1>` list title in the main workspace header.

2. **Frontend:** `ListHeaderComponent` swaps the `<h1>` for an `<input>` and applies the `appAutoFocus` directive. Text is automatically selected.

3. **User Action:** Types "Weekend Chores" and clicks outside the input (blur event) or hits `Enter`.

4. **Frontend:** Input swaps back to `<h1>`. Event is emitted. `TodoListsStore` updates the name locally (updating the sidebar instantly) and calls `PATCH /v1/lists/:id`.

### Flow 5.2: Adding a Task (Insert at Top)

**Objective:** User adds a task and it appears at the very top.

1. **User Action:** Types "Buy Milk" in the top creation bar and clicks "Add".

2. **Frontend:**

   * `TodosStore` calls `POST /v1/lists/:id/todos`.

3. **Backend:**

   * Queries active tasks. Finds minimum order is `1500`.

   * Sets new task order to `1500 - 1000 = 500`.

   * Returns created task.

4. **Frontend:** Prepends "Buy Milk" to the top of the `activeTodos()` signal array.

### Flow 5.3: Single-Click Task Edit

**Objective:** User edits a task's text inline.

1. **User Action:** Taps directly on the text of the "Buy Milk" task.

2. **Frontend:** `TodoItemRowComponent` replaces text with an `<input>` field, focused automatically.

3. **User Action:** Changes text to "Buy Almond Milk" and hits `Enter`.

4. **Frontend:** Swaps back to text display. Calls `PATCH /v1/lists/:id/todos/:todoId` with `{ text: 'Buy Almond Milk' }`. Subtitle metadata updates `updatedAt` to `Just now`.

### Flow 5.4: Uncompleting a Task (Return to Top)

**Objective:** User unchecks a completed task.

1. **User Action:** Scrolls to the "Completed" section, expands it, and unchecks "Walk the dog".

2. **Frontend:** `TodosStore` optimistically removes it from `completedTodos()` and moves it to the top of `activeTodos()`. Calls `PATCH` endpoint.

3. **Backend:** Calculates new `order` (`MIN_ACTIVE_ORDER - 1000`). Updates `isCompleted = false` and `order`.

4. **User Result:** Task vanishes from the Completed section and reappears at index 0 of the active tasks.

## 6. Infinite Scroll Flows

### Flow 6.1: Active Tasks Infinite Scroll

**Objective:** User scrolls through a long list of 35 active tasks.

1. **Initial Load:** User clicks the list in the sidebar. `TodosStore` fetches `GET /v1/.../todos?completed=false&limit=20`. 20 tasks load. `hasMore` is true.

2. **User Action:** User scrolls down the page. The 20th task and the hidden `appInfiniteScrollSentinel` directive enter the viewport.

3. **Frontend:** Sentinel emits `reachedBottom` event.

4. **Store Action:** `TodosStore` checks `isPending() === false` and `hasMore() === true`. Calls endpoint using `nextCursor`.

5. **Result:** Remaining 15 items are appended to `activeTodos()`. Sentinel shifts to the bottom.

### Flow 6.2: Completed Tasks Expansion & Lazy Load

**Objective:** User wants to see old completed tasks.

1. **Initial State:** Completed section is collapsed at the bottom of the page showing "Completed (45)". `completedTodos()` array is empty.

2. **User Action:** Clicks to expand the section.

3. **Frontend:** Section opens showing a loading spinner. `TodosStore` triggers `loadMoreCompletedTodos()`, fetching the first 20 items ordered by `updatedAt DESC`.

4. **User Action:** User scrolls to the bottom of the 20 completed items.

5. **Frontend:** Completed sentinel triggers. Fetches the next 20 items and appends them.