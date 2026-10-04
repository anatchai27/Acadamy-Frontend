import { api } from './api';

export const getSkillTopics = (courseId, params = {}, options = {}) => {
  return api.get('/skill-scores/topics', { params: { ...params, courseId }, ...options });
};

export const createSkillTopic = (payload) => {
  return api.post('/skill-scores/topics', payload);
};

export const updateSkillTopic = (id, payload) => {
  return api.put(`/skill-scores/topics/${id}`, payload);
};

export const deleteSkillTopic = (id) => {
  return api.delete(`/skill-scores/topics/${id}`);
};

export const getSkillScores = (studentId, params = {}, options = {}) => {
  return api.get(`/skill-scores/student/${studentId}`, { params, ...options });
};

export const batchUpdateSkillScores = (payload) => {
  return api.post('/skill-scores/batch-update', payload);
};

export const skillScoreService = {
  getSkillTopics,
  createSkillTopic,
  updateSkillTopic,
  deleteSkillTopic,
  getSkillScores,
  batchUpdateSkillScores,
};
