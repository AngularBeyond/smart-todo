export interface RegisterRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterFeatureState {
  showPassword: boolean;
}

