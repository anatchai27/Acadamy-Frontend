import { api } from './api';

export async function createUser(payload) {
  return api.post('/users/register', payload);
}

export const userService = {
  createUser,
};
