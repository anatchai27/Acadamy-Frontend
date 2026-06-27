import { api } from './api';

export function scanAttendance(payload) {
  return api.post('/attendance/scan', payload);
}

export function getDailyAttendance(params = {}) {
  return api.get('/attendance/daily', { params });
}

export function submitManualAttendance(payload) {
  return api.post('/attendance/manual', payload);
}

export const attendanceService = {
  scanAttendance,
  getDailyAttendance,
  submitManualAttendance,
};
