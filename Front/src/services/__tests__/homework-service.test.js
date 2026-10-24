import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  homeworkService,
  getHomeworks,
  createHomework,
  getSubmissions,
  getSubmissionRoster,
  createStudentSubmission,
  gradeSubmission,
  getSkillMapping,
  setSkillMapping,
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
      expect(api.post).toHaveBeenCalledWith('/homeworks', payload, {});
    });

    it('forwards an AbortSignal to the POST request', async () => {
      const payload = { courseId: 5, title: 'Test HW', dueAt: '2026-07-10T23:59:00Z' };
      const options = { signal: new AbortController().signal };
      api.post.mockResolvedValue({ data: {}, status: 201 });

      await createHomework(payload, options);

      expect(api.post).toHaveBeenCalledWith('/homeworks', payload, options);
    });
  });

  describe('getSubmissions', () => {
    it('calls GET /homeworks/{homeworkId}/submissions', async () => {
      api.get.mockResolvedValue({ data: { data: { submissions: [] } }, status: 200 });
      await getSubmissions(10);
      expect(api.get).toHaveBeenCalledWith('/homeworks/10/submissions', { params: {} });
    });
  });

  describe('teacher submissions', () => {
    it('loads the enrolled student roster for a homework', async () => {
      api.get.mockResolvedValue({ data: { data: { students: [] } }, status: 200 });
      await getSubmissionRoster(10);
      expect(api.get).toHaveBeenCalledWith('/homeworks/10/submission-roster', {});
    });

    it('creates or returns the submission for a selected student', async () => {
      api.post.mockResolvedValue({ data: { data: { submissionId: 20 } }, status: 200 });
      await createStudentSubmission(10, 7);
      expect(api.post).toHaveBeenCalledWith('/homeworks/10/students/7/submission', {});
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

  describe('skill mapping', () => {
    it('loads mapped topics for a homework', async () => {
      api.get.mockResolvedValue({ data: {}, status: 200 });
      await getSkillMapping(12);
      expect(api.get).toHaveBeenCalledWith('/homeworks/12/skill-topics');
    });

    it('saves mapped topic ids for a homework', async () => {
      api.put.mockResolvedValue({ data: {}, status: 200 });
      await setSkillMapping(12, [3, 4]);
      expect(api.put).toHaveBeenCalledWith('/homeworks/12/skill-topics', { topicIds: [3, 4] });
    });
  });

  describe('homeworkService object', () => {
    it('exposes homework and skill mapping functions', () => {
      expect(homeworkService.getHomeworks).toBe(getHomeworks);
      expect(homeworkService.createHomework).toBe(createHomework);
      expect(homeworkService.getSubmissions).toBe(getSubmissions);
      expect(homeworkService.getSubmissionRoster).toBe(getSubmissionRoster);
      expect(homeworkService.createStudentSubmission).toBe(createStudentSubmission);
      expect(homeworkService.gradeSubmission).toBe(gradeSubmission);
      expect(homeworkService.getSkillMapping).toBe(getSkillMapping);
      expect(homeworkService.setSkillMapping).toBe(setSkillMapping);
      expect(homeworkService).not.toHaveProperty('updateHomework');
    });
  });
});
