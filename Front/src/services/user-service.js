import { api } from './api';

export async function createStaff(payload) {
  return api.post('/users', payload);
}

export async function registerUser(payload) {
  return api.post('/users/register', payload);
}

export async function createUser(payload) {
  return registerUser(payload);
}

export async function getUsers(params = {}, options = {}) {
  return api.get('/users', { params, ...options });
}

export async function getUserById(id) {
  return api.get(`/users/${id}`);
}

export async function updateUserRole(id, role) {
  return api.put(`/users/${id}/role`, { role });
}

export async function deleteUser(id) {
  return api.delete(`/users/${id}`);
}

export const userService = {
  createStaff,
  registerUser,
  createUser,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};
