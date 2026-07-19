import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { DataTable, SolidInput, Button, showToast, DatePickerInput, ImageUpload } from '../../components/ui';
import { financeService, courseService, uploadService } from '../../services';
import { useAbortController } from '../../hooks';

const paymentColumns = [
  {
    key: 'paidAt',
    label: 'วันที่',
    render: (value) => {
      if (!value) return '-';
      try { return new Date(value).toLocaleDateString('th-TH'); } catch { return value; }
    },
  },
  { key: 'studentName', label: 'นักเรียน' },
  { key: 'courseName', label: 'คอร์สเรียน' },
  {
    key: 'amount',
    label: 'ยอดเงิน',
    align: 'right',
    render: (value) => <span class="font-semibold">฿{Number(value).toLocaleString()}</span>,
  },
  { key: 'method', label: 'ช่องทาง', align: 'center' },
  {
    key: 'invoiceNo',
    label: 'เลข Invoice',
    render: (value) => <span class="text-xs font-mono">{value || '-'}</span>,
  },
];

export function FinancePage({ path }) {
  const [mode, setMode] = useState('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({
    enrollmentId: '', amount: '', method: 'transfer', slipUrl: '',
  });
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const getSignal = useAbortController();

  useEffect(() => {
    courseService.getCourses({ signal: getSignal() })
      .then((res) => {
        const payload = res.data?.data || res.data || {};
        setCourses(payload.courses || (Array.isArray(payload) ? payload : []));
      })
      .catch(() => {});
  }, []);

  const fetchPayments = async () => {
    setPaymentLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await financeService.getPayments(params, { signal: getSignal() });
      const payload = res.data?.data || res.data || {};
      setPayments(payload.payments || (Array.isArray(payload) ? payload : []));
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลการเงินได้', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'history') fetchPayments();
  }, [mode]);

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!form.enrollmentId || !form.amount) {
      showToast('กรุณากรอก Enrollment ID และยอดเงิน', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        enrollmentId: Number(form.enrollmentId),
        amount: Number(form.amount),
        method: form.method,
        slipUrl: undefined,
      };
      const res = await financeService.createPayment(payload);
      const paymentId = res.data?.data?.id || res.data?.id;
      const invoiceNo = res.data?.data?.invoiceNo || res.data?.invoiceNo || `INV-${Date.now()}`;

      if (slipFile && paymentId) {
        await uploadService.uploadPaymentSlip(slipFile, paymentId);
      }

      showToast(`บันทึกสำเร็จ! เลข Invoice: ${invoiceNo}`, 'success');
      setForm({ enrollmentId: '', amount: '', method: 'transfer', slipUrl: '' });
      setSlipFile(null);
      setSlipPreview(null);
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'บันทึกไม่สำเร็จ';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateFilter = async () => {
    fetchPayments();
  };

  return (
    <AdminLayout path={path}>
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">การเงิน</h2>
        <p class="text-sm text-zinc-500 mt-1">จัดการบันทึกรายรับและดูประวัติการเงิน</p>
      </div>

      {/* Mode Switcher */}
      <div class="inline-flex rounded-xl bg-zinc-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode('form')}
          class={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'form'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          บันทึกรับเงิน
        </button>
        <button
          type="button"
          onClick={() => setMode('history')}
          class={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'history'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          ประวัติการเงิน
        </button>
      </div>

      {mode === 'form' ? (
        <div class="max-w-2xl">
          <form onSubmit={handleSubmitPayment}>
            <div class="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-5 shadow-sm">
              <SolidInput
                label="Enrollment ID"
                placeholder="รหัสการลงทะเบียน"
                type="number"
                value={form.enrollmentId}
                onInput={updateField('enrollmentId')}
              />

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-zinc-800">
                  เลือกคอร์ส (อ้างอิง)
                </label>
                <select
                  value={form.enrollmentId}
                  onChange={updateField('enrollmentId')}
                  class="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10 text-zinc-800"
                >
                  <option value="">-- เลือกคอร์สเพื่อกรอก ID --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.price ? `(฿${c.price})` : ''}</option>
                  ))}
                </select>
              </div>

              <SolidInput
                label="ยอดเงิน (บาท)"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.amount}
                onInput={updateField('amount')}
              />

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-zinc-800">
                  ช่องทางชำระเงิน
                </label>
                <div class="flex gap-2">
                  {[
                    { label: 'โอนเงิน', value: 'transfer' },
                    { label: 'เงินสด', value: 'cash' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => updateField('method')({ target: { value: m.value } })}
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

              <ImageUpload
              label="สลิปการชำระเงิน"
              preview={slipPreview}
              onChange={(base64, file) => {
                setSlipPreview(base64);
                setSlipFile(file);
              }}
            />

              <div class="flex gap-3 pt-2">
                <Button variant="primary" size="md" type="submit" loading={isSubmitting} disabled={isSubmitting}>
                  บันทึกการรับเงิน
                </Button>
                <Button variant="outline" size="md" type="button" onClick={() => setForm({ enrollmentId: '', amount: '', method: 'transfer', slipUrl: '' })}>
                  ล้างฟอร์ม
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* Payment History */
        <div>
          <div class="flex flex-wrap items-end gap-3 mb-6 bg-zinc-50 rounded-2xl border border-zinc-100 p-4">
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
            <Button variant="primary" size="md" onClick={handleDateFilter}>
              กรองข้อมูล
            </Button>
          </div>

          <DataTable
            columns={paymentColumns}
            data={payments}
            keyField="id"
            pageSize={10}
            emptyMessage="ไม่พบข้อมูลการชำระเงิน"
          />
        </div>
      )}
    </AdminLayout>
  );
}