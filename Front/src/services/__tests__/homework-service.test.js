import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  homeworkService,
  getHomeworks,
  createHomework,
  getSubmissions,
  gradeSubmission,
} from '../homework-service';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('Homework Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHomeworks (spec: GET /homeworks/course/{courseId})', () => {
    it('calls GET /homeworks/course/{courseId} with courseId as path param', async () => {
      api.get.mockResolvedValue({ data: { data: { homeworks: [] } }, status: 200 });
      await getHomeworks(5);
      expect(api.get).toHaveBeenCalledWith('/homeworks/course/5', { params: {} });
    });

    it('passes extra params alongside courseId path param', async () => {
      api.get.mockResolvedValue({ data: { data: { homeworks: [] } }, status: 200 });
      await getHomeworks(5, { status: 'active' });
      expect(api.get).toHaveBeenCalledWith('/homeworks/course/5', { params: { status: 'active' } });
    });
  });

  describe('createHomework', () => {
    it('calls POST /homeworks with payload including dueAt', async () => {
      const payload = {
        courseId: 5,
        title: 'Test HW',
        description: 'desc',
        dueAt: '2026-07-10T23:59:00Z',
        fileUrl: 'https://example.com/file.pdf',
      };
      api.post.mockResolvedValue({ data: {}, status: 201 });
      await createHomework(payload);
      expect(api.post).toHaveBeenCalledWith('/homeworks', payload);
    });
  });

  describe('getSubmissions', () => {
    it('calls GET /homeworks/{homeworkId}/submissions', async () => {
      api.get.mockResolvedValue({ data: { data: { submissions: [] } }, status: 200 });
      await getSubmissions(10);
      expect(api.get).toHaveBeenCalledWith('/homeworks/10/submissions', { params: {} });
    });
  });

  describe('gradeSubmission (spec: PUT /homeworks/submissions/{submissionId}/grade)', () => {
    it('calls PUT with correct URL path', async () => {
      api.put.mockResolvedValue({ data: {}, status: 200 });
      await gradeSubmission(3, { score: 9.5, feedback: 'Good' });
      expect(api.put).toHaveBeenCalledWith('/homeworks/submissions/3/grade', { score: 9.5, feedback: 'Good' });
    });

    it('sends score without feedback when undefined', async () => {
      api.put.mockResolvedValue({ data: {}, status: 200 });
      await gradeSubmission(3, { score: 8 });
      expect(api.put).toHaveBeenCalledWith('/homeworks/submissions/3/grade', { score: 8 });
    });
  });

  describe('homeworkService object', () => {
    it('exposes 5 functions (no updateHomework)', () => {
      expect(homeworkService.getHomeworks).toBe(getHomeworks);
      expect(homeworkService.createHomework).toBe(createHomework);
      expect(homeworkService.getSubmissions).toBe(getSubmissions);
      expect(homeworkService.gradeSubmission).toBe(gradeSubmission);
      expect(homeworkService).not.toHaveProperty('updateHomework');
    });
  });
});
