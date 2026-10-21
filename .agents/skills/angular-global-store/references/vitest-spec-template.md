# Vitest Unit Test Template for Global Signal Store

Co-locate test suites with the store: `src/app/core/store/<store-name>.store.spec.ts`.

## Test Suite Implementation

```typescript
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { HTTP_ERROR_MESSAGES, HttpService } from '@core';
import { AppStore } from './app.store';
import { userAuthenticated, userLogout } from './events';
import { ApiResponse, UserProfile } from '../models';

describe('AppStore', () => {
  let store: InstanceType<typeof AppStore>;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };
  let dispatcher: Dispatcher;
  let router: Router;

  const mockProfile: UserProfile = {
    id: 'user-123',
    name: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
  };

  const mockProfileResponse: ApiResponse<{ profile: UserProfile }> = {
    success: true,
    data: { profile: mockProfile },
  };

  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
      post: vi.fn(),
    };
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // Essential: Register event dispatcher for test environment
        provideDispatcher(),
        AppStore,
        { provide: HttpService, useValue: httpMock },
      ],
    });

    store = TestBed.inject(AppStore);
    dispatcher = TestBed.inject(Dispatcher);
    router = TestBed.inject(Router);

    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    store.clear();
  });

  describe('Initial State', () => {
    it('should initialize with null profile and false isAuthenticated', () => {
      expect(store.profile()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.isPending()).toBe(false);
      expect(store.error()).toBeNull();
    });
  });

  describe('userAuthenticated Event', () => {
    it('should load profile when event is dispatched', () => {
      httpMock.get.mockReturnValue(of(mockProfileResponse));

      // Dispatch event through the type-safe event bus
      dispatcher.dispatch(userAuthenticated());

      expect(httpMock.get).toHaveBeenCalledWith('/v1/profile');
      expect(store.isAuthenticated()).toBe(true);
      expect(store.profile()).toEqual(mockProfile);
      expect(store.isFulfilled()).toBe(true);
      expect(store.isPending()).toBe(false);
    });

    it('should capture error when profile request fails', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: { message: 'Profile service unavailable' },
      });
      httpMock.get.mockReturnValue(throwError(() => errorResponse));

      dispatcher.dispatch(userAuthenticated());

      expect(store.profile()).toBeNull();
      expect(store.isPending()).toBe(false);
      expect(store.error()).toBe('Profile service unavailable');
    });

    it('should fallback to UNKNOWN_ERROR on unformatted errors', () => {
      const errorResponse = new HttpErrorResponse({ status: 502 });
      httpMock.get.mockReturnValue(throwError(() => errorResponse));

      dispatcher.dispatch(userAuthenticated());

      expect(store.error()).toBe(HTTP_ERROR_MESSAGES.UNKNOWN_ERROR);
    });
  });

  describe('userLogout Event', () => {
    it('should clear profile, reset session, and redirect to /login on success', () => {
      // Setup authenticated state first
      httpMock.get.mockReturnValue(of(mockProfileResponse));
      dispatcher.dispatch(userAuthenticated());
      expect(store.isAuthenticated()).toBe(true);

      // Trigger logout
      httpMock.post.mockReturnValue(of({ success: true }));
      dispatcher.dispatch(userLogout());

      expect(httpMock.post).toHaveBeenCalledWith('/v1/auth/logout', {});
      expect(store.isAuthenticated()).toBe(false);
      expect(store.profile()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('clear Method', () => {
    it('should restore store to initial state', () => {
      store.setAuthenticated(true);
      expect(store.isAuthenticated()).toBe(true);

      store.clear();

      expect(store.isAuthenticated()).toBe(false);
      expect(store.profile()).toBeNull();
      expect(store.error()).toBeNull();
    });
  });
});
```
