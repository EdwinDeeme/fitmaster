import { UserRole } from '@prisma/client';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  gymId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface TokenPayload {
  userId: string;
  gymId: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}
