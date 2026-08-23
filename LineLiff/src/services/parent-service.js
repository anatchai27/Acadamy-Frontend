import { api } from './api';

export const bindLineUserId = (lineUserId, accessToken) => {
  return api.post('/parents/bind-line', { lineUserId, accessToken });
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

export const submitLeaveRequest = (childId, payload) => {
  return api.post(`/parents/children/${childId}/leave-requests`, payload);
}

export const getParentProfile = () => {
  return api.get('/parents/me/profile');
}

export const updateParentProfile = payload => {
  return api.patch('/parents/me/profile', payload);
}
