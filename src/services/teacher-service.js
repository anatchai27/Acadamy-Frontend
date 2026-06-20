import { api } from './api';

export function getTeachers(params = {}) {
  return api.get('/teachers', { params });
}

export function getTeacherById(id) {
  return api.get(`/teachers/${id}`);
}

export function createTeacher(payload) {
  return api.post('/teachers', payload);
}

export const teacherService = {
  getTeachers,
  getTeacherById,
  createTeacher,
};
