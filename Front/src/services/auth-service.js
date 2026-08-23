import { api } from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const login = async ({ email, password }) => {
  return api.post('/auth/login', { email, password });
};

export const getMe = async () => {
  return api.get('/auth/me');
};

export const logout = async () => {
  return api.post('/auth/logout');
};

export const registerInstitute = async payload => {
  return api.post('/auth/register-institute', payload);
};

export const refreshToken = async token => {
  return api.post('/auth/refresh-token', { token });
};

export const forgotPassword = async email => {
  return api.post('/users/forget-password', { email });
};

export const resetPassword = async ({ email, token, newPassword }) => {
  return api.post('/users/reset-password', { email, token, newPassword });
};

export const authService = {
  login,
  logout,
  getMe,
  registerInstitute,
  refreshToken,
  forgotPassword,
  resetPassword,
};

export const getStoredUser = () => {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthStorage = (token, user) => {
  try {
    token ? window.localStorage.setItem(TOKEN_KEY, token) : null;
    user ? window.localStorage.setItem(USER_KEY, JSON.stringify(user)) : null;
  } catch {}
};

export const clearAuthStorage = () => {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {}
};
