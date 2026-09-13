import { api } from './api';

export const getHomeworks = (courseId, params = {}, options = {}) => {
  return api.get(`/homeworks/course/${courseId}`, { params, ...options });
}

export const createHomework = payload => {
  return api.post('/homeworks', payload);
}

export const getSubmissions = (homeworkId, params = {}, options = {}) => {
  return api.get(`/homeworks/${homeworkId}/submissions`, { params, ...options });
}

export const gradeSubmission = (submissionId, payload) => {
  return api.put(`/homeworks/submissions/${submissionId}/grade`, payload);
}

export const getSkillMapping = homeworkId => api.get(`/homeworks/${homeworkId}/skill-topics`);

export const setSkillMapping = (homeworkId, topicIds) => api.put(`/homeworks/${homeworkId}/skill-topics`, { topicIds });

export const homeworkService = {
  getHomeworks,
  createHomework,
  getSubmissions,
  gradeSubmission,
  getSkillMapping,
  setSkillMapping,
};
