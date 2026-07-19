import { api } from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export async function login({ email, password }) {
  return api.post('/auth/login', { email, password });
}

export async function getMe() {
  return api.get('/auth/me');
}

export async function logout() {
  return api.post('/auth/logout');
}

export async function registerInstitute(payload) {
  return api.post('/auth/register-institute', payload);
}

export async function refreshToken(token) {
  return api.post('/auth/refresh-token', { token });
}

export async function forgotPassword(email) {
  return api.post('/users/forget-password', { email });
}

export async function resetPassword({ email, token, newPassword }) {
  return api.post('/users/reset-password', { email, token, newPassword });
}

export const authService = {
  login,
  logout,
  getMe,
  registerInstitute,
  refreshToken,
  forgotPassword,
  resetPassword,
};

export function getStoredUser() {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthStorage(token, user) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch {
    // Ignore storage errors (private mode/quota); request auth may still work via cookies.
  }
}

export function clearAuthStorage() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // No-op
  }
}
