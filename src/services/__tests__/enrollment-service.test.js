import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  enrollmentService,
  enrollStudent,
} from '../enrollment-service';

vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('Enrollment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enrollStudent', () => {
    it('calls POST /enrollments with { studentId, courseId }', async () => {
      const payload = { studentId: 1, courseId: 2 };
      api.post.mockResolvedValue({ data: {}, status: 201 });
      await enrollStudent(payload);
      expect(api.post).toHaveBeenCalledWith('/enrollments', payload);
    });
  });

  describe('enrollmentService object', () => {
    it('exposes enrollStudent', () => {
      expect(enrollmentService.enrollStudent).toBe(enrollStudent);
    });
  });
});
