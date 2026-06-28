import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  courseService,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
} from '../course-service';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Course Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCourses', () => {
    it('calls GET /courses with no params by default', async () => {
      api.get.mockResolvedValue({ data: { data: { courses: [] } }, status: 200 });
      await getCourses();
      expect(api.get).toHaveBeenCalledWith('/courses', { params: {} });
    });

    it('passes search param when provided', async () => {
      api.get.mockResolvedValue({ data: { data: { courses: [] } }, status: 200 });
      await getCourses({ search: 'math' });
      expect(api.get).toHaveBeenCalledWith('/courses', { params: { search: 'math' } });
    });

    it('passes teacher_id param when provided', async () => {
      api.get.mockResolvedValue({ data: { data: { courses: [] } }, status: 200 });
      await getCourses({ teacher_id: 5 });
      expect(api.get).toHaveBeenCalledWith('/courses', { params: { teacher_id: 5 } });
    });
  });

  describe('getCourseById', () => {
    it('calls GET /courses/{id}', async () => {
      api.get.mockResolvedValue({ data: {}, status: 200 });
      await getCourseById(42);
      expect(api.get).toHaveBeenCalledWith('/courses/42');
    });
  });

  describe('createCourse', () => {
    it('calls POST /courses with payload', async () => {
      const payload = { name: 'Math', subject: 'คณิตศาสตร์', totalSessions: 20, price: 5000, teacherId: 1 };
      api.post.mockResolvedValue({ data: {}, status: 201 });
      await createCourse(payload);
      expect(api.post).toHaveBeenCalledWith('/courses', payload);
    });
  });

  describe('updateCourse', () => {
    it('calls PUT /courses/{id} with payload', async () => {
      const payload = { name: 'Math v2' };
      api.put.mockResolvedValue({ data: {}, status: 200 });
      await updateCourse(10, payload);
      expect(api.put).toHaveBeenCalledWith('/courses/10', payload);
    });
  });

  describe('courseService object', () => {
    it('exposes all 4 functions', () => {
      expect(courseService.getCourses).toBe(getCourses);
      expect(courseService.getCourseById).toBe(getCourseById);
      expect(courseService.createCourse).toBe(createCourse);
      expect(courseService.updateCourse).toBe(updateCourse);
    });
  });
});
