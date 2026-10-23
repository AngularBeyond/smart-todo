export interface UserProfile {
  id: string;
  name: string;
  lastName: string;
  email: string;
  preferredTheme: 'light' | 'dark';
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
