import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePayment, PaymentsPage } from './payments';

const services = vi.hoisted(() => ({
  createChildPaymentBatch: vi.fn(),
  getChildPayableBalances: vi.fn(),
  getChildPayments: vi.fn(),
  uploadPaymentBatchSlip: vi.fn(),
  uploadPaymentSlip: vi.fn(),
}));

vi.mock('../services/parent-service', () => services);
vi.mock('../store/LiffContext', () => ({
  useLiffContext: () => ({
    state: {
      parentToken: 'parent-token',
      activeChildId: 20,
      children: [{ id: 20, fullName: 'น้องมะลิ' }],
    },
  }),
}));
vi.mock('../utils/image-compression', () => ({
  compressImageFile: vi.fn(file => Promise.resolve(file)),
}));

beforeEach(() => {
  vi.clearAllMocks();
  services.getChildPayments.mockResolvedValue({ data: { data: [] } });
  services.getChildPayableBalances.mockResolvedValue({
    data: {
      data: [{ enrollmentId: 45, studentId: 20, courseName: 'คณิตศาสตร์ ป.4', amountDue: 1250 }],
    },
  });
  services.createChildPaymentBatch.mockResolvedValue({
    data: { data: { batchId: 81, invoiceNo: 'INV-81', amount: 1250 } },
  });
  services.uploadPaymentBatchSlip.mockResolvedValue({ data: { status: 'success' } });
  services.uploadPaymentSlip.mockResolvedValue({ data: { status: 'success' } });
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:slip-preview') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});

afterEach(() => cleanup());

describe('LIFF payment payload', () => {
  it('normalizes the parent payment contract including receipt URL', () => {
    expect(normalizePayment({ Id: 8, InvoiceNo: 'INV-8', Amount: '1200.50', ReceiptPdfUrl: 'https://storage.test/receipt.pdf' })).toEqual({
      id: 8,
      batchId: null,
      invoiceNo: 'INV-8',
      description: 'รายการชำระเงิน',
      date: '-',
      amount: 1200.5,
      status: 'unknown',
      slipUrl: '',
      receiptPdfUrl: 'https://storage.test/receipt.pdf',
    });
  });

  it('lets a parent create a transfer bill and submit a slip from LIFF', async () => {
    const { container } = render(<PaymentsPage childId="20" />);

    await screen.findByText('คณิตศาสตร์ ป.4');
    fireEvent.click(screen.getByRole('button', { name: 'ชำระเงิน' }));

    await screen.findByText('INV-81');
    expect(services.createChildPaymentBatch).toHaveBeenCalledWith(20, 45);
    expect(screen.getByText('ยอดโอน ฿1,250.00')).toBeInTheDocument();

    const slipInput = container.querySelector('#payment-slip');
    fireEvent.change(slipInput, {
      target: { files: [new File(['slip'], 'transfer.png', { type: 'image/png' })] },
    });

    const submitButton = await screen.findByRole('button', { name: 'ส่งสลิปให้สถาบันตรวจสอบ' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    await screen.findByText('ส่งสลิปแล้ว รายการกำลังรอสถาบันตรวจสอบ');
    expect(services.uploadPaymentBatchSlip).toHaveBeenCalledWith(81, expect.any(File));
  });

  it('lets a parent attach a slip to an existing single transfer payment', async () => {
    services.getChildPayments.mockResolvedValue({
      data: { data: [{ id: 44, invoiceNo: 'INV-44', description: 'คณิตศาสตร์', amount: 500, status: 'pending' }] },
    });
    services.getChildPayableBalances.mockResolvedValue({ data: { data: [] } });
    const { container } = render(<PaymentsPage childId="20" />);

    fireEvent.click(await screen.findByRole('button', { name: 'แนบสลิป' }));
    const slipInput = container.querySelector('#payment-slip');
    fireEvent.change(slipInput, {
      target: { files: [new File(['slip'], 'transfer.png', { type: 'image/png' })] },
    });
    const submitButton = await screen.findByRole('button', { name: 'ส่งสลิปให้สถาบันตรวจสอบ' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    await screen.findByText('ส่งสลิปแล้ว รายการกำลังรอสถาบันตรวจสอบ');
    expect(services.uploadPaymentSlip).toHaveBeenCalledWith(44, expect.any(File));
  });
});
