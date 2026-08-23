import { api } from './api';

export const getStudents = (params = {}, options = {}) => {
  return api.get('/students', { params, ...options });
}

export const getStudentById = (id, options = {}) => {
  return api.get(`/students/${id}`, options);
}

export const createStudent = payload => {
  return api.post('/students', payload);
}

export const updateStudent = (id, payload) => {
  return api.put(`/students/${id}`, payload);
}

export const getStudentQR = id => {
  return api.get(`/students/${id}/qr`);
}

export const studentService = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  getStudentQR,
};
