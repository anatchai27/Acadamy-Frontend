import { api } from './api';

export function getSessions(courseId, params = {}) {
  return api.get(`/courses/${courseId}/sessions`, { params });
}

export function createSession(courseId, payload) {
  return api.post(`/courses/${courseId}/sessions`, payload);
}

export const sessionService = {
  getSessions,
  createSession,
};
