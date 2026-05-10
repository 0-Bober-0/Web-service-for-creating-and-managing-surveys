import { request } from './http';
import type { TokenResponse, User } from '../types/api';

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function register(payload: RegisterPayload): Promise<User> {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function login(payload: LoginPayload): Promise<TokenResponse> {
  return request<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getMe(): Promise<User> {
  return request<User>('/auth/me');
}
