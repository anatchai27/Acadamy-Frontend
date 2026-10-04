import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import { createPayment, getPayments, financeService, verifyPaymentSlip, issuePaymentReceipt } from '../finance-service';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Finance Service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a payment', async () => {
    const payload = { enrollmentId: 12, amount: 500, method: 'cash' };
    await createPayment(payload);
    expect(api.post).toHaveBeenCalledWith('/payments', payload);
  });

  it('loads payment history with query parameters', async () => {
    const params = { page: 2, limit: 20 };
    await getPayments(params);
    expect(api.get).toHaveBeenCalledWith('/payments', { params });
  });

  it('requests slip verification for a payment', async () => {
    await verifyPaymentSlip(42);
    expect(api.post).toHaveBeenCalledWith('/payments/42/verify-slip', {}, {});
  });

  it('retries receipt generation for an already settled payment', async () => {
    await issuePaymentReceipt(42);
    expect(api.post).toHaveBeenCalledWith('/payments/42/issue-receipt', {}, {});
  });

  it('exposes verification through the service object', () => {
    expect(financeService.verifyPaymentSlip).toBe(verifyPaymentSlip);
    expect(financeService.issuePaymentReceipt).toBe(issuePaymentReceipt);
  });
});
