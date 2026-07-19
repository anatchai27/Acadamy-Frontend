import { api } from './api';

export function createPayment(payload) {
  return api.post('/payments', payload);
}

export function getPayments(params = {}, options = {}) {
  return api.get('/payments', { params, ...options });
}

export const financeService = {
  createPayment,
  getPayments,
};
