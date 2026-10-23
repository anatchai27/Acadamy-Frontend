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

export const deleteStudent = id => api.delete(`/students/${id}`);

export const getPickupAuthorizations = (studentId, options = {}) =>
  api.get(`/students/${studentId}/pickup-authorizations`, options);

export const createPickupAuthorization = (studentId, payload) =>
  api.post(`/students/${studentId}/pickup-authorizations`, payload);

export const updatePickupAuthorization = (studentId, authorizationId, payload) =>
  api.patch(`/students/${studentId}/pickup-authorizations/${authorizationId}`, payload);

export const deletePickupAuthorization = (studentId, authorizationId) =>
  api.delete(`/students/${studentId}/pickup-authorizations/${authorizationId}`);

export const getStudentQR = id => {
  return api.get(`/students/${id}/qr`);
}

export const getStudentCardPdf = id => {
  return api.download(`/students/${id}/card.pdf`);
}

export const downloadStudentCsv = () => api.download('/students/export', { params: { format: 'csv' } });

export const studentService = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentQR,
  getStudentCardPdf,
  downloadStudentCsv,
  getPickupAuthorizations,
  createPickupAuthorization,
  updatePickupAuthorization,
  deletePickupAuthorization,
};
