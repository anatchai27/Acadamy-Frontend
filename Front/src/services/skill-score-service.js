import { api } from './api';

export const getSkillTopics = (courseId, params = {}, options = {}) => {
  return api.get('/skill-scores/topics', { params: { ...params, courseId }, ...options });
}

export const getSkillScores = (studentId, params = {}, options = {}) => {
  return api.get(`/skill-scores/student/${studentId}`, { params, ...options });
}

export const batchUpdateSkillScores = payload => {
  return api.post('/skill-scores/batch-update', payload);
}

export const skillScoreService = {
  getSkillTopics,
  getSkillScores,
  batchUpdateSkillScores,
};
