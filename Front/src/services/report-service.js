import { api } from './api';

export const getRevenueReport = (params, options = {}) => api.get('/reports/revenue', { params, ...options });

export const downloadPaymentCsv = (params = {}, options = {}) => api.download('/payments/export', { params, ...options });

export const reportService = { getRevenueReport, downloadPaymentCsv };
