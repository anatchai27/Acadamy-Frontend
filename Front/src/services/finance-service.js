import { api } from './api';

export const createPayment = (payload) => {
  return api.post('/payments', payload);
};

export const getPayments = (params = {}, options = {}) => {
  return api.get('/payments', { params, ...options });
};

export const verifyPaymentSlip = (paymentId, options = {}) => {
  return api.post(`/payments/${paymentId}/verify-slip`, {}, options);
};

export const issuePaymentReceipt = (paymentId, options = {}) => {
  return api.post(`/payments/${paymentId}/issue-receipt`, {}, options);
};

export const financeService = {
  createPayment,
  getPayments,
  verifyPaymentSlip,
  issuePaymentReceipt,
};
