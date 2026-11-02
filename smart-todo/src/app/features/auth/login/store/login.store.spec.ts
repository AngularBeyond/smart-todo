import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Dispatcher } from '@ngrx/signals/events';
import { HTTP_ERROR_MESSAGES, HttpService } from '@core';
import { AppStore } from '../../../../core/store/app.store';
import { userAuthenticated } from '../../../../core/store/events/auth.events';
import { LoginStore } from './login.store';

describe('LoginStore', () => {
  let store: InstanceType<typeof LoginStore>;
  let httpServiceMock: {
    post: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let dispatcherMock: {
    dispatch: ReturnType<typeof vi.fn>;
  };
  let appStoreMock: {
    setAccessToken: ReturnType<typeof vi.fn>;
  };

  const mockAuthResponse = {
    success: true,
    data: {
      accessToken: 'mock-access-token',
      user: {
        id: 'u-1',
        name: 'Jordan',
        lastName: 'Davis',
        email: 'jordan@example.com',
      },
    },
  };

  beforeEach(() => {
    httpServiceMock = {
      post: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };
    dispatcherMock = {
      dispatch: vi.fn(),
    };
    appStoreMock = {
      setAccessToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LoginStore,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: Dispatcher, useValue: dispatcherMock },
        { provide: AppStore, useValue: appStoreMock },
      ],
    });

    store = TestBed.inject(LoginStore);
  });

  describe('Initial State', () => {
    it('should initialize with idle request status and hidden password', () => {
      expect(store.isPending()).toBe(false);
      expect(store.isFulfilled()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.showPassword()).toBe(false);
    });
  });

  describe('toggleShowPassword', () => {
    it('should toggle password visibility flag', () => {
      expect(store.showPassword()).toBe(false);
      store.toggleShowPassword();
      expect(store.showPassword()).toBe(true);
      store.toggleShowPassword();
      expect(store.showPassword()).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully log in, set access token, dispatch event and navigate to root', () => {
      httpServiceMock.post.mockReturnValue(of(mockAuthResponse));

      store.login({ email: 'jordan@example.com', password: 'password123' });

      expect(store.isPending()).toBe(false);
      expect(store.isFulfilled()).toBe(true);
      expect(store.error()).toBeNull();
      expect(appStoreMock.setAccessToken).toHaveBeenCalledWith('mock-access-token');
      expect(dispatcherMock.dispatch).toHaveBeenCalledWith(userAuthenticated());
      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should capture backend error message on failure', () => {
      const errorResponse = new HttpErrorResponse({
        status: 401,
        error: { message: 'Invalid email or password.' },
      });
      httpServiceMock.post.mockReturnValue(throwError(() => errorResponse));

      store.login({ email: 'wrong@example.com', password: 'wrong' });

      expect(store.isPending()).toBe(false);
      expect(store.isFulfilled()).toBe(false);
      expect(store.error()).toBe('Invalid email or password.');
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should fallback to UNKNOWN_ERROR if server error body is empty', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: null,
      });
      httpServiceMock.post.mockReturnValue(throwError(() => errorResponse));

      store.login({ email: 'test@example.com', password: 'password123' });

      expect(store.error()).toBe(HTTP_ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it('should maintain stream resilience after failure', () => {
      const errorResponse = new HttpErrorResponse({ status: 500 });
      httpServiceMock.post.mockReturnValueOnce(throwError(() => errorResponse));

      store.login({ email: 'test@example.com', password: 'password123' });
      expect(store.error()).not.toBeNull();

      httpServiceMock.post.mockReturnValueOnce(of(mockAuthResponse));
      store.login({ email: 'test@example.com', password: 'password123' });

      expect(store.isFulfilled()).toBe(true);
      expect(store.error()).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should reset error state to idle', () => {
      const errorResponse = new HttpErrorResponse({
        status: 400,
        error: { message: 'Failed' },
      });
      httpServiceMock.post.mockReturnValue(throwError(() => errorResponse));

      store.login({ email: 'test@example.com', password: 'password' });
      expect(store.error()).toBe('Failed');

      store.clearError();
      expect(store.error()).toBeNull();
      expect(store.isPending()).toBe(false);
    });
  });
});
