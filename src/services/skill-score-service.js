import { api } from './api';

export function getSkillTopics(courseId, params = {}) {
  return api.get('/skill-scores/topics', { params: { ...params, courseId } });
}

export function getSkillScores(studentId, params = {}) {
  return api.get(`/skill-scores/student/${studentId}`, { params });
}

export function batchUpdateSkillScores(payload) {
  return api.post('/skill-scores/batch-update', payload);
}

export const skillScoreService = {
  getSkillTopics,
  getSkillScores,
  batchUpdateSkillScores,
};
