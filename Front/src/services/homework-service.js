import { api } from './api';

export function getHomeworks(courseId, params = {}, options = {}) {
  return api.get(`/homeworks/course/${courseId}`, { params, ...options });
}

export function createHomework(payload) {
  return api.post('/homeworks', payload);
}

export function getSubmissions(homeworkId, params = {}, options = {}) {
  return api.get(`/homeworks/${homeworkId}/submissions`, { params, ...options });
}

export function gradeSubmission(submissionId, payload) {
  return api.put(`/homeworks/submissions/${submissionId}/grade`, payload);
}

export const homeworkService = {
  getHomeworks,
  createHomework,
  getSubmissions,
  gradeSubmission,
};
