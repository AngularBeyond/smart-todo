import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Dispatcher } from '@ngrx/signals/events';
import {
  ApiResponse,
  AppStore,
  HTTP_ERROR_MESSAGES,
  HttpService,
  profileSynced,
  UserProfile,
} from '@core';
import { ProfileStore } from './profile.store';
import {
  ChangePasswordResponseData,
  ProfileResponseData,
  UpdateProfileRequest,
} from '../models';

describe('ProfileStore', () => {
  let store: InstanceType<typeof ProfileStore>;
  let httpServiceMock: {
    get: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };
  let dispatcherMock: {
    dispatch: ReturnType<typeof vi.fn>;
  };
  let appStoreMock: {
    setAccessToken: ReturnType<typeof vi.fn>;
  };

  const mockUserProfile: UserProfile = {
    id: 'u-1',
    name: 'Jordan',
    lastName: 'Davis',
    email: 'jordan@example.com',
  };

  const mockProfileResponse: ApiResponse<ProfileResponseData> = {
    success: true,
    data: {
      profile: mockUserProfile,
    },
  };

  beforeEach(() => {
    httpServiceMock = {
      get: vi.fn(),
      patch: vi.fn(),
    };
    dispatcherMock = {
      dispatch: vi.fn(),
    };
    appStoreMock = {
      setAccessToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ProfileStore,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: Dispatcher, useValue: dispatcherMock },
        { provide: AppStore, useValue: appStoreMock },
      ],
    });

    store = TestBed.inject(ProfileStore);
  });

  describe('Initial State', () => {
    it('should initialize with default idle state and null profile', () => {
      expect(store.profile()).toBeNull();
      expect(store.profileSuccess()).toBe(false);
      expect(store.passwordSuccess()).toBe(false);
      expect(store.isPending()).toBe(false);
      expect(store.isFulfilled()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.fullName()).toBe('');
      expect(store.initials()).toBe('U');
      expect(store.email()).toBe('');
    });
  });

  describe('Computed Signals & setProfile', () => {
    it('should compute fullName, initials, and email accurately', () => {
      store.setProfile(mockUserProfile);

      expect(store.profile()).toEqual(mockUserProfile);
      expect(store.fullName()).toBe('Jordan Davis');
      expect(store.initials()).toBe('JD');
      expect(store.email()).toBe('jordan@example.com');
    });

    it('should fallback initials to email initial when names are absent', () => {
      store.setProfile({
        id: 'u-2',
        name: '',
        lastName: '',
        email: 'alex@example.com',
      });

      expect(store.fullName()).toBe('alex@example.com');
      expect(store.initials()).toBe('A');
    });
  });

  describe('loadProfile', () => {
    it('should fetch profile, update state, and dispatch profileSynced event', () => {
      httpServiceMock.get.mockReturnValue(of(mockProfileResponse));

      store.loadProfile();

      expect(httpServiceMock.get).toHaveBeenCalledWith('/api/v1/profile');
      expect(store.profile()).toEqual(mockUserProfile);
      expect(store.isFulfilled()).toBe(true);
      expect(store.error()).toBeNull();
      expect(dispatcherMock.dispatch).toHaveBeenCalledWith(
        profileSynced({ profile: mockUserProfile }),
      );
    });

    it('should set error state on profile load failure', () => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: { message: 'Server unavailable' },
      });
      httpServiceMock.get.mockReturnValue(throwError(() => errorResponse));

      store.loadProfile();

      expect(store.profile()).toBeNull();
      expect(store.isFulfilled()).toBe(false);
      expect(store.error()).toBe('Server unavailable');
    });
  });

  describe('updateProfile', () => {
    it('should patch profile, mark success, and dispatch profileSynced event', () => {
      const updatedUser: UserProfile = {
        ...mockUserProfile,
        name: 'Jordan Updated',
      };
      const response: ApiResponse<ProfileResponseData> = {
        success: true,
        data: { profile: updatedUser },
      };
      httpServiceMock.patch.mockReturnValue(of(response));

      const request: UpdateProfileRequest = {
        name: 'Jordan Updated',
      };

      store.updateProfile(request);

      expect(httpServiceMock.patch).toHaveBeenCalledWith(
        '/api/v1/profile',
        request,
      );
      expect(store.profile()).toEqual(updatedUser);
      expect(store.profileSuccess()).toBe(true);
      expect(store.isFulfilled()).toBe(true);
      expect(store.error()).toBeNull();
      expect(dispatcherMock.dispatch).toHaveBeenCalledWith(
        profileSynced({ profile: updatedUser }),
      );
    });

    it('should capture error message on update failure and reset success flag', () => {
      const errorResponse = new HttpErrorResponse({
        status: 400,
        error: { message: 'Invalid profile data' },
      });
      httpServiceMock.patch.mockReturnValue(throwError(() => errorResponse));

      store.updateProfile({ name: 'Fail' });

      expect(store.profileSuccess()).toBe(false);
      expect(store.error()).toBe('Invalid profile data');
    });
  });

  describe('changePassword', () => {
    it('should patch change-password, set success flag, and update access token', () => {
      const response: ApiResponse<ChangePasswordResponseData> = {
        success: true,
        data: { accessToken: 'new-jwt-token' },
      };
      httpServiceMock.patch.mockReturnValue(of(response));

      store.changePassword({
        currentPassword: 'old-password',
        newPassword: 'new-password-123',
      });

      expect(httpServiceMock.patch).toHaveBeenCalledWith(
        '/api/v1/auth/change-password',
        {
          currentPassword: 'old-password',
          newPassword: 'new-password-123',
        },
      );
      expect(store.passwordSuccess()).toBe(true);
      expect(store.isFulfilled()).toBe(true);
      expect(store.error()).toBeNull();
      expect(appStoreMock.setAccessToken).toHaveBeenCalledWith('new-jwt-token');
    });

    it('should capture error message on change password failure', () => {
      const errorResponse = new HttpErrorResponse({
        status: 401,
        error: { message: 'Current password is incorrect' },
      });
      httpServiceMock.patch.mockReturnValue(throwError(() => errorResponse));

      store.changePassword({
        currentPassword: 'wrong-password',
        newPassword: 'new-password-123',
      });

      expect(store.passwordSuccess()).toBe(false);
      expect(store.error()).toBe('Current password is incorrect');
    });
  });

  describe('clearStatus', () => {
    it('should reset profileSuccess, passwordSuccess, and set status to idle', () => {
      httpServiceMock.get.mockReturnValue(of(mockProfileResponse));
      store.loadProfile();

      store.clearStatus();

      expect(store.profileSuccess()).toBe(false);
      expect(store.passwordSuccess()).toBe(false);
      expect(store.requestStatus()).toBe('idle');
      expect(store.error()).toBeNull();
    });
  });
});
