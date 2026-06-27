import { api } from './api';

export function createPayment(payload) {
  return api.post('/payments', payload);
}

export function getPayments(params = {}) {
  return api.get('/payments', { params });
}

export function getPaymentById(id) {
  return api.get(`/payments/${id}`);
}

export const financeService = {
  createPayment,
  getPayments,
  getPaymentById,
};
