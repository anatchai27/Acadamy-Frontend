import { api } from './api';

export const getLeaveRequests = (params = {}, options = {}) => {
  return api.get('/leave-requests', { params, ...options });
}

export const approveLeaveRequest = id => {
  return api.post(`/leave-requests/${id}/approve`);
}

export const rejectLeaveRequest = id => {
  return api.post(`/leave-requests/${id}/reject`);
}

export const leaveRequestService = {
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
};
