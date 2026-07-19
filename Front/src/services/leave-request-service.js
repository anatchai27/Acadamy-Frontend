import { api } from './api';

export function getLeaveRequests(params = {}, options = {}) {
  return api.get('/leave-requests', { params, ...options });
}

export function approveLeaveRequest(id) {
  return api.post(`/leave-requests/${id}/approve`);
}

export function rejectLeaveRequest(id) {
  return api.post(`/leave-requests/${id}/reject`);
}

export const leaveRequestService = {
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
};
