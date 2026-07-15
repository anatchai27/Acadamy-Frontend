import { useState, useEffect } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { DataTable, SolidInput, Button, StatusBadge, showToast } from '../../components/ui';
import { financeService, courseService } from '../../services';

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
    render: (value) => <span class="font-bold">฿{Number(value).toLocaleString()}</span>,
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

  useEffect(() => {
    courseService.getCourses()
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
      const res = await financeService.getPayments(params);
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
        slipUrl: form.slipUrl.trim() || undefined,
      };
      const res = await financeService.createPayment(payload);
      const invoiceNo = res.data?.data?.invoiceNo || res.data?.invoiceNo || `INV-${Date.now()}`;
      showToast(`บันทึกสำเร็จ! เลข Invoice: ${invoiceNo}`, 'success');
      setForm({ enrollmentId: '', amount: '', method: 'transfer', slipUrl: '' });
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
        <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">การเงิน</h2>
        <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">จัดการบันทึกรายรับและดูประวัติการเงิน</p>
      </div>

      {/* Mode Switcher */}
      <div class="inline-flex rounded-sm border border-slate-300 dark:border-slate-600 overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setMode('form')}
          class={`px-5 py-2.5 text-sm font-medium transition-colors ${
            mode === 'form'
              ? 'bg-amber-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          บันทึกรับเงิน
        </button>
        <button
          type="button"
          onClick={() => setMode('history')}
          class={`px-5 py-2.5 text-sm font-medium transition-colors ${
            mode === 'history'
              ? 'bg-amber-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          ประวัติการเงิน
        </button>
      </div>

      {mode === 'form' ? (
        <div class="max-w-2xl">
          <form onSubmit={handleSubmitPayment}>
            <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-6 space-y-5">
              <SolidInput
                label="Enrollment ID"
                placeholder="รหัสการลงทะเบียน"
                type="number"
                value={form.enrollmentId}
                onInput={updateField('enrollmentId')}
              />

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-200">
                  เลือกคอร์ส (อ้างอิง)
                </label>
                <select
                  value={form.enrollmentId}
                  onChange={updateField('enrollmentId')}
                  class="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
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
                <label class="text-sm font-medium text-slate-900 dark:text-slate-200">
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
                      class={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                        form.method === m.value
                          ? 'bg-amber-500 text-white'
                          : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <SolidInput
                label="ลิงก์สลิป (URL)"
                placeholder="https://..."
                value={form.slipUrl}
                onInput={updateField('slipUrl')}
              />

              {/* Slip Upload */}
              <div class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-sm p-8 text-center cursor-pointer hover:border-amber-400 transition-colors">
                <svg class="h-8 w-8 mx-auto mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  ลากไฟล์สลิปมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                </p>
              </div>

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
          <div class="flex flex-wrap items-end gap-3 mb-6 bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">ตั้งแต่วันที่</label>
              <input
                type="date"
                value={startDate}
                onInput={(e) => setStartDate(e.target.value)}
                class="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">ถึงวันที่</label>
              <input
                type="date"
                value={endDate}
                onInput={(e) => setEndDate(e.target.value)}
                class="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
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
