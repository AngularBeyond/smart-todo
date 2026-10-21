# Feature Folder Rules & Responsibilities

Every Angular feature directory must divide its concerns into the following 9 standard subdirectories:

## 1. `pages/`
- **Purpose:** Host components that serve as route destinations (smart / container components).
- **Sub-structure:** Each page component resides in its own kebab-case subdirectory: `pages/<page-name>/<page-name>.ts`, `.html`, `.scss`, `.spec.ts`.
- **Responsibilities:**
  - Injected with feature stores or core services.
  - Passes data down to presentational components in `components/`.
  - Coordinates high-level user actions and route events.

## 2. `components/`
- **Purpose:** Presentational (dumb) or feature-internal sub-components not used as independent routes.
- **Responsibilities:**
  - Receive state via inputs / signal inputs.
  - Emit events via outputs / signal outputs.
  - Keep styling and UI layout encapsulated to the feature.

## 3. `store/`
- **Purpose:** Hold state management artifacts built with `@ngrx/signals` (`signalStore`).
- **Convention:** Usually one signal store per page (e.g., `<page-name>.store.ts`), or per complex component.
- **Responsibilities:**
  - Hold local feature state and request statuses (`withRequestStatus`).
  - Perform API calls via `rxMethod` using `@core` `HttpService`.
  - Expose computed signals for views.
  - Default to local feature provision unless explicitly designated as global (`{ providedIn: 'root' }`).

## 4. `constants/`
- **Purpose:** Static values, configurations, string literals, and enums specific to the feature.
- **Examples:** Form options, tab keys, table column configurations, local error codes.

## 5. `models/`
- **Purpose:** TypeScript interfaces, types, and contracts representing feature data.
- **Rules:**
  - API responses should extend the generic `ApiResponse<T>` from `@core` (e.g., `export interface MyFeatureResponse extends ApiResponse<MyFeatureData> {}`).
  - Separate raw API payloads from internal component/view models when mapping is needed.

## 6. `pure-functions/`
- **Purpose:** Side-effect-free utility functions and data transformers.
- **Examples:**
  - Mappers converting API DTOs into component-friendly view models.
  - Calculation logic, filters, sorting predicates.

## 7. `services/`
- **Purpose:** Feature-specific injectable services containing business logic or domain operations.
- **Provision:** Decorated with `@Injectable()` (provided in feature injector or component-level provider if ephemeral instances are required).

## 8. `directives/`
- **Purpose:** Custom Angular directives scoped solely to the feature (e.g., custom drag-drop, focus handlers, input formatting).

## 9. `pipes/`
- **Purpose:** Custom Angular pipes scoped exclusively to the feature (e.g., formatting feature-specific status badges or currency displays).
