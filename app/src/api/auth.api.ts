import { apiClient } from './client';
import { AuthTokens, AuthUser } from '../../../shared/types';

export async function registerApi(email: string, password: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<{ success: true; data: AuthTokens }>('/auth/register', {
    email,
    password,
  });
  return data.data;
}

export async function loginApi(email: string, password: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<{ success: true; data: AuthTokens }>('/auth/login', {
    email,
    password,
  });
  return data.data;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ success: true; data: AuthUser }>('/auth/me');
  return data.data;
}
