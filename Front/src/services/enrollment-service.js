import { api } from './api';

export const getEnrollments = (studentId, options = {}) => {
  return api.get('/enrollments', { params: { studentId }, ...options });
};

export const getCourseEnrollments = (courseId, options = {}) => {
  return api.get('/enrollments/course', { params: { courseId }, ...options });
};

export const enrollStudent = (payload) => {
  return api.post('/enrollments', payload);
};

export const enrollmentService = {
  getEnrollments,
  getCourseEnrollments,
  enrollStudent,
};
