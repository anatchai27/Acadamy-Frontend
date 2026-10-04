import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FinancePage } from '../finance-page';
import { enrollmentService, financeService, studentService, uploadService } from '../../../services';

vi.mock('../../../layouts/admin-layout', () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../components/ui', () => ({
  DataTable: () => <div />,
  SolidInput: ({ label, ...props }) => (
    <label>
      {label}
      <input {...props} />
    </label>
  ),
  Button: ({ children, variant, size, loading, ...props }) => (
    <button {...props}>{loading ? 'กำลังดำเนินการ...' : children}</button>
  ),
  DatePickerInput: () => <div />,
  ImageUpload: ({ label, onChange }) => (
    <label>
      {label}
      <input
        type="file"
        onChange={(event) => onChange('data:image/jpeg;base64,c2xpcA==', event.currentTarget.files?.[0])}
      />
    </label>
  ),
  showToast: vi.fn(),
}));

vi.mock('../../../services', () => ({
  financeService: {
    createPaymentBatch: vi.fn(),
    getPayments: vi.fn(),
    verifyPaymentBatchSlip: vi.fn(),
  },
  studentService: { getStudents: vi.fn() },
  enrollmentService: { getEnrollments: vi.fn() },
  uploadService: { uploadPaymentBatchSlip: vi.fn() },
  reportService: { getRevenueReport: vi.fn(), downloadPaymentCsv: vi.fn() },
}));

vi.mock('../../../hooks', () => ({ useAbortController: () => () => undefined }));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'default' }) }));

describe('finance batch payment form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    studentService.getStudents.mockResolvedValue({
      data: {
        data: {
          students: [
            { id: 1, fullName: 'น้องต้น', nickname: 'ต้น', grade: 'ป.4' },
            { id: 2, fullName: 'น้องใบเตย', nickname: 'ใบเตย', grade: 'ป.2' },
          ],
        },
      },
    });
    enrollmentService.getEnrollments.mockImplementation(async (studentId) => ({
      data: {
        data: {
          enrollments:
            studentId === '1'
              ? [
                  {
                    id: 101,
                    studentId: 1,
                    studentName: 'น้องต้น',
                    courseName: 'คณิตศาสตร์',
                    coursePrice: 1200,
                    paidAmount: 0,
                    pendingAmount: 0,
                  },
                  {
                    id: 102,
                    studentId: 1,
                    studentName: 'น้องต้น',
                    courseName: 'ภาษาอังกฤษ',
                    coursePrice: 800,
                    paidAmount: 200,
                    pendingAmount: 0,
                  },
                ]
              : [
                  {
                    id: 201,
                    studentId: 2,
                    studentName: 'น้องใบเตย',
                    courseName: 'วิทยาศาสตร์',
                    coursePrice: 1500,
                    paidAmount: 1000,
                    pendingAmount: 0,
                  },
                ],
        },
      },
    }));
    financeService.createPaymentBatch.mockResolvedValue({
      data: {
        data: {
          batchId: 50,
          invoiceNo: 'INV-BATCH-50',
          amount: 2300,
          status: 'succeeded',
          receiptPdfUrl: 'https://receipt.test/50.pdf',
        },
      },
    });
    uploadService.uploadPaymentBatchSlip.mockResolvedValue({ data: {} });
    financeService.verifyPaymentBatchSlip.mockResolvedValue({
      data: { batchId: 51, verified: true, verifiedAmount: 2300, receiptPdfUrl: 'https://receipt.test/51.pdf' },
    });
  });

  it('combines multiple courses and siblings into one cash batch', async () => {
    render(<FinancePage path="/admin/finance" />);

    const firstStudent = await screen.findByLabelText('เลือกนักเรียน');
    fireEvent.change(firstStudent, { target: { value: '1' } });
    const mathCourse = await screen.findByRole('checkbox', { name: /คณิตศาสตร์/ });
    fireEvent.click(mathCourse);
    fireEvent.click(screen.getByRole('checkbox', { name: /ภาษาอังกฤษ/ }));
    expect(screen.getByText('2 รายการ')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ เพิ่มนักเรียน' }));
    fireEvent.change(await screen.findByLabelText('นักเรียน 2'), { target: { value: '2' } });
    fireEvent.click(await screen.findByRole('checkbox', { name: /วิทยาศาสตร์/ }));
    expect(screen.getByText('3 รายการ')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'เงินสด' }));

    expect(screen.getByText('฿2,300')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /บันทึกบิลรวม/ }));

    await waitFor(() =>
      expect(financeService.createPaymentBatch).toHaveBeenCalledWith({
        allocations: [
          { enrollmentId: 101, amount: 1200 },
          { enrollmentId: 102, amount: 600 },
          { enrollmentId: 201, amount: 500 },
        ],
        method: 'cash',
      }),
    );
    expect(await screen.findByText(/INV-BATCH-50/)).toBeInTheDocument();
  });

  it('uploads and verifies one slip against the combined transfer amount', async () => {
    financeService.createPaymentBatch.mockResolvedValue({
      data: { data: { batchId: 51, invoiceNo: 'INV-BATCH-51', amount: 1200, status: 'pending' } },
    });
    render(<FinancePage path="/admin/finance" />);

    fireEvent.change(await screen.findByLabelText('เลือกนักเรียน'), { target: { value: '1' } });
    fireEvent.click(await screen.findByRole('checkbox', { name: /คณิตศาสตร์/ }));
    const slip = new File(['slip'], 'slip.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('สลิปยอดรวม (สูงสุด 1MB)'), { target: { files: [slip] } });
    const submitButton = screen.getByRole('button', { name: /บันทึกบิลรวม/ });
    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(financeService.createPaymentBatch).toHaveBeenCalledWith({
        allocations: [{ enrollmentId: 101, amount: 1200 }],
        method: 'transfer',
      }),
    );
    expect(uploadService.uploadPaymentBatchSlip).toHaveBeenCalledWith(slip, 51);
    expect(financeService.verifyPaymentBatchSlip).toHaveBeenCalledWith(51);
    expect(await screen.findByText(/INV-BATCH-51/)).toBeInTheDocument();
  });
});
