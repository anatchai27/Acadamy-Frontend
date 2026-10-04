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

const formatError = (error, fallback) => error?.data?.message || error?.data?.error || error?.data?.detail || error?.data?.title || error?.message || fallback;

export function FinancePage({ path }) {
  const [mode, setMode] = useState('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [paymentGroups, setPaymentGroups] = useState([{ key: 0, studentId: '', enrollments: [], loading: false }]);
  const [allocations, setAllocations] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [verifyingPaymentId, setVerifyingPaymentId] = useState(null);
  const [issuingReceiptId, setIssuingReceiptId] = useState(null);
  const [pendingBatchId, setPendingBatchId] = useState(null);
  const [pendingBatchInvoiceNo, setPendingBatchInvoiceNo] = useState('');
  const [pendingBatchSlipUploaded, setPendingBatchSlipUploaded] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyMethod, setHistoryMethod] = useState('');
  const [revenue, setRevenue] = useState([]);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [revenueLoaded, setRevenueLoaded] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const enrollmentRequestIds = useRef(new Map());
  const paymentGroupKey = useRef(1);
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

  const getAmountDue = (enrollment) => Math.max(
    Number(enrollment.coursePrice || 0) - Number(enrollment.paidAmount || 0) - Number(enrollment.pendingAmount || 0),
    0,
  );
  const selectedItems = paymentGroups.flatMap((group) => group.enrollments
    .filter((enrollment) => allocations[enrollment.id] !== undefined)
    .map((enrollment) => ({
      groupKey: group.key,
      studentId: group.studentId,
      studentName: students.find((student) => String(student.id) === group.studentId)?.fullName || enrollment.studentName,
      enrollment,
      amount: Number(allocations[enrollment.id]),
      amountDue: getAmountDue(enrollment),
    })));
  const paymentTotal = selectedItems.reduce((total, item) => total + (Number.isFinite(item.amount) ? item.amount : 0), 0);
  const allocationsValid = selectedItems.length > 0 && selectedItems.every((item) =>
    Number.isFinite(item.amount) && item.amount > 0 && Math.round(item.amount * 100) <= Math.round(item.amountDue * 100),
  );

  const resetPaymentForm = () => {
    paymentGroupKey.current += 1;
    setPaymentGroups([{ key: paymentGroupKey.current, studentId: '', enrollments: [], loading: false }]);
    setAllocations({});
    setPaymentMethod('transfer');
    setSlipFile(null);
    setSlipPreview(null);
    setPendingBatchId(null);
    setPendingBatchInvoiceNo('');
    setPendingBatchSlipUploaded(false);
    setLatestReceipt(null);
    setSlipUploadKey((key) => key + 1);
  };

  const handleStudentChange = async (groupKey, event) => {
    const studentId = event.target.value;
    const requestId = (enrollmentRequestIds.current.get(groupKey) || 0) + 1;
    enrollmentRequestIds.current.set(groupKey, requestId);
    const oldEnrollmentIds = paymentGroups.find((group) => group.key === groupKey)?.enrollments.map((item) => item.id) || [];
    setAllocations((previous) => {
      const next = { ...previous };
      oldEnrollmentIds.forEach((id) => delete next[id]);
      return next;
    });
    setPaymentGroups((previous) => previous.map((group) => group.key === groupKey
      ? { ...group, studentId, enrollments: [], loading: Boolean(studentId) }
      : group));
    if (!studentId) {
      return;
    }

    try {
      const res = await enrollmentService.getEnrollments(studentId, { signal: getSignal() });
      if (requestId !== enrollmentRequestIds.current.get(groupKey)) return;
      const payload = res.data?.data || res.data || {};
      setPaymentGroups((previous) => previous.map((group) => group.key === groupKey
        ? { ...group, enrollments: payload.enrollments || [], loading: false }
        : group));
    } catch {
      if (requestId === enrollmentRequestIds.current.get(groupKey)) {
        showToast(formatError(error, 'ไม่สามารถโหลดรายการลงทะเบียนของนักเรียนได้'), 'error');
        setPaymentGroups((previous) => previous.map((group) => group.key === groupKey
          ? { ...group, loading: false }
          : group));
      }
    }
  };

  const addStudentGroup = () => {
    const key = paymentGroupKey.current + 1;
    paymentGroupKey.current = key;
    setPaymentGroups((previous) => [...previous, { key, studentId: '', enrollments: [], loading: false }]);
  };

  const removeStudentGroup = (groupKey) => {
    const group = paymentGroups.find((item) => item.key === groupKey);
    setAllocations((previous) => {
      const next = { ...previous };
      (group?.enrollments || []).forEach((enrollment) => delete next[enrollment.id]);
      return next;
    });
    setPaymentGroups((previous) => previous.filter((item) => item.key !== groupKey));
  };

  const toggleEnrollment = (enrollment, checked) => {
    setAllocations((previous) => {
      const next = { ...previous };
      if (checked) next[enrollment.id] = getAmountDue(enrollment).toFixed(2);
      else delete next[enrollment.id];
      return next;
    });
  };

  const updateAllocationAmount = (enrollmentId, value) => {
    setAllocations((previous) => ({ ...previous, [enrollmentId]: value }));
  };

  const handleVerifyPayment = async (payment) => {
    setVerifyingPaymentId(payment.id);
    try {
      const res = payment.isBatch
        ? await financeService.verifyPaymentBatchSlip(payment.batchId)
        : await financeService.verifyPaymentSlip(payment.id);
      const result = res.data?.data || res.data || {};
      if (!result.verified) throw new Error(result.reason || 'ตรวจสลิปไม่ผ่าน');
      showToast(`ตรวจสลิปสำเร็จ: ${payment.invoiceNo}`, 'success');
      if (payment.isBatch && pendingBatchId === payment.batchId) {
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
      await (payment.isBatch
        ? financeService.issuePaymentBatchReceipt(payment.batchId)
        : financeService.issuePaymentReceipt(payment.id));
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
      if (payment.isBatch) await uploadService.uploadPaymentBatchSlip(file, payment.batchId);
      else await uploadService.uploadPaymentSlip(file, payment.id);
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
    {
      key: 'studentName',
      label: 'นักเรียน',
      render: (value, payment) => (
        <div>
          <span>{value || '-'}</span>
          {payment.isBatch && <span class="ml-2 rounded-full bg-oasis-primary/10 px-2 py-0.5 text-[10px] font-semibold text-oasis-primary">บิลรวม</span>}
        </div>
      ),
    },
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
      let batchId = pendingBatchId;
      let invoiceNo = pendingBatchInvoiceNo;
      let receiptPdfUrl = null;

      if (!batchId) {
        if (!allocationsValid) {
          showToast('เลือกอย่างน้อยหนึ่งคอร์ส และตรวจยอดที่แบ่งชำระอีกครั้ง', 'error');
          return;
        }
        if (paymentMethod === 'transfer' && !slipFile) {
          showToast('กรุณาแนบสลิปยอดรวมก่อนสร้างบิล', 'error');
          return;
        }

        const res = await financeService.createPaymentBatch({
          allocations: selectedItems.map((item) => ({
            enrollmentId: Number(item.enrollment.id),
            amount: item.amount,
          })),
          method: paymentMethod,
        });
        const created = res.data?.data || res.data || {};
        batchId = created.batchId;
        invoiceNo = created.invoiceNo;
        receiptPdfUrl = created.receiptPdfUrl;
        if (!batchId) throw new Error('API ไม่ได้ส่งรหัสบิลรวมกลับมา');

        if (paymentMethod === 'transfer') {
          setPendingBatchId(batchId);
          setPendingBatchInvoiceNo(invoiceNo || '');
          setPendingBatchSlipUploaded(false);
        }
      }

      if (paymentMethod === 'transfer') {
        if (!pendingBatchSlipUploaded) {
          if (!slipFile) {
            showToast(`สร้างบิล ${invoiceNo || `#${batchId}`} แล้ว กรุณาแนบสลิปและกดต่ออีกครั้ง`, 'error');
            return;
          }
          await uploadService.uploadPaymentBatchSlip(slipFile, batchId);
          setPendingBatchSlipUploaded(true);
        }

        try {
          const verifyResponse = await financeService.verifyPaymentBatchSlip(batchId);
          const verification = verifyResponse.data?.data || verifyResponse.data || {};
          if (!verification.verified) throw new Error(verification.reason || 'ตรวจสลิปไม่ผ่าน');
          receiptPdfUrl = verification.receiptPdfUrl;
          showToast(`ตรวจสลิปยอดรวมและรับชำระสำเร็จ: ${invoiceNo || `#${batchId}`}`, 'success');
        } catch (error) {
          showToast(`แนบสลิปแล้ว แต่ยังยืนยันการชำระไม่ได้: ${formatError(error, 'รายการยังรอตรวจสอบ')}`, 'error');
          return;
        }
      } else {
        showToast(`รับชำระรวม ฿${paymentTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })} สำเร็จ · ${invoiceNo}`, 'success');
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
        <div class="max-w-6xl">
          <form onSubmit={handleSubmitPayment} noValidate>
            <div class="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
              <section class={`${isNeo ? 'neo-card bg-white p-5' : 'rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm'}`}>
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 class="font-bold text-zinc-900">ใครและคอร์สอะไรบ้าง</h3>
                    <p class="mt-1 text-xs text-zinc-500">เลือกได้หลายคอร์สต่อคน และเพิ่มพี่น้องในบิลเดียวกัน</p>
                  </div>
                  <button
                    type="button"
                    onClick={addStudentGroup}
                    disabled={Boolean(pendingBatchId)}
                    class="rounded-xl border border-oasis-primary/25 px-3 py-2 text-sm font-semibold text-oasis-primary transition hover:bg-oasis-primary/5 disabled:opacity-50"
                  >
                    + เพิ่มนักเรียน
                  </button>
                </div>

                <div class="space-y-4">
                  {paymentGroups.map((group, index) => {
                    const usedStudentIds = paymentGroups
                      .filter((other) => other.key !== group.key)
                      .map((other) => other.studentId)
                      .filter(Boolean);
                    const payableEnrollments = group.enrollments.filter((enrollment) => getAmountDue(enrollment) > 0);
                    return (
                      <div key={group.key} class="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                        <div class="mb-3 flex items-center justify-between gap-3">
                          <label for={`payment-student-${group.key}`} class="text-sm font-semibold text-zinc-800">
                            {paymentGroups.length > 1 ? `นักเรียน ${index + 1}` : 'เลือกนักเรียน'}
                          </label>
                          {paymentGroups.length > 1 && !pendingBatchId && (
                            <button type="button" onClick={() => removeStudentGroup(group.key)} class="text-xs font-medium text-zinc-500 hover:text-red-600">
                              เอาออก
                            </button>
                          )}
                        </div>
                        <select
                          id={`payment-student-${group.key}`}
                          value={group.studentId}
                          onChange={(event) => handleStudentChange(group.key, event)}
                          disabled={Boolean(pendingBatchId) || students.length === 0}
                          class={`w-full bg-white px-4 py-2.5 text-sm text-zinc-800 focus:outline-none ${isNeo ? 'neo-select' : 'rounded-xl border border-zinc-200 focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                        >
                          <option value="">-- ค้นหา/เลือกนักเรียน --</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id} disabled={usedStudentIds.includes(String(student.id))}>
                              {student.fullName}{student.nickname ? ` (${student.nickname})` : ''}{student.grade ? ` · ${student.grade}` : ''}
                            </option>
                          ))}
                        </select>

                        {group.loading && <p class="mt-3 text-sm text-zinc-500">กำลังโหลดรายการคอร์ส...</p>}
                        {group.studentId && !group.loading && (
                          <div class="mt-3 space-y-2">
                            {payableEnrollments.map((enrollment) => {
                              const isSelected = allocations[enrollment.id] !== undefined;
                              const due = getAmountDue(enrollment);
                              return (
                                <div key={enrollment.id} class={`rounded-xl border bg-white p-3 transition ${isSelected ? 'border-oasis-primary/40 ring-1 ring-oasis-primary/10' : 'border-zinc-200'}`}>
                                  <label class="flex cursor-pointer items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={Boolean(pendingBatchId)}
                                      onChange={(event) => toggleEnrollment(enrollment, event.currentTarget.checked)}
                                      class="mt-1 h-4 w-4 rounded border-zinc-300 accent-oasis-primary"
                                    />
                                    <span class="min-w-0 flex-1">
                                      <span class="block truncate text-sm font-semibold text-zinc-800">{enrollment.courseName}</span>
                                      <span class="mt-0.5 block text-xs text-zinc-500">ค้างชำระ ฿{due.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</span>
                                    </span>
                                  </label>
                                  {isSelected && (
                                    <label class="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-2 text-xs text-zinc-500">
                                      <span>ยอดที่รับในบิลนี้</span>
                                      <span class="flex items-center gap-1 text-sm font-semibold text-zinc-800">
                                        ฿<input
                                          type="number"
                                          min="0.01"
                                          step="0.01"
                                          value={allocations[enrollment.id]}
                                          disabled={Boolean(pendingBatchId)}
                                          onInput={(event) => updateAllocationAmount(enrollment.id, event.currentTarget.value)}
                                          class="w-28 rounded-lg border border-zinc-200 px-2 py-1 text-right outline-none focus:border-oasis-primary"
                                        />
                                      </span>
                                    </label>
                                  )}
                                  {isSelected && Number(allocations[enrollment.id]) > due && (
                                    <p class="mt-1 text-right text-xs font-medium text-red-600">ยอดเกินยอดคงเหลือ ฿{due.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</p>
                                  )}
                                </div>
                              );
                            })}
                            {payableEnrollments.length === 0 && (
                              <p class="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">ไม่มีคอร์สที่มียอดค้างชำระ</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <aside class={`${isNeo ? 'neo-card bg-white p-5' : 'h-fit rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm'} space-y-5 lg:sticky lg:top-4`}>
                <div>
                  <div class="flex items-center justify-between">
                    <h3 class="font-bold text-zinc-900">สรุปบิลรวม</h3>
                    <span class="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">{selectedItems.length} รายการ</span>
                  </div>
                  {selectedItems.length > 0 ? (
                    <div class="mt-3 max-h-52 space-y-2 overflow-y-auto">
                      {selectedItems.map((item) => (
                        <div key={item.enrollment.id} class="flex justify-between gap-3 text-sm">
                          <span class="min-w-0">
                            <span class="block truncate font-medium text-zinc-800">{item.studentName}</span>
                            <span class="block truncate text-xs text-zinc-500">{item.enrollment.courseName}</span>
                          </span>
                          <span class="shrink-0 font-semibold text-zinc-800">฿{(Number.isFinite(item.amount) ? item.amount : 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p class="mt-3 rounded-xl bg-zinc-50 px-3 py-4 text-center text-sm text-zinc-500">เลือกรายการคอร์สเพื่อเริ่มสร้างบิล</p>
                  )}
                  <div class="mt-4 flex items-end justify-between border-t border-zinc-200 pt-3">
                    <span class="text-sm font-semibold text-zinc-700">ยอดรวม</span>
                    <strong class="text-2xl font-extrabold text-oasis-primary">฿{paymentTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                <div>
                  <p class="mb-2 text-sm font-semibold text-zinc-800">ช่องทางชำระ</p>
                  <div class="grid grid-cols-2 gap-2">
                    {[
                      { label: 'โอนเงิน · สลิปเดียว', value: 'transfer' },
                      { label: 'เงินสด', value: 'cash' },
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        disabled={Boolean(pendingBatchId)}
                        class={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${paymentMethod === method.value ? 'bg-oasis-primary text-white shadow-sm' : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'} disabled:opacity-50`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'transfer' && (
                  <>
                    <ImageUpload
                      key={slipUploadKey}
                      label="สลิปยอดรวม (สูงสุด 1MB)"
                      preview={slipPreview}
                      onChange={(base64, file) => {
                        setSlipPreview(base64);
                        setSlipFile(file);
                        if (pendingBatchId) setPendingBatchSlipUploaded(false);
                      }}
                    />
                    {pendingBatchId && (
                      <p class="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                        บิล {pendingBatchInvoiceNo || `#${pendingBatchId}`} รอตรวจสอบ การกดต่อจะใช้บิลเดิมและไม่สร้างบิลซ้ำ
                      </p>
                    )}
                  </>
                )}

                {latestReceipt && (
                  <div class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <span>รับชำระสำเร็จ · {latestReceipt.invoiceNo}</span>
                    {latestReceipt.url ? (
                      <a href={latestReceipt.url} target="_blank" rel="noreferrer" class="ml-3 font-semibold underline">เปิดใบเสร็จ PDF</a>
                    ) : (
                      <span class="ml-2">ใบเสร็จยังไม่พร้อม ออกใหม่ได้จากประวัติการเงิน</span>
                    )}
                  </div>
                )}

                <div class="space-y-2 border-t border-zinc-100 pt-4">
                  {paymentMethod === 'transfer' && !slipFile && !pendingBatchId && (
                    <p class="text-xs text-zinc-500">แนบสลิปยอดรวมก่อนยืนยันบิล</p>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting || !allocationsValid || (paymentMethod === 'transfer' && !slipFile && !pendingBatchId)}
                    class="w-full justify-center"
                  >
                    {pendingBatchId
                      ? pendingBatchSlipUploaded ? 'ตรวจสลิปของบิลเดิม' : 'อัปโหลดสลิปและตรวจยอดรวม'
                      : `บันทึกบิลรวม · ฿${paymentTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`}
                  </Button>
                  <Button variant="outline" size="md" type="button" onClick={resetPaymentForm} disabled={isSubmitting} class="w-full justify-center">
                    {pendingBatchId ? 'ปิดฟอร์ม (บิลยังรอตรวจ)' : 'ล้างฟอร์ม'}
                  </Button>
                </div>
              </aside>
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
