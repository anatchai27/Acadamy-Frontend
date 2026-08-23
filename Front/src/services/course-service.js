import { api } from './api';

export const getCourses = (params = {}, options = {}) => {
  return api.get('/courses', { params, ...options });
}

export const getCourseById = id => {
  return api.get(`/courses/${id}`);
}

export const createCourse = payload => {
  return api.post('/courses', payload);
}

export const updateCourse = (id, payload) => {
  return api.put(`/courses/${id}`, payload);
}

export const courseService = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
};
