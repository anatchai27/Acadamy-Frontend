import { api } from './api';

export function getStudents(params = {}, options = {}) {
  return api.get('/students', { params, ...options });
}

export function getStudentById(id, options = {}) {
  return api.get(`/students/${id}`, options);
}

export function createStudent(payload) {
  return api.post('/students', payload);
}

export function updateStudent(id, payload) {
  return api.put(`/students/${id}`, payload);
}

export function getStudentQR(id) {
  return api.get(`/students/${id}/qr`);
}

export const studentService = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  getStudentQR,
};
