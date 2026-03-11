import client from './client';
import type { AuthResult, SafeUser } from '../types';

export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  const { data } = await client.post<{ data: AuthResult }>('/auth/register', { email, password, name });
  return data.data;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data } = await client.post<{ data: AuthResult }>('/auth/login', { email, password });
  return data.data;
}

export async function getMe(): Promise<SafeUser> {
  const { data } = await client.get<{ data: { user: SafeUser } }>('/auth/me');
  return data.data.user;
}
