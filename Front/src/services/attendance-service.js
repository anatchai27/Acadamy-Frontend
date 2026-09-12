import { api } from './api';

export const scanAttendance = payload => {
  return api.post('/attendance/scan', payload);
}

export const getDailyAttendance = (params = {}, options = {}) => {
  return api.get('/attendance/daily', { params, ...options });
}

export const submitManualAttendance = payload => {
  return api.post('/attendance/manual', payload);
}

export const getPickupAuthorizations = studentId => {
  return api.get(`/students/${studentId}/pickup-authorizations`);
}

export const checkoutAttendance = (attendanceId, payload) => {
  return api.post(`/attendance/${attendanceId}/checkout`, payload);
}

export const attendanceService = {
  scanAttendance,
  getDailyAttendance,
  submitManualAttendance,
  getPickupAuthorizations,
  checkoutAttendance,
};
