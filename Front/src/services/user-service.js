import { api } from './api';

export const createStaff = async payload => {
  return api.post('/users', payload);
};

export const registerUser = async payload => {
  return api.post('/users/register', payload);
};

export const createUser = async payload => {
  return registerUser(payload);
};

export const getUsers = async (params = {}, options = {}) => {
  return api.get('/users', { params, ...options });
};

export const getUserById = async id => {
  return api.get(`/users/${id}`);
};

export const updateUserRole = async (id, role) => {
  return api.put(`/users/${id}/role`, { role });
};

export const deleteUser = async id => {
  return api.delete(`/users/${id}`);
};

export const userService = {
  createStaff,
  registerUser,
  createUser,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};
