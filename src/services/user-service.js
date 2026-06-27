import { api } from './api';

export async function createUser(payload) {
  return api.post('/users/register', payload);
}

export async function getUsers(params = {}) {
  return api.get('/users', { params });
}

export async function getUserById(id) {
  return api.get(`/users/${id}`);
}

export const userService = {
  createUser,
  getUsers,
  getUserById,
};
