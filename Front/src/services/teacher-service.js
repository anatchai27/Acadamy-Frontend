import { api } from './api';

export function getTeachers(params = {}, options = {}) {
  return api.get('/teachers', { params, ...options });
}

export function getTeacherById(id) {
  return api.get(`/teachers/${id}`);
}

export function createTeacher(payload) {
  return api.post('/teachers', payload);
}

export function updateTeacher(id, payload) {
  return api.put(`/teachers/${id}`, payload);
}

export function deleteTeacher(id) {
  return api.delete(`/teachers/${id}`);
}

export const teacherService = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
