import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import {
  createPayment,
  createPaymentBatch,
  getPayments,
  financeService,
  verifyPaymentSlip,
  verifyPaymentBatchSlip,
  issuePaymentReceipt,
  issuePaymentBatchReceipt,
} from '../finance-service';

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

  it('creates a consolidated payment batch', async () => {
    const payload = {
      method: 'transfer',
      allocations: [
        { enrollmentId: 12, amount: 500 },
        { enrollmentId: 18, amount: 1200 },
      ],
    };
    await createPaymentBatch(payload);
    expect(api.post).toHaveBeenCalledWith('/payment-batches', payload);
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

  it('verifies one slip for a consolidated payment batch', async () => {
    await verifyPaymentBatchSlip(42);
    expect(api.post).toHaveBeenCalledWith('/payment-batches/42/verify-slip', {}, {});
  });

  it('retries receipt generation for an already settled payment', async () => {
    await issuePaymentReceipt(42);
    expect(api.post).toHaveBeenCalledWith('/payments/42/issue-receipt', {}, {});
  });

  it('retries receipt generation for a settled payment batch', async () => {
    await issuePaymentBatchReceipt(42);
    expect(api.post).toHaveBeenCalledWith('/payment-batches/42/issue-receipt', {}, {});
  });

  it('exposes verification through the service object', () => {
    expect(financeService.verifyPaymentSlip).toBe(verifyPaymentSlip);
    expect(financeService.issuePaymentReceipt).toBe(issuePaymentReceipt);
    expect(financeService.createPaymentBatch).toBe(createPaymentBatch);
    expect(financeService.verifyPaymentBatchSlip).toBe(verifyPaymentBatchSlip);
    expect(financeService.issuePaymentBatchReceipt).toBe(issuePaymentBatchReceipt);
  });
});
