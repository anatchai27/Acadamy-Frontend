import { api } from './api';

export function getLeaveRequests(params = {}) {
  return api.get('/leave-requests', { params });
}

export function getLeaveRequestById(id) {
  return api.get(`/leave-requests/${id}`);
}

export function approveLeaveRequest(id) {
  return api.post(`/leave-requests/${id}/approve`);
}

export function rejectLeaveRequest(id) {
  return api.post(`/leave-requests/${id}/reject`);
}

export const leaveRequestService = {
  getLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
};
