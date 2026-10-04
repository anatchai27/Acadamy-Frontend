import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { getChildPayments } from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';

export const normalizePayment = (payment) => ({
  id: payment.id ?? payment.Id ?? payment.invoiceNo,
  invoiceNo: payment.invoiceNo || payment.InvoiceNo || '-',
  description: payment.description || payment.courseName || 'รายการชำระเงิน',
  date: payment.date || payment.paidAt || payment.PaidAt || '-',
  amount: Number(payment.amount ?? payment.Amount ?? 0),
  status: payment.status || payment.Status || 'unknown',
  receiptPdfUrl: payment.receiptPdfUrl || payment.ReceiptPdfUrl || '',
});

export const PaymentsPage = ({ childId }) => {
  const { state } = useLiffContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const selectedChildId = Number(childId || state.activeChildId);

  const loadPayments = () => {
    if (!state.parentToken) {
      route('/liff/login', true);
      return;
    }
    if (!Number.isFinite(selectedChildId) || selectedChildId <= 0) {
      setError('ไม่พบข้อมูลนักเรียนที่เลือก');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    getChildPayments(selectedChildId)
      .then((res) => setPayments((res.data?.data || res.data || []).map(normalizePayment)))
      .catch((apiError) =>
        setError(
          apiError.status === 403
            ? 'ไม่มีสิทธิ์เข้าถึงข้อมูลการเงินของน้องคนนี้'
            : apiError.message || 'โหลดประวัติการเงินไม่สำเร็จ',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(loadPayments, [state.parentToken, selectedChildId]);

  const activeChild = state.children.find((c) => c.id === selectedChildId);

  const downloadReceipt = (payment) => {
    if (!payment.receiptPdfUrl) return;
    setDownloadingId(payment.id);
    window.open(payment.receiptPdfUrl, '_blank', 'noopener,noreferrer');
    setDownloadingId(null);
  };

  return (
    <LiffLayout showBack>
      <div class="space-y-4">
        <div>
          <h1 class="text-xl font-bold">ประวัติการเงิน</h1>
          {activeChild && <p class="text-sm text-gray-500">{activeChild.fullName}</p>}
        </div>

        {error && (
          <div role="alert" class="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <p>{error}</p>
            <button type="button" onClick={loadPayments} class="mt-3 min-h-10 rounded-xl bg-red-600 px-4 text-white">
              ลองโหลดใหม่
            </button>
          </div>
        )}
        {loading ? (
          <div class="flex justify-center py-10">
            <div class="h-8 w-8 rounded-full border-3 border-blue-500/30 border-t-blue-500 animate-spin" />
          </div>
        ) : !error && payments.length === 0 ? (
          <div class="text-center py-10 text-gray-400">
            <p>ไม่มีรายการเงิน</p>
          </div>
        ) : (
          !error && (
            <div class="space-y-2">
              {payments.map((p) => (
                <div key={p.id} class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-medium text-sm">{p.description || p.invoiceNo}</p>
                      <p class="text-xs text-gray-400">{p.date}</p>
                    </div>
                    <div class="text-right">
                      <p class={`font-semibold ${p.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {p.amount > 0 ? `-฿${p.amount.toLocaleString()}` : `+฿${Math.abs(p.amount).toLocaleString()}`}
                      </p>
                      <span
                        class={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : p.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.status === 'paid' ? 'ชำระแล้ว' : p.status === 'pending' ? 'รอตรวจสอบ' : p.status}
                      </span>
                    </div>
                  </div>
                  {p.receiptPdfUrl && (
                    <button
                      type="button"
                      onClick={() => downloadReceipt(p)}
                      disabled={downloadingId === p.id}
                      class="mt-3 min-h-10 w-full rounded-xl border border-sage-200 text-sm font-bold text-sage-700 disabled:opacity-50"
                    >
                      {downloadingId === p.id ? 'กำลังเปิดใบเสร็จ...' : 'ดาวน์โหลดใบเสร็จ PDF'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </LiffLayout>
  );
};
