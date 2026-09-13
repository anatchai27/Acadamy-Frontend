import { api } from './api';

export const createPublicLead = payload => api.post('/public/leads', payload);
export const getLeads = (params = {}) => api.get('/leads', { params });
export const updateLeadFollowUp = (id, payload) => api.put(`/leads/${id}/follow-up`, payload);
