import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideDispatcher } from '@ngrx/signals/events';
import { AppStore } from '../store/app.store';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  let appStore: InstanceType<typeof AppStore>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideDispatcher(),
        AppStore,
      ],
    });

    appStore = TestBed.inject(AppStore);
    router = TestBed.inject(Router);
    appStore.clear();
  });

  it('should allow access to guests when not authenticated', () => {
    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect authenticated users to /app/todos', () => {
    appStore.setAuthenticated(true);

    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/app/todos');
  });
});
