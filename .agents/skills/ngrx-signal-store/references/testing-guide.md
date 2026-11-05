### Unit Testing SignalStores

Test SignalStores using Angular `TestBed` and standard testing frameworks (Vitest / Jasmine).

#### 1. Public API Assertions & Scope Setup

##### Globally Provided Store (`providedIn: 'root'`)

```typescript
import { TestBed } from '@angular/core/testing';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0 }),
  withComputed(({ count }) => ({
    doubleCount: () => count() * 2,
  })),
  withMethods((store) => ({
    increment() {
      patchState(store, ({ count }) => ({ count: count + 1 }));
    },
  }))
);

describe('CounterStore', () => {
  it('initializes state and handles public method calls', () => {
    const store = TestBed.inject(CounterStore);
    expect(store.count()).toBe(0);
    expect(store.doubleCount()).toBe(0);

    store.increment();
    expect(store.count()).toBe(1);
    expect(store.doubleCount()).toBe(2);
  });
});
```

##### Locally Provided Store

```typescript
import { TestBed } from '@angular/core/testing';
import { signalStore, withState } from '@ngrx/signals';

const LocalStore = signalStore(withState({ count: 0 }));

describe('LocalStore', () => {
  it('instantiates via TestBed providers', () => {
    TestBed.configureTestingModule({ providers: [LocalStore] });
    const store = TestBed.inject(LocalStore);
    expect(store.count()).toBe(0);
  });
});
```

#### 2. Direct State Mutation in Tests (`unprotected`)
Use `unprotected(store)` from `@ngrx/signals/testing` to mutate protected state directly during testing setup.

```typescript
import { TestBed } from '@angular/core/testing';
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';

const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0 }),
  withComputed(({ count }) => ({ doubleCount: () => count() * 2 }))
);

describe('CounterStore with unprotected', () => {
  it('updates state directly without public setter', () => {
    const store = TestBed.inject(CounterStore);

    // Unprotect store state for testing
    patchState(unprotected(store), { count: 5 });

    expect(store.count()).toBe(5);
    expect(store.doubleCount()).toBe(10);
  });
});
```

#### 3. Mocking Injected Dependencies
Provide mock service implementations using `{ provide: Service, useValue: mock }`.

```typescript
import { Injectable, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

@Injectable({ providedIn: 'root' })
class StepService { getStep() { return 1; } }

const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0 }),
  withMethods((store, stepService = inject(StepService)) => ({
    increment() {
      patchState(store, ({ count }) => ({ count: count + stepService.getStep() }));
    },
  }))
);

describe('CounterStore with StepService', () => {
  it('uses mock service response', () => {
    const mockStepService = { getStep: () => 5 };

    TestBed.configureTestingModule({
      providers: [{ provide: StepService, useValue: mockStepService }],
    });

    const store = TestBed.inject(CounterStore);
    store.increment();
    expect(store.count()).toBe(5);
  });
});
```

#### 4. Testing `rxMethod` & `signalMethod`
Flush reactive updates using `scheduled` observables, `expect.poll`, or `TestBed.tick()`.

```typescript
import { TestBed } from '@angular/core/testing';
import { of, scheduled, tap, asyncScheduler } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

const AsyncStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0 }),
  withMethods((store) => ({
    increment: rxMethod<number>(
      tap((n) => patchState(store, ({ count }) => ({ count: count + n })))
    ),
  }))
);

describe('AsyncStore', () => {
  it('handles synchronous Observable emissions', () => {
    const store = TestBed.inject(AsyncStore);
    store.increment(of(1, 2, 3));
    expect(store.count()).toBe(6);
  });

  it('handles asynchronous Observable emissions', async () => {
    const store = TestBed.inject(AsyncStore);
    store.increment(scheduled([1, 2, 3], asyncScheduler));
    expect(store.count()).toBe(0);

    await expect.poll(() => store.count()).toBe(6);
  });
});
```
