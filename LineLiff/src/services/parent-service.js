import { api } from './api';

export const bindLineUserId = (lineUserId, accessToken, phone = '') => {
  return api.post('/parents/bind-line', { lineUserId, accessToken, phone });
}

export const getParentDashboard = () => {
  return api.get('/parents/me/dashboard');
}

export const getChildAttendance = (childId, params = {}) => {
  return api.get(`/parents/children/${childId}/attendance`, { params });
}

export const getChildPayments = (childId, params = {}) => {
  return api.get(`/parents/children/${childId}/payments`, { params });
}

export const getChildScores = childId => {
  return api.get(`/parents/children/${childId}/scores`);
}

export const getChildHomework = childId => {
  return api.get(`/parents/children/${childId}/homework`);
}

export const getChildSessions = childId => {
  return api.get(`/parents/children/${childId}/sessions`);
}

export const getChildLeaveRequests = childId => {
  return api.get(`/parents/children/${childId}/leave-requests`);
}

export const createChildLeaveRequest = (childId, payload) => {
  return api.post(`/parents/children/${childId}/leave-requests`, payload);
}

export const getMakeupCredits = childId => {
  return api.get('/makeup/credits', { params: { student_id: childId } });
}

export const getMakeupSlots = params => {
  return api.get('/makeup/slots', { params });
}

export const createMakeupBooking = payload => {
  return api.post('/makeup/bookings', payload);
}

export const cancelMakeupBooking = bookingId => {
  return api.delete(`/makeup/bookings/${bookingId}`);
}

export const submitLeaveRequest = (childId, payload) => {
  return api.post(`/parents/children/${childId}/leave-requests`, payload);
}

export const getParentProfile = () => {
  return api.get('/parents/me/profile');
}

export const updateParentProfile = payload => {
  return api.patch('/parents/me/profile', payload);
}
