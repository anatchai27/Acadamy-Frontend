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
  return null;
}

export function getStoredToken() {
  return null;
}

export function setAuthStorage() {
}

export function clearAuthStorage() {
}
