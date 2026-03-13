export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  GYM_ADMIN = 'GYM_ADMIN',
  TRAINER = 'TRAINER',
  RECEPTIONIST = 'RECEPTIONIST',
  CLIENT = 'CLIENT',
}

export interface User {
  id: string;
  gymId: string | null; // Puede ser null para SUPER_ADMIN
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  gymId?: string; // Opcional para SUPER_ADMIN
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}
