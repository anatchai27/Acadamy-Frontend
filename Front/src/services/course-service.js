import { api } from './api';

export function getCourses(params = {}, options = {}) {
  return api.get('/courses', { params, ...options });
}

export function getCourseById(id) {
  return api.get(`/courses/${id}`);
}

export function createCourse(payload) {
  return api.post('/courses', payload);
}

export function updateCourse(id, payload) {
  return api.put(`/courses/${id}`, payload);
}

export const courseService = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
};
