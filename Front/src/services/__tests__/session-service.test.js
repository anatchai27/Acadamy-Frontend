import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  sessionService,
  getSessions,
  createSession,
  updateSession,
  replaceFutureSessions,
} from '../session-service';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Session Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessions', () => {
    it('calls GET /courses/{courseId}/sessions', async () => {
      api.get.mockResolvedValue({ data: { data: { sessions: [] } }, status: 200 });
      await getSessions(5);
      expect(api.get).toHaveBeenCalledWith('/courses/5/sessions', { params: {} });
    });

    it('passes extra params when provided', async () => {
      api.get.mockResolvedValue({ data: { data: { sessions: [] } }, status: 200 });
      await getSessions(5, { date: '2026-07-01' });
      expect(api.get).toHaveBeenCalledWith('/courses/5/sessions', { params: { date: '2026-07-01' } });
    });
  });

  describe('createSession', () => {
    it('calls POST /courses/{courseId}/sessions with payload', async () => {
      const payload = { scheduledAt: '2026-07-01T10:00:00Z', durationMin: 120, roomId: 'Room A' };
      api.post.mockResolvedValue({ data: {}, status: 201 });
      await createSession(5, payload);
      expect(api.post).toHaveBeenCalledWith('/courses/5/sessions', payload);
    });

    it('omits roomId when undefined', async () => {
      const payload = { scheduledAt: '2026-07-01T10:00:00Z', durationMin: 90, roomId: undefined };
      api.post.mockResolvedValue({ data: {}, status: 201 });
      await createSession(5, payload);
      expect(api.post).toHaveBeenCalledWith('/courses/5/sessions', {
        scheduledAt: '2026-07-01T10:00:00Z',
        durationMin: 90,
        roomId: undefined,
      });
    });
  });

  describe('updateSession', () => {
    it('calls PUT /courses/{courseId}/sessions/{sessionId} with updated schedule', async () => {
      const payload = { scheduledAt: '2026-07-02T10:00:00Z', durationMin: 90, roomId: 'Room A' };
      api.put.mockResolvedValue({ data: {}, status: 200 });
      await updateSession(5, 42, payload);
      expect(api.put).toHaveBeenCalledWith('/courses/5/sessions/42', payload);
    });
  });

  describe('replaceFutureSessions', () => {
    it('calls PUT /courses/{courseId}/sessions/replace-future with recurring rules', async () => {
      const payload = { startDate: '2026-07-01', endDate: '2026-07-31', rules: [] };
      api.put.mockResolvedValue({ data: {}, status: 200 });
      await replaceFutureSessions(5, payload);
      expect(api.put).toHaveBeenCalledWith('/courses/5/sessions/replace-future', payload);
    });
  });

  describe('sessionService object', () => {
    it('exposes session list, create, update, and replacement operations', () => {
      expect(sessionService.getSessions).toBe(getSessions);
      expect(sessionService.createSession).toBe(createSession);
      expect(sessionService.updateSession).toBe(updateSession);
      expect(sessionService.replaceFutureSessions).toBe(replaceFutureSessions);
    });
  });

  describe('no DELETE endpoint', () => {
    it('does not export deleteSession', () => {
      expect(sessionService).not.toHaveProperty('deleteSession');
    });
  });
});
