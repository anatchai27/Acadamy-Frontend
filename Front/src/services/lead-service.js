import { api } from './api';

export const createPublicLead = payload => api.post('/public/leads', payload);
