import { api } from './api';

export const getSessions = (courseId, params = {}, options = {}) => {
  return api.get(`/courses/${courseId}/sessions`, { params, ...options });
}

export const createSession = (courseId, payload) => {
  return api.post(`/courses/${courseId}/sessions`, payload);
}

export const createRecurringSessions = (courseId, payload) => {
  return api.post(`/courses/${courseId}/sessions/recurring`, payload);
}

export const sessionService = {
  getSessions,
  createSession,
  createRecurringSessions,
};
