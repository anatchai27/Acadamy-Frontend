import { api } from './api';

export async function bindLineUserId(lineUserId, accessToken) {
  return api.post('/parents/bind-line', { lineUserId, accessToken });
}

export async function getParentDashboard() {
  return api.get('/parents/me/dashboard');
}

export async function getChildAttendance(childId, params = {}) {
  return api.get(`/parents/children/${childId}/attendance`, { params });
}

export async function getChildPayments(childId, params = {}) {
  return api.get(`/parents/children/${childId}/payments`, { params });
}

export async function getChildScores(childId) {
  return api.get(`/parents/children/${childId}/scores`);
}

export async function getChildHomework(childId) {
  return api.get(`/parents/children/${childId}/homework`);
}

export async function submitLeaveRequest(childId, payload) {
  return api.post(`/parents/children/${childId}/leave-requests`, payload);
}

export async function getParentProfile() {
  return api.get('/parents/me/profile');
}

export async function updateParentProfile(payload) {
  return api.patch('/parents/me/profile', payload);
}