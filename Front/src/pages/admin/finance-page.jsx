import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { DataTable, SolidInput, Button, showToast, DatePickerInput, ImageUpload } from '../../components/ui';
import { financeService, studentService, enrollmentService, uploadService, reportService } from '../../services';
import { useAbortController } from '../../hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';

const paymentStatusLabels = {
  pending: 'รอตรวจสอบ',
  succeeded: 'ชำระสำเร็จ',
  failed: 'ไม่สำเร็จ',
  cancelled: 'ยกเลิก',
  refunded: 'คืนเงินแล้ว',
  partially_refunded: 'คืนเงินบางส่วน',
};

const formatError = (error, fallback) => error?.data?.message || error?.data?.error || error?.message || fallback;

export function FinancePage({ path }) {
  const [mode, setMode] = useState('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState(null);
  const [issuingReceiptId, setIssuingReceiptId] = useState(null);
  const [pendingSlipPaymentId, setPendingSlipPaymentId] = useState(null);
  const [pendingSlipUploaded, setPendingSlipUploaded] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyMethod, setHistoryMethod] = useState('');
  const [revenue, setRevenue] = useState([]);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [revenueLoaded, setRevenueLoaded] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [form, setForm] = useState({
    studentId: '',
    enrollmentId: '',
    amount: '',
    method: 'transfer',
  });
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const enrollmentRequestId = useRef(0);
  const [slipUploadKey, setSlipUploadKey] = useState(0);

  useEffect(() => {
    studentService
      .getStudents({ page: 1, limit: 200 }, { signal: getSignal() })
      .then((res) => {
        const payload = res.data?.data || res.data || {};
        setStudents(payload.students || (Array.isArray(payload) ? payload : []));
      })
      .catch(() => showToast('ไม่สามารถโหลดรายชื่อนักเรียนได้', 'error'));
  }, []);

  const fetchPayments = async (page = historyPage) => {
    if (startDate && endDate && startDate > endDate) {
      showToast('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด', 'error');
      return;
    }
    setPaymentLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (historyMethod) params.method = historyMethod;
      params.page = page;
      params.limit = 20;
      const res = await financeService.getPayments(params, { signal: getSignal() });
      const payload = res.data?.data || res.data || {};
      setPayments(payload.payments || (Array.isArray(payload) ? payload : []));
      setHistoryTotalPages(payload.pagination?.totalPages || 1);
      if (startDate && endDate) {
        setReportLoading(true);
        const report = await reportService.getRevenueReport(
          { from: startDate, to: endDate, group_by: 'day' },
          { signal: getSignal() },
        );
        const revenuePayload = report.data?.data || report.data || [];
        const rows = Array.isArray(revenuePayload) ? revenuePayload : revenuePayload.rows || [];
        setRevenue(rows);
        setRevenueTotal(rows.reduce((total, row) => total + (Number(row.grossAmount) || 0), 0));
        setRevenueLoaded(true);
      }
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลการเงินได้', 'error');
    } finally {
      setPaymentLoading(false);
      setReportLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob } = await reportService.downloadPaymentCsv({
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
        ...(historyMethod ? { method: historyMethod } : {}),
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'payments.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(error?.message || 'ส่งออก CSV ไม่สำเร็จ', 'error');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (mode === 'history') fetchPayments();
  }, [mode, historyPage, historyMethod]);

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const selectedEnrollment = enrollments.find((item) => String(item.id) === form.enrollmentId);
  const amountDue = selectedEnrollment
    ? Math.max(
        Number(selectedEnrollment.coursePrice || 0) -
          Number(selectedEnrollment.paidAmount || 0) -
          Number(selectedEnrollment.pendingAmount || 0),
        0,
      )
    : 0;

  const resetPaymentForm = () => {
    setForm({ studentId: '', enrollmentId: '', amount: '', method: 'transfer' });
    setEnrollments([]);
    setSlipFile(null);
    setSlipPreview(null);
    setPendingSlipPaymentId(null);
    setPendingSlipUploaded(false);
    setLatestReceipt(null);
    setSlipUploadKey((key) => key + 1);
  };

  const handleStudentChange = async (event) => {
    const studentId = event.target.value;
    const requestId = ++enrollmentRequestId.current;
    setForm((prev) => ({ ...prev, studentId, enrollmentId: '', amount: '' }));
    setEnrollments([]);
    if (!studentId) {
      setEnrollmentsLoading(false);
      return;
    }

    setEnrollmentsLoading(true);
    try {
      const res = await enrollmentService.getEnrollments(studentId, { signal: getSignal() });
      if (requestId !== enrollmentRequestId.current) return;
      const payload = res.data?.data || res.data || {};
      setEnrollments(payload.enrollments || []);
    } catch {
      if (requestId === enrollmentRequestId.current) {
        showToast('ไม่สามารถโหลดรายการลงทะเบียนของนักเรียนได้', 'error');
      }
    } finally {
      if (requestId === enrollmentRequestId.current) setEnrollmentsLoading(false);
    }
  };

  const handleEnrollmentChange = (event) => {
    const enrollmentId = event.target.value;
    const enrollment = enrollments.find((item) => String(item.id) === enrollmentId);
    const remaining = enrollment
      ? Math.max(
          Number(enrollment.coursePrice || 0) -
            Number(enrollment.paidAmount || 0) -
            Number(enrollment.pendingAmount || 0),
          0,
        )
      : 0;
    setForm((prev) => ({
      ...prev,
      enrollmentId,
      amount: remaining > 0 ? remaining.toFixed(2) : '',
    }));
  };

  const handleVerifyPayment = async (payment) => {
    setVerifyingPaymentId(payment.id);
    try {
      const res = await financeService.verifyPaymentSlip(payment.id);
      const result = res.data?.data || res.data || {};
      if (!result.verified) throw new Error(result.reason || 'ตรวจสลิปไม่ผ่าน');
      showToast(`ตรวจสลิปสำเร็จ: ${payment.invoiceNo}`, 'success');
      if (pendingSlipPaymentId === payment.id) {
        resetPaymentForm();
        setLatestReceipt({ invoiceNo: payment.invoiceNo, url: result.receiptPdfUrl });
      }
      await fetchPayments(historyPage);
    } catch (error) {
      showToast(formatError(error, 'ตรวจสอบสลิปไม่สำเร็จ รายการยังรอตรวจสอบ'), 'error');
      await fetchPayments(historyPage);
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const handleIssueReceipt = async (payment) => {
    setIssuingReceiptId(payment.id);
    try {
      await financeService.issuePaymentReceipt(payment.id);
      showToast(`ออกใบเสร็จสำเร็จ: ${payment.invoiceNo}`, 'success');
      await fetchPayments(historyPage);
    } catch (error) {
      showToast(formatError(error, 'ออกใบเสร็จไม่สำเร็จ'), 'error');
    } finally {
      setIssuingReceiptId(null);
    }
  };

  const handleReplaceSlip = async (payment, file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      showToast('สลิปต้องเป็น JPG, PNG หรือ WebP ขนาดไม่เกิน 1MB', 'error');
      return;
    }

    setVerifyingPaymentId(payment.id);
    try {
      await uploadService.uploadPaymentSlip(file, payment.id);
      showToast('แนบสลิปแล้ว กำลังตรวจสอบยอด', 'success');
      await handleVerifyPayment(payment);
    } catch (error) {
      showToast(formatError(error, 'แนบสลิปไม่สำเร็จ'), 'error');
      await fetchPayments(historyPage);
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const paymentColumns = [
    {
      key: 'paidAt',
      label: 'วันที่',
      render: (value) => (value ? new Date(value).toLocaleDateString('th-TH') : '-'),
    },
    { key: 'studentName', label: 'นักเรียน' },
    { key: 'courseName', label: 'คอร์สเรียน' },
    {
      key: 'amount',
      label: 'ยอดเงิน',
      align: 'right',
      render: (value) => <span class="font-semibold">฿{Number(value).toLocaleString()}</span>,
    },
    {
      key: 'status',
      label: 'สถานะ',
      render: (value) => (
        <span
          class={`rounded-full px-2 py-1 text-xs font-medium ${value === 'succeeded' ? 'bg-emerald-50 text-emerald-700' : value === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}
        >
          {paymentStatusLabels[value] || value || '-'}
        </span>
      ),
    },
    { key: 'method', label: 'ช่องทาง', align: 'center' },
    {
      key: 'slipUrl',
      label: 'สลิป',
      align: 'center',
      render: (value, payment) => (
        <div class="flex items-center justify-center gap-2">
          {value && (
            <a href={value} target="_blank" rel="noreferrer" class="text-oasis-primary hover:underline">
              ดู
            </a>
          )}
          {payment.status === 'pending' && payment.method === 'transfer' && (
            <label class="cursor-pointer text-xs font-medium text-oasis-primary hover:underline">
              {value ? 'เปลี่ยน' : 'แนบสลิป'}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                class="hidden"
                onChange={(event) => {
                  handleReplaceSlip(payment, event.currentTarget.files?.[0]);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          )}
          {!value && payment.status !== 'pending' && '-'}
        </div>
      ),
    },
    {
      key: 'verificationAction',
      label: 'ตรวจสลิป',
      align: 'center',
      render: (_, payment) => {
        if (payment.status === 'pending' && payment.method === 'transfer' && payment.slipUrl) {
          return (
            <button
              type="button"
              onClick={() => handleVerifyPayment(payment)}
              disabled={verifyingPaymentId === payment.id}
              class="text-xs font-medium text-oasis-primary hover:underline disabled:opacity-50"
            >
              {verifyingPaymentId === payment.id ? 'กำลังตรวจ...' : 'ตรวจอีกครั้ง'}
            </button>
          );
        }
        if (payment.status === 'succeeded' && !payment.receiptPdfUrl) {
          return (
            <button
              type="button"
              onClick={() => handleIssueReceipt(payment)}
              disabled={issuingReceiptId === payment.id}
              class="text-xs font-medium text-oasis-primary hover:underline disabled:opacity-50"
            >
              {issuingReceiptId === payment.id ? 'กำลังออก...' : 'ออกใบเสร็จ'}
            </button>
          );
        }
        return '-';
      },
    },
    {
      key: 'receiptPdfUrl',
      label: 'ใบเสร็จ',
      align: 'center',
      render: (value) =>
        value ? (
          <a href={value} target="_blank" rel="noreferrer" class="text-oasis-primary hover:underline">
            เปิด PDF
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'invoiceNo',
      label: 'เลข Invoice',
      render: (value) => <span class="text-xs font-mono">{value || '-'}</span>,
    },
  ];

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let paymentId = pendingSlipPaymentId;
      let invoiceNo = latestReceipt?.invoiceNo;
      let receiptPdfUrl = null;

      if (!paymentId) {
        const amount = Number(form.amount);
        if (!form.studentId || !form.enrollmentId || !selectedEnrollment) {
          showToast('กรุณาเลือกนักเรียนและรายการลงทะเบียน', 'error');
          return;
        }
        if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) > Math.round(amountDue * 100)) {
          showToast('กรุณากรอกยอดที่มากกว่า 0 และไม่เกินยอดคงเหลือ', 'error');
          return;
        }
        if (form.method === 'transfer' && !slipFile) {
          showToast('กรุณาแนบสลิปก่อนบันทึกรายการโอนเงิน', 'error');
          return;
        }

        const res = await financeService.createPayment({
          enrollmentId: Number(form.enrollmentId),
          amount,
          method: form.method,
        });
        const created = res.data?.data || res.data || {};
        paymentId = created.paymentId;
        invoiceNo = created.invoiceNo;
        receiptPdfUrl = created.receiptPdfUrl;
        if (!paymentId) throw new Error('API ไม่ได้ส่งรหัสรายการชำระเงินกลับมา');

        if (form.method === 'transfer') {
          setPendingSlipPaymentId(paymentId);
          setPendingSlipUploaded(false);
        }
      }

      if (form.method === 'transfer') {
        if (!pendingSlipUploaded) {
          if (!slipFile) {
            showToast(`สร้างรายการ ${invoiceNo || `#${paymentId}`} แล้ว กรุณาแนบสลิปและกดต่ออีกครั้ง`, 'error');
            return;
          }
          await uploadService.uploadPaymentSlip(slipFile, paymentId);
          setPendingSlipUploaded(true);
        }

        try {
          const verifyResponse = await financeService.verifyPaymentSlip(paymentId);
          const verification = verifyResponse.data?.data || verifyResponse.data || {};
          if (!verification.verified) throw new Error(verification.reason || 'ตรวจสลิปไม่ผ่าน');
          receiptPdfUrl = verification.receiptPdfUrl;
          showToast(`ตรวจสลิปและรับชำระสำเร็จ: ${invoiceNo || `#${paymentId}`}`, 'success');
        } catch (error) {
          showToast(`แนบสลิปแล้ว แต่ยังยืนยันการชำระไม่ได้: ${formatError(error, 'รายการยังรอตรวจสอบ')}`, 'error');
          return;
        }
      } else {
        showToast(`รับชำระสำเร็จ: ${invoiceNo}`, 'success');
      }

      resetPaymentForm();
      setLatestReceipt({ invoiceNo, url: receiptPdfUrl });
    } catch (error) {
      showToast(formatError(error, 'บันทึกรายการไม่สำเร็จ'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateFilter = async () => {
    if (historyPage === 1) await fetchPayments(1);
    else setHistoryPage(1);
  };

  return (
    <AdminLayout path={path}>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">การเงิน</h2>
        <p class="text-sm text-zinc-500 mt-1 sm:mt-0">จัดการบันทึกรายรับและดูประวัติการเงิน</p>
      </div>

      {/* Mode Switcher */}
      <div class={`${isNeo ? 'neo-tab-group p-0 mb-6' : 'inline-flex rounded-xl bg-zinc-100 p-1 mb-6'}`}>
        <button
          type="button"
          onClick={() => setMode('form')}
          class={`px-5 py-2 text-sm font-medium transition-all ${
            isNeo
              ? mode === 'form'
                ? 'neo-tab-active'
                : 'neo-tab-inactive'
              : `rounded-lg transition-all ${mode === 'form' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`
          }`}
        >
          บันทึกรับเงิน
        </button>
        <button
          type="button"
          onClick={() => setMode('history')}
          class={`px-5 py-2 text-sm font-medium transition-all ${
            isNeo
              ? mode === 'history'
                ? 'neo-tab-active'
                : 'neo-tab-inactive'
              : `rounded-lg transition-all ${mode === 'history' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`
          }`}
        >
          ประวัติการเงิน
        </button>
      </div>

      {mode === 'form' ? (
        <div class="max-w-2xl">
          <form onSubmit={handleSubmitPayment}>
            <div
              class={`${isNeo ? 'neo-card bg-white p-6' : 'bg-white rounded-2xl border border-zinc-200/80 p-6'} space-y-5 shadow-sm`}
            >
              <div class="flex flex-col gap-1.5">
                <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>เลือกนักเรียน</label>
                <select
                  value={form.studentId}
                  onChange={handleStudentChange}
                  disabled={Boolean(pendingSlipPaymentId)}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-zinc-800 ${isNeo ? 'neo-select' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                >
                  <option value="">-- เลือกนักเรียน --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName}
                      {student.nickname ? ` (${student.nickname})` : ''}
                      {student.grade ? ` · ${student.grade}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {form.studentId && (
                <div class="flex flex-col gap-1.5">
                  <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>รายการลงทะเบียน</label>
                  <select
                    value={form.enrollmentId}
                    onChange={handleEnrollmentChange}
                    disabled={enrollmentsLoading || Boolean(pendingSlipPaymentId)}
                    class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-zinc-800 ${isNeo ? 'neo-select' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                  >
                    <option value="">{enrollmentsLoading ? 'กำลังโหลด...' : '-- เลือกรายการลงทะเบียน --'}</option>
                    {enrollments.map((enrollment) => (
                      <option key={enrollment.id} value={enrollment.id}>
                        {enrollment.courseName}
                        {enrollment.courseNameEn ? ` / ${enrollment.courseNameEn}` : ''} · เหลือ ฿
                        {Math.max(
                          Number(enrollment.coursePrice || 0) -
                            Number(enrollment.paidAmount || 0) -
                            Number(enrollment.pendingAmount || 0),
                          0,
                        ).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {!enrollmentsLoading && enrollments.length === 0 && (
                    <span class="text-xs text-amber-700">นักเรียนคนนี้ยังไม่มีรายการลงทะเบียนที่เลือกชำระได้</span>
                  )}
                </div>
              )}

              {selectedEnrollment && (
                <div class="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                  <div class="flex flex-wrap justify-between gap-2">
                    <span>ราคาคอร์ส</span>
                    <strong>฿{Number(selectedEnrollment.coursePrice || 0).toLocaleString()}</strong>
                  </div>
                  <div class="mt-1 flex flex-wrap justify-between gap-2">
                    <span>ชำระแล้ว</span>
                    <strong>฿{Number(selectedEnrollment.paidAmount || 0).toLocaleString()}</strong>
                  </div>
                  <div class="mt-1 flex flex-wrap justify-between gap-2">
                    <span>รอตรวจสอบ</span>
                    <strong>฿{Number(selectedEnrollment.pendingAmount || 0).toLocaleString()}</strong>
                  </div>
                  <div class="mt-2 flex flex-wrap justify-between gap-2 border-t border-zinc-200 pt-2">
                    <span>ยอดคงเหลือ</span>
                    <strong>฿{amountDue.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <SolidInput
                label="ยอดเงิน (บาท)"
                type="number"
                placeholder="0.00"
                min="0.01"
                max={amountDue.toFixed(2)}
                step="0.01"
                required
                disabled={!selectedEnrollment || amountDue <= 0 || Boolean(pendingSlipPaymentId)}
                value={form.amount}
                onInput={updateField('amount')}
              />

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-zinc-800">ช่องทางชำระเงิน</label>
                <div class="flex gap-2">
                  {[
                    { label: 'โอนเงิน', value: 'transfer' },
                    { label: 'เงินสด', value: 'cash' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => updateField('method')({ target: { value: m.value } })}
                      disabled={Boolean(pendingSlipPaymentId)}
                      class={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        form.method === m.value
                          ? 'bg-oasis-primary text-white shadow-sm'
                          : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.method === 'transfer' && (
                <>
                  <ImageUpload
                    key={slipUploadKey}
                    label="สลิปการโอนเงิน (สูงสุด 1MB)"
                    preview={slipPreview}
                    onChange={(base64, file) => {
                      setSlipPreview(base64);
                      setSlipFile(file);
                      if (pendingSlipPaymentId) setPendingSlipUploaded(false);
                    }}
                  />
                  {pendingSlipPaymentId && (
                    <p class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      รายการ #{pendingSlipPaymentId} ถูกสร้างแล้วและยังไม่ถูกนับเป็นยอดชำระสำเร็จ
                      การกดอีกครั้งจะอัปโหลด/ตรวจสลิปของรายการเดิม ไม่สร้างรายการใหม่
                    </p>
                  )}
                </>
              )}

              {latestReceipt && (
                <div class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <span>รับชำระสำเร็จ · {latestReceipt.invoiceNo}</span>
                  {latestReceipt.url ? (
                    <a href={latestReceipt.url} target="_blank" rel="noreferrer" class="ml-3 font-semibold underline">
                      เปิดใบเสร็จ PDF
                    </a>
                  ) : (
                    <span class="ml-2">ใบเสร็จกำลังรอออก กดออกใหม่ได้จากประวัติการเงิน</span>
                  )}
                </div>
              )}

              <div class="flex gap-3 pt-2">
                <Button variant="primary" size="md" type="submit" loading={isSubmitting} disabled={isSubmitting}>
                  {pendingSlipPaymentId
                    ? pendingSlipUploaded
                      ? 'ตรวจสลิปของรายการเดิม'
                      : 'อัปโหลดสลิปต่อ'
                    : 'บันทึกรับชำระ'}
                </Button>
                <Button variant="outline" size="md" type="button" onClick={resetPaymentForm}>
                  {pendingSlipPaymentId ? 'ปิดฟอร์ม (รายการยังรอตรวจ)' : 'ล้างฟอร์ม'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* Payment History */
        <div>
          <div
            class={`${isNeo ? 'neo-card bg-white p-4' : 'bg-zinc-50 rounded-2xl border border-zinc-100 p-4'} flex flex-wrap items-end gap-3 mb-6`}
          >
            <DatePickerInput
              label="ตั้งแต่วันที่"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
              placeholder="เลือกวันที่เริ่มต้น"
            />
            <DatePickerInput
              label="ถึงวันที่"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
              placeholder="เลือกวันที่สิ้นสุด"
            />
            <div class="flex min-w-44 flex-col gap-1.5">
              <label class="text-sm font-medium text-zinc-800">ช่องทางชำระเงิน</label>
              <select
                value={historyMethod}
                onChange={(event) => {
                  setHistoryMethod(event.target.value);
                  setHistoryPage(1);
                }}
                class={`w-full bg-white px-4 py-2.5 text-sm text-zinc-800 focus:outline-none ${isNeo ? 'neo-select' : 'rounded-xl border border-zinc-200 focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
              >
                <option value="">ทุกช่องทาง</option>
                <option value="transfer">โอนเงิน</option>
                <option value="cash">เงินสด</option>
                <option value="credit_card">บัตรเครดิต</option>
              </select>
            </div>
            <Button variant="primary" size="md" onClick={handleDateFilter}>
              กรองข้อมูล
            </Button>
            <Button variant="outline" size="md" onClick={handleExport} loading={exporting} disabled={exporting}>
              ส่งออก CSV
            </Button>
          </div>

          <div class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-zinc-200 bg-white'} mb-6 p-5`}>
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 class="font-semibold text-zinc-900">กราฟรายรับรายวัน</h3>
                <p class="text-xs text-zinc-500">แสดงจากข้อมูล payment จริงตามช่วงวันที่</p>
              </div>
              <div class="text-right">
                {reportLoading ? <span class="block text-xs text-zinc-500">กำลังโหลด...</span> : null}
                <span class="text-sm font-semibold text-zinc-800">รวม ฿{revenueTotal.toLocaleString()}</span>
              </div>
            </div>
            {revenue.length === 0 ? (
              <p class="text-sm text-zinc-500">
                {revenueLoaded ? 'ไม่พบรายรับที่สำเร็จในช่วงวันที่เลือก' : 'เลือกวันที่และกดกรองข้อมูลเพื่อแสดงกราฟ'}
              </p>
            ) : (
              <div class="space-y-3">
                {revenue.map((row) => {
                  const max = Math.max(...revenue.map((item) => Number(item.grossAmount) || 0), 1);
                  const width = `${Math.max(3, ((Number(row.grossAmount) || 0) / max) * 100)}%`;
                  return (
                    <div key={row.period} class="grid grid-cols-[5rem_1fr_auto] items-center gap-3 text-xs">
                      <span class="text-zinc-500">{row.period}</span>
                      <div class="h-3 rounded-full bg-zinc-100">
                        <div class="h-3 rounded-full bg-oasis-primary" style={{ width }} />
                      </div>
                      <span class="font-semibold text-zinc-700">฿{Number(row.grossAmount).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DataTable
            columns={paymentColumns}
            data={payments}
            keyField="id"
            pageSize={0}
            loading={paymentLoading}
            emptyMessage="ไม่พบข้อมูลการชำระเงิน"
          />
          {historyTotalPages > 1 && (
            <div class="mt-4 flex items-center justify-end gap-3 text-sm text-zinc-600">
              <button
                type="button"
                disabled={historyPage <= 1 || paymentLoading}
                onClick={() => setHistoryPage((page) => page - 1)}
                class="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
              >
                ก่อนหน้า
              </button>
              <span>
                {historyPage} / {historyTotalPages}
              </span>
              <button
                type="button"
                disabled={historyPage >= historyTotalPages || paymentLoading}
                onClick={() => setHistoryPage((page) => page + 1)}
                class="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
