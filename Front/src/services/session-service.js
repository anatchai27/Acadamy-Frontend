import { api } from './api';

export function getSessions(courseId, params = {}, options = {}) {
  return api.get(`/courses/${courseId}/sessions`, { params, ...options });
}

export function createSession(courseId, payload) {
  return api.post(`/courses/${courseId}/sessions`, payload);
}

export const sessionService = {
  getSessions,
  createSession,
};
