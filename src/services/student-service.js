import { api } from './api';

export function getStudents(params = {}) {
  return api.get('/students', { params });
}

export function getStudentById(id) {
  return api.get(`/students/${id}`);
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
