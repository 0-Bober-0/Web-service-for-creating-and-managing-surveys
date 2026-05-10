import { clearToken, getToken } from './tokenStorage';
import type { ApiErrorPayload } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function parseErrorMessage(payload: ApiErrorPayload | string | null): string {
  if (!payload) return 'Ошибка запроса';
  if (typeof payload === 'string') return payload;

  if (Array.isArray(payload.detail)) {
    return payload.detail.map((item) => item.msg || JSON.stringify(item)).join('; ');
  }

  if (typeof payload.detail === 'string') {
    return payload.detail;
  }

  return 'Ошибка запроса';
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);

  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (response.status === 401) {
    clearToken();
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? ((await response.json()) as ApiErrorPayload)
      : await response.text();
    throw new ApiError(response.status, parseErrorMessage(payload));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
