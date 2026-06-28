import { api } from './api';

export function getHomeworks(courseId, params = {}) {
  return api.get(`/homeworks/course/${courseId}`, { params });
}

export function getHomeworkById(id) {
  return api.get(`/homeworks/${id}`);
}

export function createHomework(payload) {
  return api.post('/homeworks', payload);
}

export function getSubmissions(homeworkId, params = {}) {
  return api.get(`/homeworks/${homeworkId}/submissions`, { params });
}

export function gradeSubmission(submissionId, payload) {
  return api.put(`/homeworks/submissions/${submissionId}/grade`, payload);
}

export const homeworkService = {
  getHomeworks,
  getHomeworkById,
  createHomework,
  getSubmissions,
  gradeSubmission,
};
