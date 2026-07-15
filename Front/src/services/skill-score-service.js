import { api } from './api';

export function getSkillTopics(courseId, params = {}, options = {}) {
  return api.get('/skill-scores/topics', { params: { ...params, courseId }, ...options });
}

export function getSkillScores(studentId, params = {}, options = {}) {
  return api.get(`/skill-scores/student/${studentId}`, { params, ...options });
}

export function batchUpdateSkillScores(payload) {
  return api.post('/skill-scores/batch-update', payload);
}

export const skillScoreService = {
  getSkillTopics,
  getSkillScores,
  batchUpdateSkillScores,
};
