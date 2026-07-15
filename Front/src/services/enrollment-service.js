import { api } from './api';

export function enrollStudent(payload) {
  return api.post('/enrollments', payload);
}

export const enrollmentService = {
  enrollStudent,
};
