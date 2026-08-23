import { api } from './api';

export const createPayment = payload => {
  return api.post('/payments', payload);
}

export const getPayments = (params = {}, options = {}) => {
  return api.get('/payments', { params, ...options });
}

export const financeService = {
  createPayment,
  getPayments,
};
