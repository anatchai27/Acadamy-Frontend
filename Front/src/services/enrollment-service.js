import { api } from './api';

export const enrollStudent = payload => {
  return api.post('/enrollments', payload);
}

export const enrollmentService = {
  enrollStudent,
};
