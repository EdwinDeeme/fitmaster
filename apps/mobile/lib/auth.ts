import * as SecureStore from 'expo-secure-store';
import api from './api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  gymId?: string;
  mustChangePassword: boolean;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data } = await api.post<AuthResult>('/api/v1/auth/login', { email, password });
  await SecureStore.setItemAsync('access_token', data.accessToken);
  await SecureStore.setItemAsync('refresh_token', data.refreshToken);
  await SecureStore.setItemAsync('user', JSON.stringify(data.user));
  return data;
}

export async function logout() {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
  await SecureStore.deleteItemAsync('user');
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
