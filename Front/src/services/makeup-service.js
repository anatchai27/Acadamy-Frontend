import { api } from './api';

export const getMakeupSlots = (params = {}, options = {}) => api.get('/makeup/slots', { params, ...options });
export const createMakeupSlot = payload => api.post('/makeup/slots', payload);
export const cancelMakeupSlot = slotId => api.post(`/makeup/slots/${slotId}/cancel`, {});

export const makeupService = { getMakeupSlots, createMakeupSlot, cancelMakeupSlot };
