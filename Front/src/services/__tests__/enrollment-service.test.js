import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import { enrollmentService, getEnrollments, enrollStudent } from '../enrollment-service';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
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

  describe('getEnrollments', () => {
    it('loads a student actual enrollment records', async () => {
      api.get.mockResolvedValue({ data: { data: { enrollments: [] } }, status: 200 });
      await getEnrollments(17);
      expect(api.get).toHaveBeenCalledWith('/enrollments', { params: { studentId: 17 } });
    });
  });

  describe('enrollmentService object', () => {
    it('exposes enrollStudent', () => {
      expect(enrollmentService.getEnrollments).toBe(getEnrollments);
      expect(enrollmentService.enrollStudent).toBe(enrollStudent);
    });
  });
});
