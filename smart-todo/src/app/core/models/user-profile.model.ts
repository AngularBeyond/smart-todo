export interface UserProfile {
  id: string;
  name: string;
  lastName: string;
  email: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
