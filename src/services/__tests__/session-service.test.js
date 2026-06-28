import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  sessionService,
  getSessions,
  createSession,
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

  describe('sessionService object', () => {
    it('exposes getSessions and createSession', () => {
      expect(sessionService.getSessions).toBe(getSessions);
      expect(sessionService.createSession).toBe(createSession);
    });
  });

  describe('no PUT/DELETE endpoints', () => {
    it('does not export updateSession', () => {
      expect(sessionService).not.toHaveProperty('updateSession');
    });

    it('does not export deleteSession', () => {
      expect(sessionService).not.toHaveProperty('deleteSession');
    });
  });
});
