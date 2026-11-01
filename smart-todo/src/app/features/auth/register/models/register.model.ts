export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export interface RegisterFeatureState {
  showPassword: boolean;
  submitted: boolean;
}
