# Real-World Reference: Auth Login Feature

The `src/app/features/auth/login` directory illustrates the standard 9-folder Angular feature layout in SignalSphere.

## Directory Structure

```text
src/app/features/auth/login/
├── components/
│   └── index.ts
├── constants/
│   └── index.ts
├── directives/
│   └── index.ts
├── models/
│   ├── index.ts
│   └── login.model.ts
├── pages/
│   └── login-page/
│       ├── login-page.html
│       ├── login-page.scss
│       ├── login-page.spec.ts
│       └── login-page.ts
├── pipes/
│   └── index.ts
├── pure-functions/
│   └── index.ts
├── services/
│   └── index.ts
└── store/
    ├── index.ts
    ├── login.store.spec.ts
    └── login.store.ts
```

---

## 1. Models Layer (`models/login.model.ts`)
Encapsulates DTOs, requests, view models, and error types:

```typescript
export type { ApiErrorResponse } from '@core';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  success: boolean;
}

export interface LoginFormModel {
  email: string;
  password: string;
  rememberMe: boolean;
}
```

Barrel export (`models/index.ts`):
```typescript
export * from './login.model';
```

---

## 2. Store Layer (`store/login.store.ts`)
Manages feature state, async request statuses, and navigation:

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withMethods } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import {
  HTTP_ERROR_MESSAGES,
  HttpService,
  setError,
  setFulfilled,
  setIdle,
  setPending,
  withRequestStatus,
} from '@core';
import { LoginRequest, LoginResponse } from '../models';

export const LoginStore = signalStore(
  { providedIn: 'root' },
  withRequestStatus(),
  withMethods((store, httpService = inject(HttpService), router = inject(Router)) => ({
    login: rxMethod<LoginRequest>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((credentials) =>
          httpService.post<LoginResponse>('/v1/auth/login', credentials).pipe(
            tap({
              next: () => {
                patchState(store, setFulfilled());
                void router.navigate(['/dashboard']);
              },
              error: (error: HttpErrorResponse) => {
                const message =
                  error.error?.message ||
                  (typeof error.error === 'string' ? error.error : null) ||
                  HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                patchState(store, setError(message));
              },
            }),
            catchError(() => EMPTY),
          ),
        ),
      ),
    ),
    clearError(): void {
      patchState(store, setIdle());
    },
  })),
);
```

---

## 3. Page Component (`pages/login-page/login-page.ts`)
The routed page component acts as the smart orchestrator:

```typescript
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ...uiModules],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  readonly loginStore = inject(LoginStore);
  // Injects store, binds form, handles submission
}
```

---

## 4. Routing Integration (`app.routes.ts`)
Features are lazy-loaded via `loadChildren` or `loadComponent` in general, except for early entry points like `LoginPage`:

```typescript
// Eager entry or lazy-loaded feature route
{
  path: 'login',
  component: LoginPage, // or loadComponent: () => import('./features/auth/login/pages/login-page').then(m => m.LoginPage)
}
```
