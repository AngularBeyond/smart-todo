import { UserProfile } from '@core';

export interface UpdateProfileRequest {
  name?: string;
  lastName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileResponseData {
  profile: UserProfile;
}

export interface ChangePasswordResponseData {
  accessToken: string;
}

export interface ProfileState {
  profile: UserProfile | null;
  profileSuccess: boolean;
  passwordSuccess: boolean;
}
