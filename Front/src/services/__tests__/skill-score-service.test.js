import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  skillScoreService,
  getSkillTopics,
  createSkillTopic,
  updateSkillTopic,
  deleteSkillTopic,
  getSkillScores,
  batchUpdateSkillScores,
} from '../skill-score-service';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Skill Score Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSkillTopics (spec: GET /skill-scores/topics?courseId=X)', () => {
    it('calls GET /skill-scores/topics with courseId query param', async () => {
      api.get.mockResolvedValue({ data: { data: { topics: [] } }, status: 200 });
      await getSkillTopics(5);
      expect(api.get).toHaveBeenCalledWith('/skill-scores/topics', { params: { courseId: 5 } });
    });

    it('merges extra params with courseId', async () => {
      api.get.mockResolvedValue({ data: { data: { topics: [] } }, status: 200 });
      await getSkillTopics(5, { sort: 'name' });
      expect(api.get).toHaveBeenCalledWith('/skill-scores/topics', { params: { sort: 'name', courseId: 5 } });
    });
  });

  describe('getSkillScores (spec: GET /skill-scores/student/{studentId})', () => {
    it('calls GET /skill-scores/student/{studentId}', async () => {
      api.get.mockResolvedValue({ data: { data: { scores: [] } }, status: 200 });
      await getSkillScores(42);
      expect(api.get).toHaveBeenCalledWith('/skill-scores/student/42', { params: {} });
    });
  });

  describe('skill topic mutations', () => {
    const payload = { courseId: 5, name: 'การสื่อสาร', nameEn: 'Communication', orderIndex: 1 };

    it('creates a skill topic with its Thai and English names', async () => {
      api.post.mockResolvedValue({ data: {}, status: 201 });
      await createSkillTopic(payload);
      expect(api.post).toHaveBeenCalledWith('/skill-scores/topics', payload);
    });

    it('updates a skill topic', async () => {
      api.put.mockResolvedValue({ data: {}, status: 200 });
      await updateSkillTopic(12, payload);
      expect(api.put).toHaveBeenCalledWith('/skill-scores/topics/12', payload);
    });

    it('deletes a skill topic', async () => {
      api.delete.mockResolvedValue({ data: {}, status: 200 });
      await deleteSkillTopic(12);
      expect(api.delete).toHaveBeenCalledWith('/skill-scores/topics/12');
    });
  });

  describe('batchUpdateSkillScores (spec: POST /skill-scores/batch-update)', () => {
    it('calls POST /skill-scores/batch-update with { studentId, scores }', async () => {
      const payload = {
        studentId: 99,
        scores: [
          { topicId: 1, score: 4.5, note: 'Good' },
          { topicId: 2, score: 3.0 },
        ],
      };
      api.post.mockResolvedValue({ data: {}, status: 200 });
      await batchUpdateSkillScores(payload);
      expect(api.post).toHaveBeenCalledWith('/skill-scores/batch-update', payload);
    });
  });

  describe('skillScoreService object', () => {
    it('exposes all service functions', () => {
      expect(skillScoreService.getSkillTopics).toBe(getSkillTopics);
      expect(skillScoreService.createSkillTopic).toBe(createSkillTopic);
      expect(skillScoreService.updateSkillTopic).toBe(updateSkillTopic);
      expect(skillScoreService.deleteSkillTopic).toBe(deleteSkillTopic);
      expect(skillScoreService.getSkillScores).toBe(getSkillScores);
      expect(skillScoreService.batchUpdateSkillScores).toBe(batchUpdateSkillScores);
    });
  });
});
