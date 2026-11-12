import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { HTTP_ERROR_MESSAGES } from '../http/http-error-messages.constants';
import { HttpService } from '../http/http.service';
import { ToastService } from '../services/toast.service';
import { AppStore } from './app.store';
import {
  apiErrorOccurred,
  apiInfoOccurred,
  apiSuccessOccurred,
  profileSynced,
  selectTodoList,
  setMobileSidebarOpen,
  themeChanged,
  toggleMobileSidebar,
  userAuthenticated,
  userLogout,
} from './events';
import { ApiResponse } from '../http/api-response.model';
import { UserProfile } from '../models/user-profile.model';

describe('AppStore', () => {
  let store: InstanceType<typeof AppStore>;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };
  let dispatcher: Dispatcher;
  let router: Router;
  let toastMock: {
    show: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

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
      patch: vi.fn().mockReturnValue(of({ success: true, data: { profile: mockProfile } })),
    };
    toastMock = {
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideDispatcher(),
        AppStore,
        { provide: HttpService, useValue: httpMock },
        { provide: ToastService, useValue: toastMock },
      ],
    });

    store = TestBed.inject(AppStore);
    dispatcher = TestBed.inject(Dispatcher);
    router = TestBed.inject(Router);

    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    store.clear();
  });

  describe('Initial State', () => {
    it('should initialize with null profile, false isAuthenticated, and light theme', () => {
      expect(store.profile()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.accessToken()).toBeNull();
      expect(store.theme()).toBe('light');
      expect(store.isPending()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.userDisplayName()).toBe('Guest');
      expect(store.isReady()).toBe(false);
    });
  });

  describe('userAuthenticated Event', () => {
    it('should load profile, update theme, and set authenticated on success', () => {
      httpMock.get.mockReturnValue(of(mockProfileResponse));

      dispatcher.dispatch(userAuthenticated());

      expect(httpMock.get).toHaveBeenCalledWith('/api/v1/profile');
      expect(store.isAuthenticated()).toBe(true);
      expect(store.profile()).toEqual(mockProfile);
      expect(store.userDisplayName()).toBe('Jane Doe');
      expect(store.isReady()).toBe(true);
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
    it('should clear state, reset theme to light, and navigate to /login on success', () => {
      httpMock.get.mockReturnValue(of(mockProfileResponse));
      dispatcher.dispatch(userAuthenticated());
      expect(store.isAuthenticated()).toBe(true);

      httpMock.post.mockReturnValue(of({ success: true, data: { loggedOut: true } }));
      dispatcher.dispatch(userLogout());

      expect(httpMock.post).toHaveBeenCalledWith('/api/v1/auth/logout', {});
      expect(store.isAuthenticated()).toBe(false);
      expect(store.profile()).toBeNull();
      expect(store.accessToken()).toBeNull();
      expect(store.theme()).toBe('light');
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should reset state and navigate to /login even if logout API fails', () => {
      httpMock.get.mockReturnValue(of(mockProfileResponse));
      dispatcher.dispatch(userAuthenticated());

      httpMock.post.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      dispatcher.dispatch(userLogout());

      expect(store.isAuthenticated()).toBe(false);
      expect(store.profile()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('profileSynced Event', () => {
    it('should update profile when profileSynced is dispatched', () => {
      const updatedProfile: UserProfile = {
        ...mockProfile,
        name: 'Janet',
      };

      dispatcher.dispatch(profileSynced({ profile: updatedProfile }));

      expect(store.profile()).toEqual(updatedProfile);
      expect(store.userDisplayName()).toBe('Janet Doe');
    });
  });

  describe('themeChanged Event', () => {
    it('should update theme when themeChanged is dispatched', () => {
      expect(store.theme()).toBe('light');

      dispatcher.dispatch(themeChanged({ mode: 'dark' }));
      expect(store.theme()).toBe('dark');

      dispatcher.dispatch(themeChanged({ mode: 'light' }));
      expect(store.theme()).toBe('light');
    });
  });

  describe('apiErrorOccurred Event', () => {
    it('should display an error toast when apiErrorOccurred event is dispatched', () => {
      dispatcher.dispatch(apiErrorOccurred({ message: 'Custom API Error' }));
      expect(toastMock.error).toHaveBeenCalledWith('Custom API Error', {
        position: 'top-center',
      });
    });

    it('should fallback to UNKNOWN_ERROR if message is empty', () => {
      dispatcher.dispatch(apiErrorOccurred({ message: '' }));
      expect(toastMock.error).toHaveBeenCalledWith(HTTP_ERROR_MESSAGES.UNKNOWN_ERROR, {
        position: 'top-center',
      });
    });
  });

  describe('apiSuccessOccurred Event', () => {
    it('should display a success toast when apiSuccessOccurred event is dispatched', () => {
      dispatcher.dispatch(apiSuccessOccurred({ message: 'Profile updated successfully' }));
      expect(toastMock.success).toHaveBeenCalledWith('Profile updated successfully', {
        position: 'top-center',
      });
    });
  });

  describe('apiInfoOccurred Event', () => {
    it('should display a default toast when apiInfoOccurred event is dispatched', () => {
      dispatcher.dispatch(apiInfoOccurred({ message: 'Task completed' }));
      expect(toastMock.show).toHaveBeenCalledWith('Task completed', {
        position: 'top-center',
      });
    });
  });

  describe('Mobile Sidebar & Layout Events', () => {
    it('should toggle mobile sidebar open state', () => {
      expect(store.isMobileSidebarOpen()).toBe(false);

      dispatcher.dispatch(toggleMobileSidebar());
      expect(store.isMobileSidebarOpen()).toBe(true);

      dispatcher.dispatch(toggleMobileSidebar());
      expect(store.isMobileSidebarOpen()).toBe(false);
    });

    it('should set mobile sidebar open state via setMobileSidebarOpen', () => {
      dispatcher.dispatch(setMobileSidebarOpen({ isOpen: true }));
      expect(store.isMobileSidebarOpen()).toBe(true);

      dispatcher.dispatch(setMobileSidebarOpen({ isOpen: false }));
      expect(store.isMobileSidebarOpen()).toBe(false);
    });

    it('should automatically close mobile sidebar when selectTodoList is dispatched', () => {
      dispatcher.dispatch(setMobileSidebarOpen({ isOpen: true }));
      expect(store.isMobileSidebarOpen()).toBe(true);

      dispatcher.dispatch(selectTodoList({ listId: 'list-123' }));
      expect(store.isMobileSidebarOpen()).toBe(false);
    });

    it('should automatically close mobile sidebar when router NavigationEnd fires', () => {
      dispatcher.dispatch(setMobileSidebarOpen({ isOpen: true }));
      expect(store.isMobileSidebarOpen()).toBe(true);

      (router as any).events.next(new NavigationEnd(1, '/profile', '/profile'));
      expect(store.isMobileSidebarOpen()).toBe(false);
    });
  });

  describe('Direct methods', () => {
    it('should set access token and clear store', () => {
      store.setAccessToken('sample-jwt-token');
      expect(store.accessToken()).toBe('sample-jwt-token');
      expect(store.isAuthenticated()).toBe(true);

      store.clear();
      expect(store.accessToken()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
    });
  });
});
