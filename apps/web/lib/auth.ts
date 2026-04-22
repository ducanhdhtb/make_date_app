'use client';
import { AuthResponse } from './types';
const ACCESS_TOKEN_KEY = 'nearmatch_access_token';
const USER_KEY = 'nearmatch_user';
export function getAccessToken(): string | null { if (typeof window === 'undefined') return null; return window.localStorage.getItem(ACCESS_TOKEN_KEY); }
export function getStoredUser(): AuthResponse['user'] | null { if (typeof window === 'undefined') return null; const raw = window.localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null; }
export function setSession(payload: AuthResponse) { window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken); window.localStorage.setItem(USER_KEY, JSON.stringify(payload.user)); }
export function clearSession() { window.localStorage.removeItem(ACCESS_TOKEN_KEY); window.localStorage.removeItem(USER_KEY); }
