import { api } from './api';

export const getSessions = (courseId, params = {}, options = {}) => {
  return api.get(`/courses/${courseId}/sessions`, { params, ...options });
}

export const createSession = (courseId, payload) => {
  return api.post(`/courses/${courseId}/sessions`, payload);
}

export const updateSession = (courseId, sessionId, payload) => {
  return api.put(`/courses/${courseId}/sessions/${sessionId}`, payload);
}

export const createRecurringSessions = (courseId, payload) => {
  return api.post(`/courses/${courseId}/sessions/recurring`, payload);
}

export const replaceFutureSessions = (courseId, payload) => {
  return api.put(`/courses/${courseId}/sessions/replace-future`, payload);
}

export const sessionService = {
  getSessions,
  createSession,
  updateSession,
  createRecurringSessions,
  replaceFutureSessions,
};
