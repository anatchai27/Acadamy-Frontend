import { describe, expect, it } from 'vitest';
import { normalizePayment } from './payments';

describe('LIFF payment payload', () => {
  it('normalizes the parent payment contract including receipt URL', () => {
    expect(normalizePayment({ Id: 8, InvoiceNo: 'INV-8', Amount: '1200.50', ReceiptPdfUrl: 'https://storage.test/receipt.pdf' })).toEqual({
      id: 8,
      invoiceNo: 'INV-8',
      description: 'รายการชำระเงิน',
      date: '-',
      amount: 1200.5,
      status: 'unknown',
      receiptPdfUrl: 'https://storage.test/receipt.pdf',
    });
  });
});
