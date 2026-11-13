# Epics & Stories Specification: Final Enhancements & Bug Fixes for v1

| Metadata | Details |
| :--- | :--- |
| **Document ID** | `09-FINAL-ENHANCEMENTS-AND-BUG-FIXES` |
| **Version** | `1.1.0` |
| **Status** | Approved Baseline |
| **Shortcut Objective** | Objective 1139: "Smart Todo Phase 1" |
| **Shortcut Project** | Project 1052: "Smart Todo" |
| **Shortcut Epic ID** | [Epic 1181: Final Enhancement & Bug Fixes for v1](https://app.shortcut.com/marcotello/epic/1181) |

---

## 1. Overview & Epic Scope

This Epic finalizes the polishing phase for Version 1.x.x of the Smart TODO application, focusing on visual ergonomics, uncluttered task capture, streamlined settings, and high-impact showcase presentations.

### Key Objectives
1. **Ergonomic Header Actions:** Relocate list-level actions (Starring, Deletion) and the Search trigger to the top header adjacent to the active tasks count badge.
2. **Full-Width Collapsible Search:** Remove visual clutter from the primary workflow by hiding the filter/search bar by default, expanding it to 100% width upon explicit toggle (via search icon or global `/` hotkey).
3. **About Page Polish:** Redesign the "Built with" technology stack showcase and the "Keep exploring" external source/social links sections.
4. **Settings Page Streamlining:** Remove the redundant "Privacy & security" section and redesign the "Task defaults" preference cards.
5. **Rigorous Quality Verification:** Update all affected unit tests (Vitest) and end-to-end specifications (Playwright) to ensure 100% regression prevention.

---

## 2. EPIC-10 (Shortcut Epic 1181): Final Enhancement & Bug Fixes for v1

### 2.1 Architectural Decisions & UX Constraints

1. **Header Actions Cluster (`ListHeaderComponent`):**
   - The Star list toggle button and Waste Basket (delete list) button move from the filter row up into the list header row, positioned immediately to the right of the `[X ACTIVE]` badge.
   - A new **Search Icon Button** (`lucideSearch`) is inserted between the Star button and the Waste Basket button:
     - Button Order: `[Star]` $\rightarrow$ `[Search]` $\rightarrow$ `[Delete/Waste Basket]`.
   - Action buttons inherit standard Spartan button styling (`variant="ghost"`, `size="icon"`).
   - In aggregate views (`Starred tasks`, `All tasks`), the Delete and Star buttons remain hidden as aggregate views cannot be deleted or starred, while the Search toggle button remains accessible.

2. **Full-Width Collapsible Search (`TodosPageComponent`):**
   - Search bar is hidden (`isSearchVisible() === false`) by default.
   - Clicking the Search icon in the header toggles visibility (`isSearchOpen.set(!isSearchOpen())`).
   - Pressing the global `/` hotkey automatically opens the search bar and focuses the input.
   - When visible, the search container spans **100% width** (`w-full`) directly below the task creation bar (`app-todo-create-bar`).
   - Pressing `Escape` or clicking the clear `X` button clears the filter query; pressing `Escape` when query is empty closes the search input.
   - Closing the search bar clears any active filter query so all tasks remain visible.

3. **About Page Presentation (`AboutPageComponent`):**
   - Redesign the **Built with** section: Enhance technology stack cards with elevated typography, status tags, and architectural badges (Angular 22 Zoneless, Spartan UI, Tailwind CSS, NestJS 12, Prisma ORM).
   - Redesign the **Keep exploring** section: Elevated source code and creator social profile links featuring refined card/row hover transitions.

4. **Settings Page Layout (`SettingsPageComponent`):**
   - **Remove Privacy & Security Section:** Eliminate the redundant "Account security" placeholder card.
   - **Redesign Task Defaults Section:** Upgrade preference controls for default list selection and daily task limits with modern input elements or selector chips.

---

## 3. Epic Stories Breakdown

### [STORY-10.1](https://app.shortcut.com/marcotello/story/1182): Task Capture Area & Header Actions Enhancement

* **User Story:** As an authenticated user managing a todo list, I want the list actions (star, search, delete) consolidated next to the list active badge and the search input to expand across the full width on demand, so that the task capture area is clean, uncluttered, and provides maximum focus when adding or filtering tasks.

* **Implementation Details:**
  1. **Update `ListHeaderComponent` (`smart-todo/src/app/features/todos/components/list-header/`):**
     - Add outputs / event bindings for `toggleStar`, `toggleSearch`, and `deleteList`.
     - In `list-header.component.html`, position the actions container directly to the right of the active tasks badge `<span hlmBadge>`.
     - Render the three action buttons in order:
       1. `Star Button` (toggles favorite status with `lucideStar`, filled when starred).
       2. `Search Button` (triggers search bar display with `lucideSearch`, highlights active state when open).
       3. `Delete / Waste Basket Button` (triggers delete confirmation dialog with `lucideTrash2`).
  2. **Update `TodosPageComponent` (`smart-todo/src/app/features/todos/pages/todos-page/`):**
     - Add a reactive signal `isSearchOpen = signal<boolean>(false)`.
     - Relocate the filter input container below `app-todo-create-bar`.
     - Update class on search input container to `w-full` (removing `max-w-xs sm:max-w-sm md:max-w-md`).
     - Wrap search input in `@if (isSearchOpen())` with autofocus directive or auto-focus callback.
     - Connect global `/` keyboard listener: if `/` is pressed, set `isSearchOpen.set(true)` and focus `#filterInput`.
     - Connect `Escape` handler: if query exists, clear query; if query empty, set `isSearchOpen.set(false)`.
     - When `isSearchOpen` is closed via header search icon, clear `searchModel.query` and reset filter in `TodosStore`.

* **Acceptance Criteria:**
  - [ ] Star, Search, and Waste Basket icons appear in order next to the active tasks chip.
  - [ ] In aggregate views (`Starred tasks`, `All tasks`), only the Search icon is displayed.
  - [ ] Search input is hidden by default upon page load.
  - [ ] Clicking Search icon reveals the 100% full-width search input and focuses it.
  - [ ] Pressing `/` reveals and focuses the full-width search input.
  - [ ] Pressing `Escape` when search is empty hides the search input.
  - [ ] Clearing or closing search restores full task list visibility.
  - [ ] Zero visual overlap or responsiveness breakage across mobile, tablet, and desktop viewports.

* **Tasks:**
  - [ ] Move Star and Delete buttons to ListHeaderComponent right of active chip.
  - [ ] Add Search toggle button in ListHeaderComponent between Star and Delete.
  - [ ] Add reactive `isSearchOpen` state in TodosPageComponent with `/` and `Escape` handlers.
  - [ ] Make search input full width (`w-full`) and conditionally rendered when open.
  - [ ] Handle search toggle cleanup (reset query when closed).

---

### [STORY-10.2](https://app.shortcut.com/marcotello/story/1183): About Page Redesign (Tech Stack & Keep Exploring)

* **User Story:** As a visitor or user exploring the About page, I want an elevated presentation of the architectural stack and project repository links so that the technical craftsmanship and community channels are immediately engaging.

* **Implementation Details:**
  1. **Redesign "Built with" Section (`about-page.component.html` & `.scss`):**
     - Upgrade technology stack cards with categorized architectural badges (Framework, UI Primitives, Styling, Backend Runtime, Database ORM).
     - Modernize layout, card border hover states, and iconography.
  2. **Redesign "Keep exploring" Section:**
     - Restructure project source repository and creator social profile links with interactive cards, clear call-to-actions, and external link indicators.
     - Retain strict security attributes: `target="_blank"`, `rel="noreferrer"`.

* **Acceptance Criteria:**
  - [ ] Modernized "Built with" tech stack grid matching contemporary design standards.
  - [ ] Redesigned "Keep exploring" links layout.
  - [ ] Full responsiveness across mobile, tablet, and desktop viewports.
  - [ ] Complete theme fidelity in both light and dark modes.

* **Tasks:**
  - [ ] Redesign "Built with" technology cards in AboutPageComponent.
  - [ ] Redesign "Keep exploring" social and source links layout.
  - [ ] Verify light/dark theme contrast and responsiveness.

---

### [STORY-10.3](https://app.shortcut.com/marcotello/story/1184): Settings Page Simplification & Task Defaults Redesign

* **User Story:** As an authenticated user customizing my settings, I want a streamlined settings dashboard without empty security placeholders and with a redesigned task defaults card so that workspace configuration is quick and intuitive.

* **Implementation Details:**
  1. **Remove Privacy & Security Section (`settings-page.html`):**
     - Delete the `<section>` containing "Privacy & security" and "Account security".
     - Adjust the layout grid and spacing to maintain visual balance.
  2. **Redesign Task Defaults Section:**
     - Modernize the "Task defaults" configuration card with refined UI controls for selecting default list and viewing/adjusting task quotas.
     - Ensure alignment with Spartan UI card tokens and workspace preferences card.

* **Acceptance Criteria:**
  - [ ] Privacy & Security section is completely removed from Settings page.
  - [ ] Task Defaults section redesigned with clear visual hierarchy and controls.
  - [ ] Layout grid adapts responsively without orphaned whitespace.

* **Tasks:**
  - [ ] Remove Privacy & Security section from settings-page.html.
  - [ ] Redesign Task Defaults section markup and styling.
  - [ ] Verify grid responsiveness and theme consistency.

---

### [STORY-10.4](https://app.shortcut.com/marcotello/story/1185): Quality Gate & Automated Test Suite Update

* **User Story:** As a quality engineer, I want unit tests and Playwright E2E tests updated across the Todos, About, and Settings pages so that all UI changes are validated and protected against future regressions.

* **Implementation Details:**
  1. **Todos Page & Header Tests:**
     - Update `list-header.component.spec.ts` for action button placement and search toggle events.
     - Update `todos-page.spec.ts` for search visibility, `/` hotkey opening, and `Escape` closing.
     - Update Playwright `tests/e2e/tests/04-todos/todo-filter.spec.ts` to click search before querying.
  2. **About Page Tests:**
     - Update `about-page.component.spec.ts` to assert redesigned tech stack and links structure.
     - Update Playwright `tests/e2e/tests/06-about/about.spec.ts`.
  3. **Settings Page Tests:**
     - Update `settings-page.spec.ts` to remove assertions on privacy & security and verify redesigned task defaults.
     - Update Playwright settings tests.

* **Acceptance Criteria:**
  - [ ] `pnpm test` (all Vitest unit tests) passes 100%.
  - [ ] `pnpm test:e2e` Playwright test suites pass 100%.
  - [ ] `pnpm web:typecheck` and `pnpm api:typecheck` pass with 0 errors.

* **Tasks:**
  - [ ] Update unit tests for ListHeaderComponent and TodosPageComponent.
  - [ ] Update unit tests for AboutPageComponent.
  - [ ] Update unit tests for SettingsPageComponent.
  - [ ] Update Playwright E2E specs for filter, about, and settings.
