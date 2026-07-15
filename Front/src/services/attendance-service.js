import { api } from './api';

export function scanAttendance(payload) {
  return api.post('/attendance/scan', payload);
}

export function getDailyAttendance(params = {}, options = {}) {
  return api.get('/attendance/daily', { params, ...options });
}

export function submitManualAttendance(payload) {
  return api.post('/attendance/manual', payload);
}

export const attendanceService = {
  scanAttendance,
  getDailyAttendance,
  submitManualAttendance,
};
