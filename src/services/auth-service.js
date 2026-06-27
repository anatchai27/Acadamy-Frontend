import { api } from './api';

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

export async function forgetPassword(email) {
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
  forgetPassword,
  resetPassword,
};

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthStorage(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
