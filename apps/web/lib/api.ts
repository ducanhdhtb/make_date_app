import { getAccessToken } from './auth';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
async function readBody<T>(response: Response): Promise<T> { const ct = response.headers.get('content-type') || ''; if (ct.includes('application/json')) return response.json() as Promise<T>; return (await response.text()) as T; }
export async function apiFetch<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const authToken = token ?? getAccessToken() ?? undefined;
  const headers = new Headers(init?.headers || undefined);
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!response.ok) { const err = await readBody<any>(response); const msg = typeof err === 'string' ? err : err?.message; throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || 'API request failed'); }
  return readBody<T>(response);
}
