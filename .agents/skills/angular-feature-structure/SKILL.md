---
name: angular-feature-structure
description: Enforces and scaffolds the standard internal feature folder architecture (pages, components, store, constants, models, pure-functions, services, directives, pipes) for Angular features. Use when creating, refactoring, or organizing code within any Angular feature module or route. Do not use for root application scaffolding or generic non-feature code.
---

# Angular Feature Structure

Enforce a consistent, scalable 9-folder architecture within every Angular feature module or routed domain.

## Overview & Folder Architecture

Every Angular feature encapsulates all required presentation, business logic, state, and API communication. Features are self-contained and lazy-loaded by default.

Each feature directory must contain the following 9 standard folders:

| Folder | Responsibility |
| :--- | :--- |
| `pages/` | Routed smart/container components (e.g. `pages/<page-name>/`). |
| `components/` | Presentational or internal child components used within the feature. |
| `store/` | Signal stores (`@ngrx/signals`) managing state, request status, and API calls. |
| `constants/` | Local configuration, string constants, and feature enums. |
| `models/` | Data interfaces, request/response DTOs, and view models. |
| `pure-functions/` | Pure mapping functions, DTO transformers, and calculation helpers. |
| `services/` | Feature-scoped injectable business services (`@Injectable()`). |
| `directives/` | Feature-specific Angular directives. |
| `pipes/` | Feature-specific Angular pipes. |

See [references/folder-rules.md](references/folder-rules.md) for detailed folder contracts and constraints.
See [references/login-feature-example.md](references/login-feature-example.md) for an annotated real-world example from `auth/login`.

---

## Workflow: Scaffolding and Implementing a Feature

### Step 1: Establish Feature Location
Identify the root path for the feature inside `src/app/features/` (e.g., `src/app/features/billing` or `src/app/features/auth/login`). Ensure the feature path aligns with domain routing.

### Step 2: Scaffold Directory Structure
Execute the scaffolding script to create all 9 folders with initial barrel files:

```bash
.agents/skills/angular-feature-structure/scripts/scaffold-feature.sh "<path-to-feature>"
```

Verify that each subdirectory contains an `index.ts` file for clean internal exports.

### Step 3: Implement Layers (Bottom-Up Order)

To ensure compile-time stability and clean dependency flow, implement feature assets in bottom-up sequence:

1. **`models/`**:
   - Define request payloads, response DTOs, and view models.
   - For backend responses, extend the generic `ApiResponse<T>` from `@core`.
   - Export all types through `models/index.ts`.

2. **`constants/`**:
   - Define route constants, error mappings, default state values, or local enums.
   - Export through `constants/index.ts`.

3. **`pure-functions/`**:
   - Write pure mapper functions (e.g., converting backend DTOs to view models).
   - Keep functions free of side-effects and external dependencies for direct unit testability.

4. **`services/`**:
   - Create feature services for domain-specific logic or non-store HTTP orchestration.
   - Decorate with `@Injectable()` without `{ providedIn: 'root' }` unless explicitly shared across application boundaries.

5. **`store/`**:
   - Build a signal store per page or complex feature unit using `@ngrx/signals`.
   - Use `withRequestStatus()` from `@core` to track loading, fulfilled, and error states.
   - Use `rxMethod` to handle asynchronous API calls via `@core` `HttpService`.
   - Catch errors and normalize error messages (e.g. using `HTTP_ERROR_MESSAGES.UNKNOWN_ERROR`).

6. **`components/`**:
   - Build presentational components using modern standalone Angular (`imports: [...]`).
   - Use signal inputs (`input()`, `input.required()`) and signal outputs (`output()`).

7. **`pages/`**:
   - Create routed smart components under `pages/<page-name>/`.
   - Injected with the feature store.
   - Connect template forms and event triggers to store methods.
   - Render loading indicators, error banners, and child components from `components/`.

### Step 4: Configure Routing & Lazy Loading

Features must be lazy-loaded by default in `src/app/app.routes.ts`:

```typescript
// Standard Lazy Loaded Feature
{
  path: 'billing',
  loadChildren: () => import('./features/billing/billing.routes').then(m => m.BILLING_ROUTES),
}

// Or single-page lazy load
{
  path: 'signals/:id',
  loadComponent: () => import('./features/signals/pages/signal-detail-page').then(m => m.SignalDetailPage),
}
```

*Exception:* Core public entry points (such as `LoginPage`) may be loaded directly if required for initial bundle execution.

---

## Architectural Guardrails & Linting Rules

- **Strict Feature Boundaries:** A feature must NEVER import directly from a sibling feature directory. Shared code belongs in `src/app/core/` or `src/app/shared/`.
- **Barrel Exports:** Internal sub-folders expose their public members via local `index.ts`. Consume imports cleanly using relative paths within the feature (e.g., `import { LoginRequest } from '../models';`).
- **No Circular Dependencies:** Pages consume stores, components, and models; stores consume services and models; pure-functions consume models. Never invert this hierarchy.

---

## Verification Checklist

After scaffolding and implementing feature code:
1. Run static analysis:
   ```bash
   npx eslint "src/app/features/<feature-name>/**/*.{ts,html}"
   ```
2. Verify TypeScript type correctness:
   ```bash
   npx tsc -p tsconfig.app.json --noEmit
   ```
3. Verify test coverage for stores and pages:
   ```bash
   npm test -- --include="src/app/features/<feature-name>/**/*.spec.ts" --watch=false
   ```
