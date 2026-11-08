import { api } from './api';

export const createPayment = (payload) => {
  return api.post('/payments', payload);
};

export const createPaymentBatch = (payload) => api.post('/payment-batches', payload);

export const getPayments = (params = {}, options = {}) => {
  return api.get('/payments', { params, ...options });
};

export const getPendingSlipReviews = (options = {}) =>
  api.get('/payments/pending-slips', options);

export const verifyPaymentSlip = (paymentId, options = {}) => {
  return api.post(`/payments/${paymentId}/verify-slip`, {}, options);
};

export const verifyPaymentBatchSlip = (batchId, options = {}) =>
  api.post(`/payment-batches/${batchId}/verify-slip`, {}, options);

export const confirmPaymentManually = (paymentId, options = {}) =>
  api.post(`/payments/${paymentId}/confirm-manual`, {}, options);

export const confirmPaymentBatchManually = (batchId, options = {}) =>
  api.post(`/payment-batches/${batchId}/confirm-manual`, {}, options);

export const issuePaymentReceipt = (paymentId, options = {}) => {
  return api.post(`/payments/${paymentId}/issue-receipt`, {}, options);
};

export const issuePaymentBatchReceipt = (batchId, options = {}) =>
  api.post(`/payment-batches/${batchId}/issue-receipt`, {}, options);

export const financeService = {
  createPayment,
  createPaymentBatch,
  getPayments,
  getPendingSlipReviews,
  verifyPaymentSlip,
  verifyPaymentBatchSlip,
  confirmPaymentManually,
  confirmPaymentBatchManually,
  issuePaymentReceipt,
  issuePaymentBatchReceipt,
};
