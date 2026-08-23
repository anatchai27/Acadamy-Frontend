import { api } from './api';

export const getTeachers = (params = {}, options = {}) => {
  return api.get('/teachers', { params, ...options });
}

export const getTeacherById = id => {
  return api.get(`/teachers/${id}`);
}

export const createTeacher = payload => {
  return api.post('/teachers', payload);
}

export const patchTeacher = (id, payload) => {
  return api.patch(`/teachers/${id}`, payload);
}

export const deleteTeacher = id => {
  return api.delete(`/teachers/${id}`);
}

export const teacherService = {
  getTeachers,
  getTeacherById,
  createTeacher,
  patchTeacher,
  deleteTeacher,
};
