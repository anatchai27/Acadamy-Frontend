import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  leaveRequestService,
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '../leave-request-service';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Leave Request Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeaveRequests', () => {
    it('calls GET /leave-requests with no params', async () => {
      api.get.mockResolvedValue({ data: { data: { requests: [] } }, status: 200 });
      await getLeaveRequests();
      expect(api.get).toHaveBeenCalledWith('/leave-requests', { params: {} });
    });

    it('passes status filter when provided', async () => {
      api.get.mockResolvedValue({ data: { data: { requests: [] } }, status: 200 });
      await getLeaveRequests({ status: 'pending' });
      expect(api.get).toHaveBeenCalledWith('/leave-requests', { params: { status: 'pending' } });
    });

    it('passes page and limit', async () => {
      api.get.mockResolvedValue({ data: { data: { requests: [] } }, status: 200 });
      await getLeaveRequests({ page: 2, limit: 10 });
      expect(api.get).toHaveBeenCalledWith('/leave-requests', { params: { page: 2, limit: 10 } });
    });
  });

  describe('approveLeaveRequest', () => {
    it('calls POST /leave-requests/{id}/approve', async () => {
      api.post.mockResolvedValue({ data: {}, status: 200 });
      await approveLeaveRequest(7);
      expect(api.post).toHaveBeenCalledWith('/leave-requests/7/approve');
    });
  });

  describe('rejectLeaveRequest', () => {
    it('calls POST /leave-requests/{id}/reject with NO body', async () => {
      api.post.mockResolvedValue({ data: {}, status: 200 });
      await rejectLeaveRequest(7);
      expect(api.post).toHaveBeenCalledWith('/leave-requests/7/reject');
      expect(api.post.mock.calls[0].length).toBe(1); // no second arg (body)
    });
  });

  describe('leaveRequestService object', () => {
    it('exposes all 4 functions', () => {
      expect(leaveRequestService.getLeaveRequests).toBe(getLeaveRequests);
      expect(leaveRequestService.approveLeaveRequest).toBe(approveLeaveRequest);
      expect(leaveRequestService.rejectLeaveRequest).toBe(rejectLeaveRequest);
    });
  });
});
