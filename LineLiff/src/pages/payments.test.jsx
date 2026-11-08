import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePayment, PaymentsPage } from './payments';

const services = vi.hoisted(() => ({
  createChildPaymentBatch: vi.fn(),
  createChildOnlinePaymentBatch: vi.fn(),
  getChildPayableBalances: vi.fn(),
  getChildPayments: vi.fn(),
  uploadPaymentBatchSlip: vi.fn(),
  uploadPaymentSlip: vi.fn(),
  refreshChildOnlinePaymentStatus: vi.fn(),
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
  services.createChildOnlinePaymentBatch.mockResolvedValue({
    data: { status: 'success', message: 'รายการพร้อมชำระ', data: { batchId: 91, invoiceNo: 'INV-91', amount: 1250, status: 'pending' } },
  });
  services.refreshChildOnlinePaymentStatus.mockResolvedValue({
    data: { status: 'success', message: 'ชำระสำเร็จแล้ว', data: { batchId: 91, status: 'succeeded' } },
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
      method: 'transfer',
      slipUrl: '',
      receiptPdfUrl: 'https://storage.test/receipt.pdf',
      instituteName: '',
      instituteContactPhone: '',
      bankName: '',
      bankAccountName: '',
      bankAccountNumber: '',
      promptPayId: '',
      paymentInstructions: '',
      paymentQrImageUrl: '',
      gatewayQrUrl: '',
      checkoutUrl: '',
      gatewayExpiresAt: '',
      installmentBank: '',
      installmentTerm: null,
    });
  });

  it('normalizes institute transfer instructions for parent checkout', () => {
    expect(normalizePayment({
      BankName: 'ธนาคารตัวอย่าง',
      BankAccountName: 'โรงเรียนตัวอย่าง',
      BankAccountNumber: '1234567890',
      PromptPayId: '0812345678',
      PaymentInstructions: 'ใส่เลขอ้างอิงในหมายเหตุ',
      PaymentQrImageUrl: 'https://storage.test/qr.png',
    })).toMatchObject({
      bankName: 'ธนาคารตัวอย่าง',
      bankAccountName: 'โรงเรียนตัวอย่าง',
      bankAccountNumber: '1234567890',
      promptPayId: '0812345678',
      paymentInstructions: 'ใส่เลขอ้างอิงในหมายเหตุ',
      paymentQrImageUrl: 'https://storage.test/qr.png',
    });
  });

  it('lets a parent create a transfer bill and submit a slip from LIFF', async () => {
    services.getChildPayableBalances.mockResolvedValue({
      data: {
        data: [{
          enrollmentId: 45,
          studentId: 20,
          courseName: 'คณิตศาสตร์ ป.4',
          amountDue: 1250,
          instituteName: 'โรงเรียนตัวอย่าง',
          bankName: 'ธนาคารตัวอย่าง',
          bankAccountName: 'โรงเรียนตัวอย่าง',
          bankAccountNumber: '1234567890',
        }],
      },
    });
    const { container } = render(<PaymentsPage childId="20" />);

    await screen.findByText('คณิตศาสตร์ ป.4');
    fireEvent.click(screen.getByRole('button', { name: 'ชำระเงิน' }));

    await screen.findByText('INV-81');
    expect(services.createChildPaymentBatch).toHaveBeenCalledWith(20, 45, 1250);
    expect(screen.getByText('ยอดชำระ ฿1,250.00')).toBeInTheDocument();
    expect(screen.getByText('ธนาคารตัวอย่าง')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();

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

  it('lets a parent create a bill for only part of the remaining balance', async () => {
    services.getChildPayableBalances.mockResolvedValue({
      data: {
        data: [{
          enrollmentId: 45,
          studentId: 20,
          courseName: 'คณิตศาสตร์ ป.4',
          amountDue: 1250,
          bankAccountNumber: '1234567890',
        }],
      },
    });
    services.createChildPaymentBatch.mockResolvedValue({
      data: { data: { batchId: 82, invoiceNo: 'INV-82', amount: 400 } },
    });
    render(<PaymentsPage childId="20" />);

    const amountInput = await screen.findByRole('spinbutton', { name: 'จำนวนเงินที่ต้องการชำระ คณิตศาสตร์ ป.4' });
    expect(amountInput).toHaveValue(1250);
    fireEvent.input(amountInput, { target: { value: '400' } });
    fireEvent.click(screen.getByRole('button', { name: 'ชำระเงิน' }));

    await screen.findByText('ยอดชำระ ฿400.00');
    expect(services.createChildPaymentBatch).toHaveBeenCalledWith(20, 45, 400);
  });

  it('does not create a payment batch before the institute configures a transfer destination', async () => {
    render(<PaymentsPage childId="20" />);

    await screen.findByText('คณิตศาสตร์ ป.4');

    expect(screen.queryByRole('button', { name: 'ชำระเงิน' })).not.toBeInTheDocument();
    expect(screen.getByText('สถาบันยังไม่ได้ตั้งค่าบัญชีรับโอน')).toHaveAttribute('role', 'status');
    expect(screen.getByText('สถาบันยังไม่ได้ตั้งค่าช่องทางรับชำระเงิน')).toBeInTheDocument();
    expect(screen.getByText(/จึงยังชำระรายการที่มียอดค้างผ่านระบบไม่ได้/)).toBeInTheDocument();
  });

  it('lets a parent pay with a static QR as the only configured transfer destination', async () => {
    services.getChildPayableBalances.mockResolvedValue({
      data: {
        data: [{
          enrollmentId: 45,
          studentId: 20,
          courseName: 'คณิตศาสตร์ ป.4',
          amountDue: 1250,
          instituteName: 'โรงเรียนตัวอย่าง',
          paymentQrImageUrl: 'https://storage.test/payment-qr.png',
        }],
      },
    });
    render(<PaymentsPage childId="20" />);

    await screen.findByText('คณิตศาสตร์ ป.4');
    fireEvent.click(screen.getByRole('button', { name: 'ชำระเงิน' }));

    const qr = await screen.findByRole('img', { name: 'QR Code สำหรับชำระเงินให้โรงเรียนตัวอย่าง' });
    expect(qr).toHaveAttribute('src', 'https://storage.test/payment-qr.png');
    expect(screen.queryByText('สถาบันยังไม่ได้ระบุบัญชีรับโอน กรุณาติดต่อสถาบันก่อนชำระเงิน')).not.toBeInTheDocument();
  });

  it('lets a parent attach a slip to an existing single transfer payment', async () => {
    services.getChildPayments.mockResolvedValue({
      data: { data: [{
        id: 44,
        invoiceNo: 'INV-44',
        description: 'คณิตศาสตร์',
        amount: 500,
        status: 'pending',
        bankName: 'ธนาคารตัวอย่าง',
        bankAccountNumber: '1234567890',
        paymentQrImageUrl: 'https://storage.test/pending-qr.png',
      }] },
    });
    services.getChildPayableBalances.mockResolvedValue({ data: { data: [] } });
    const { container } = render(<PaymentsPage childId="20" />);

    fireEvent.click(await screen.findByRole('button', { name: 'แนบสลิป' }));
    expect(screen.getByText('ธนาคารตัวอย่าง')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'QR Code สำหรับชำระเงินให้สถาบัน' })).toHaveAttribute('src', 'https://storage.test/pending-qr.png');
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

  it('creates a dynamic PromptPay QR and lets the parent refresh its payment status', async () => {
    services.getChildPayableBalances.mockResolvedValue({
      data: {
        paymentOptions: { promptPayEnabled: true, installmentsEnabled: true },
        data: [{ enrollmentId: 45, studentId: 20, courseName: 'คณิตศาสตร์ ป.4', amountDue: 1250 }],
      },
    });
    services.createChildOnlinePaymentBatch.mockResolvedValue({
      data: { status: 'success', message: 'สร้าง QR แล้ว', data: {
        batchId: 91,
        invoiceNo: 'INV-91',
        amount: 1250,
        method: 'promptpay',
        status: 'pending',
        gatewayQrUrl: 'https://api.omise.co/qr.svg',
        gatewayExpiresAt: '2026-11-08T10:00:00Z',
      } },
    });
    render(<PaymentsPage childId="20" />);

    await screen.findByText('คณิตศาสตร์ ป.4');
    fireEvent.click(screen.getByRole('radio', { name: 'PromptPay QR ระบุยอดอัตโนมัติ' }));
    fireEvent.click(screen.getByRole('button', { name: 'สร้าง QR พร้อมเพย์' }));

    expect(await screen.findByRole('img', { name: 'QR พร้อมเพย์สำหรับยอด ฿1,250.00' })).toHaveAttribute('src', 'https://api.omise.co/qr.svg');
    fireEvent.click(screen.getByRole('button', { name: 'ชำระแล้ว · ตรวจสอบสถานะ' }));
    await screen.findByText('ชำระสำเร็จแล้ว');
    expect(services.createChildOnlinePaymentBatch).toHaveBeenCalledWith(20, 45, 1250, 'promptpay', null, null);
    expect(services.refreshChildOnlinePaymentStatus).toHaveBeenCalledWith(20, 91);
  });

  it('starts card installments through the hosted Omise checkout without collecting card data in LIFF', async () => {
    services.getChildPayableBalances.mockResolvedValue({
      data: {
        paymentOptions: { promptPayEnabled: true, installmentsEnabled: true },
        data: [{ enrollmentId: 45, studentId: 20, courseName: 'คณิตศาสตร์ ป.4', amountDue: 1250 }],
      },
    });
    services.createChildOnlinePaymentBatch.mockResolvedValue({
      data: { status: 'success', data: {
        batchId: 92,
        invoiceNo: 'INV-92',
        amount: 1250,
        method: 'credit_card_installment',
        status: 'pending',
        checkoutUrl: 'https://pay.omise.co/authorize/92',
        installmentBank: 'installment_kbank',
        installmentTerm: 3,
      } },
    });
    render(<PaymentsPage childId="20" />);

    await screen.findByText('คณิตศาสตร์ ป.4');
    fireEvent.click(screen.getByRole('radio', { name: 'ผ่อนชำระด้วยบัตรเครดิต' }));
    fireEvent.click(screen.getByRole('button', { name: 'เริ่มรายการผ่อน' }));

    const checkoutLink = await screen.findByRole('link', { name: 'ไปหน้าชำระเงินปลอดภัยของ Omise' });
    expect(checkoutLink).toHaveAttribute('href', 'https://pay.omise.co/authorize/92');
    expect(screen.getByText('ข้อมูลบัตรจะกรอกบนหน้าชำระที่ปลอดภัยของ Omise เท่านั้น ตรวจยอดต่องวดและดอกเบี้ยก่อนยืนยัน')).toBeInTheDocument();
    expect(services.createChildOnlinePaymentBatch).toHaveBeenCalledWith(20, 45, 1250, 'credit_card_installment', 'installment_kbank', 3);
  });
});
