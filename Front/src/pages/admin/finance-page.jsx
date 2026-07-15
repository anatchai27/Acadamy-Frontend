import { useState, useEffect } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { DataTable, SolidInput, Button, StatusBadge, showToast } from '../../components/ui';
import { financeService } from '../../services';
import { useAbortController } from '../../hooks';

const mockCourses = [
  { id: 1, name: 'คณิตศาสตร์ ป.4', price: 2500 },
  { id: 2, name: 'ภาษาอังกฤษ ม.1', price: 3000 },
  { id: 3, name: 'ฟิสิกส์ ม.4', price: 3500 },
];

const mockPayments = [
  { id: 1, date: '2026-06-15', student: 'สมชาย ใจดี', course: 'คณิตศาสตร์ ป.4', amount: 2500, method: 'โอนเงิน', status: 'paid' },
  { id: 2, date: '2026-06-14', student: 'สมศรี มีสุข', course: 'ภาษาอังกฤษ ม.1', amount: 3000, method: 'เงินสด', status: 'paid' },
  { id: 3, date: '2026-06-13', student: 'วิชัย รักเรียน', course: 'ฟิสิกส์ ม.4', amount: 3500, method: 'โอนเงิน', status: 'pending' },
  { id: 4, date: '2026-06-12', student: 'นภา ตั้งใจ', course: 'คณิตศาสตร์ ป.4', amount: 2500, method: 'โอนเงิน', status: 'paid' },
  { id: 5, date: '2026-06-10', student: 'กรกฎ พากเพียร', course: 'ภาษาอังกฤษ ม.1', amount: 3000, method: 'เงินสด', status: 'paid' },
  { id: 6, date: '2026-06-08', student: 'มณี แสงทอง', course: 'ฟิสิกส์ ม.4', amount: 3500, method: 'โอนเงิน', status: 'paid' },
  { id: 7, date: '2026-06-05', student: 'ณัฐวุฒิ มั่นคง', course: 'คณิตศาสตร์ ป.4', amount: 2500, method: 'โอนเงิน', status: 'unpaid' },
  { id: 8, date: '2026-06-03', student: 'พิมพ์ใจ งามดี', course: 'ภาษาอังกฤษ ม.1', amount: 3000, method: 'เงินสด', status: 'paid' },
  { id: 9, date: '2026-06-01', student: 'ภาณุ เก่งกล้า', course: 'ฟิสิกส์ ม.4', amount: 3500, method: 'โอนเงิน', status: 'paid' },
  { id: 10, date: '2026-05-28', student: 'สุพัตรา จิตดี', course: 'คณิตศาสตร์ ป.4', amount: 2500, method: 'เงินสด', status: 'paid' },
];

const paymentColumns = [
  { key: 'date', label: 'วันที่' },
  { key: 'student', label: 'นักเรียน' },
  { key: 'course', label: 'คอร์สเรียน' },
  {
    key: 'amount',
    label: 'ยอดเงิน',
    align: 'right',
    render: (value) => <span class="font-bold">฿{value?.toLocaleString?.() || value}</span>,
  },
  { key: 'method', label: 'ช่องทาง', align: 'center' },
  {
    key: 'status',
    label: 'สถานะ',
    align: 'center',
    render: (value) => <StatusBadge status={value} />,
  },
];

export function FinancePage({ path }) {
  const [mode, setMode] = useState('form'); // 'form' | 'history'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payments, setPayments] = useState(mockPayments);
  const getSignal = useAbortController();

  const [form, setForm] = useState({
    studentName: '', course: '', amount: '', method: 'โอนเงิน',
  });

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.amount) {
      showToast('กรุณากรอกชื่อนักเรียนและยอดเงิน', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        enrollmentId: form.course ? mockCourses.find((c) => c.name === form.course)?.id : 1,
        amount: Number(form.amount),
        method: form.method === 'โอนเงิน' ? 'transfer' : 'cash',
        slipUrl: '',
      };
      const res = await financeService.createPayment(payload);
      const invoiceNo = res.data?.data?.invoiceNo || res.data?.invoiceNo || `INV-${Date.now()}`;
      showToast(`บันทึกสำเร็จ! เลข Invoice: ${invoiceNo}`, 'success');
      setForm({ studentName: '', course: '', amount: '', method: 'โอนเงิน' });
    } catch {
      showToast('บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateFilter = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await financeService.getPayments(params, { signal: getSignal() });
      const paymentsData = res.data?.data?.payments || res.data?.payments || res.data || [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch {
      const filtered = mockPayments.filter((p) => {
        if (startDate && p.date < startDate) return false;
        if (endDate && p.date > endDate) return false;
        return true;
      });
      setPayments(filtered);
    }
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
        /* Payment Form */
        <div class="max-w-2xl">
          <form onSubmit={handleSubmitPayment}>
            <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-6 space-y-5">
              <SolidInput
                label="ชื่อนักเรียน"
                placeholder="พิมพ์ชื่อหรือเลือกจากรายชื่อ"
                value={form.studentName}
                onInput={updateField('studentName')}
              />

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-200">
                  คอร์สเรียน
                </label>
                <select
                  value={form.course}
                  onChange={updateField('course')}
                  class="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                >
                  <option value="">เลือกคอร์สเรียน</option>
                  {mockCourses.map((c) => (
                    <option key={c.id} value={c.name}>{c.name} (฿{c.price.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <SolidInput
                label="ยอดเงิน (บาท)"
                type="number"
                placeholder="0.00"
                value={form.amount}
                onInput={updateField('amount')}
              />

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-200">
                  ช่องทางชำระเงิน
                </label>
                <div class="flex gap-2">
                  {['โอนเงิน', 'เงินสด'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updateField('method')({ target: { value: m } })}
                      class={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                        form.method === m
                          ? 'bg-amber-500 text-white'
                          : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

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
                <Button variant="outline" size="md" type="button" onClick={() => setForm({ studentName: '', course: '', amount: '', method: 'โอนเงิน' })}>
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
