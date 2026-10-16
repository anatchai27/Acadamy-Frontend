import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import {
  createChildPaymentBatch,
  getChildPayableBalances,
  getChildPayments,
  uploadPaymentBatchSlip,
  uploadPaymentSlip,
} from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';
import { compressImageFile } from '../utils/image-compression';
import { validatePaymentSlip } from '../utils/validation';

const formatBaht = amount => `฿${Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const normalizePayment = (payment) => ({
  id: payment.id ?? payment.Id ?? payment.invoiceNo,
  batchId: payment.batchId ?? payment.BatchId ?? null,
  invoiceNo: payment.invoiceNo || payment.InvoiceNo || '-',
  description: payment.description || payment.courseName || 'รายการชำระเงิน',
  date: payment.date || payment.paidAt || payment.PaidAt || '-',
  amount: Number(payment.amount ?? payment.Amount ?? 0),
  status: payment.status || payment.Status || 'unknown',
  slipUrl: payment.slipUrl || payment.SlipUrl || '',
  receiptPdfUrl: payment.receiptPdfUrl || payment.ReceiptPdfUrl || '',
});

export const normalizePayableBalance = balance => ({
  enrollmentId: Number(balance.enrollmentId ?? balance.EnrollmentId),
  studentId: Number(balance.studentId ?? balance.StudentId),
  studentName: balance.studentName || balance.StudentName || '',
  courseName: balance.courseName || balance.CourseName || 'ค่าเรียน',
  amountDue: Number(balance.amountDue ?? balance.AmountDue ?? 0),
  instituteName: balance.instituteName || balance.InstituteName || '',
  instituteContactPhone: balance.instituteContactPhone || balance.InstituteContactPhone || '',
});

export const PaymentsPage = ({ childId }) => {
  const { state } = useLiffContext();
  const [payments, setPayments] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [creatingEnrollmentId, setCreatingEnrollmentId] = useState(null);
  const [activeBatch, setActiveBatch] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const selectedChildId = Number(childId || state.activeChildId);

  const loadPayments = (showLoading = false) => {
    if (!state.parentToken) {
      route('/liff/login', true);
      return;
    }
    if (!Number.isFinite(selectedChildId) || selectedChildId <= 0) {
      setError('ไม่พบข้อมูลนักเรียนที่เลือก');
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    setError('');
    Promise.all([getChildPayments(selectedChildId), getChildPayableBalances(selectedChildId)])
      .then(([paymentResponse, balanceResponse]) => {
        setPayments((paymentResponse.data?.data || paymentResponse.data || []).map(normalizePayment));
        setBalances((balanceResponse.data?.data || balanceResponse.data || []).map(normalizePayableBalance));
      })
      .catch((apiError) =>
        setError(
          apiError.status === 403
            ? 'ไม่มีสิทธิ์เข้าถึงข้อมูลการเงินของน้องคนนี้'
            : apiError.message || 'โหลดประวัติการเงินไม่สำเร็จ',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => loadPayments(true), [state.parentToken, selectedChildId]);

  useEffect(() => {
    if (!slipFile) {
      setSlipPreviewUrl('');
      return undefined;
    }
    const previewUrl = URL.createObjectURL(slipFile);
    setSlipPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [slipFile]);

  const activeChild = state.children.find((c) => c.id === selectedChildId);
  const pendingPayments = payments.filter(payment => payment.status === 'pending');
  const settledPayments = payments.filter(payment => payment.status !== 'pending');
  const totalDue = balances.reduce((total, balance) => total + balance.amountDue, 0);

  const startPayment = async balance => {
    setActionError('');
    setNotice('');
    setCreatingEnrollmentId(balance.enrollmentId);
    try {
      const response = await createChildPaymentBatch(selectedChildId, balance.enrollmentId);
      const batch = response.data?.data || response.data;
      setActiveBatch({
        batchId: batch.batchId ?? batch.BatchId,
        invoiceNo: batch.invoiceNo ?? batch.InvoiceNo,
        amount: Number(batch.amount ?? batch.Amount ?? balance.amountDue),
        courseName: balance.courseName,
        instituteName: balance.instituteName,
        instituteContactPhone: balance.instituteContactPhone,
      });
      setSlipFile(null);
      setNotice('สร้างรายการชำระแล้ว โอนตามข้อมูลบัญชีของสถาบัน แล้วแนบสลิปได้เลย');
      loadPayments();
    } catch (apiError) {
      setActionError(apiError.message || 'เริ่มรายการชำระไม่สำเร็จ ลองโหลดข้อมูลใหม่');
      if (apiError.status === 409) loadPayments();
    } finally {
      setCreatingEnrollmentId(null);
    }
  };

  const continuePayment = payment => {
    setActionError('');
    setNotice('');
    setSlipFile(null);
    setActiveBatch({
      batchId: payment.batchId,
      paymentId: payment.batchId ? null : payment.id,
      invoiceNo: payment.invoiceNo,
      amount: payment.amount,
      courseName: payment.description,
    });
  };

  const handleSlipFile = async event => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const validationError = validatePaymentSlip(file);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    setActionError('');
    try {
      setSlipFile(await compressImageFile(file, 2 * 1024 * 1024));
    } catch (compressionError) {
      setActionError(compressionError.message || 'เตรียมรูปสลิปไม่สำเร็จ ลองเลือกรูปใหม่');
    }
  };

  const submitSlip = async event => {
    event.preventDefault();
    if ((!activeBatch?.batchId && !activeBatch?.paymentId) || !slipFile) return;
    setActionError('');
    setUploading(true);
    try {
      if (activeBatch.batchId) {
        await uploadPaymentBatchSlip(activeBatch.batchId, slipFile);
      } else {
        await uploadPaymentSlip(activeBatch.paymentId, slipFile);
      }
      setActiveBatch(null);
      setSlipFile(null);
      setNotice('ส่งสลิปแล้ว รายการกำลังรอสถาบันตรวจสอบ');
      loadPayments();
    } catch (apiError) {
      setActionError(apiError.message || 'ส่งสลิปไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setUploading(false);
    }
  };

  const copyInvoiceNo = async () => {
    try {
      await navigator.clipboard.writeText(activeBatch.invoiceNo);
      setNotice('คัดลอกเลขอ้างอิงแล้ว');
    } catch {
      setNotice(`เลขอ้างอิงสำหรับแจ้งโอน: ${activeBatch.invoiceNo}`);
    }
  };

  const downloadReceipt = (payment) => {
    if (!payment.receiptPdfUrl) return;
    setDownloadingId(payment.id);
    window.open(payment.receiptPdfUrl, '_blank', 'noopener,noreferrer');
    setDownloadingId(null);
  };

  return (
    <LiffLayout showBack>
      <div class="space-y-6">
        <header>
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">ชำระค่าเรียน</h1>
          {activeChild && <p class="mt-1 text-sm text-ink-700">ของ {activeChild.fullName}</p>}
        </header>

        {notice && <p role="status" class="rounded-2xl bg-sage-100 px-4 py-3 text-sm font-semibold text-sage-700">{notice}</p>}
        {actionError && <p role="alert" class="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{actionError}</p>}

        {loading ? (
          <div class="flex justify-center py-12" role="status" aria-label="กำลังโหลดข้อมูลการชำระเงิน">
            <div class="h-8 w-8 animate-spin rounded-full border-3 border-sage-200 border-t-sage-600" />
          </div>
        ) : error ? (
          <div role="alert" class="rounded-card bg-white p-5 text-center shadow-soft">
            <p class="text-sm font-semibold text-red-700">{error}</p>
            <button type="button" onClick={() => loadPayments(true)} class="mt-3 min-h-11 rounded-xl bg-sage-700 px-4 font-bold text-white">
              ลองโหลดใหม่
            </button>
          </div>
        ) : (
          <>
            <section class="rounded-card bg-sage-700 px-5 py-4 text-white shadow-soft" aria-label="ยอดค้างชำระ">
              <p class="text-sm font-semibold text-sage-100">ยอดที่ยังชำระได้</p>
              <p class="mt-1 text-2xl font-bold">{formatBaht(totalDue)}</p>
            </section>

            {activeBatch && (
              <section class="rounded-card border border-sage-200 bg-white p-5 shadow-soft" aria-labelledby="active-payment-title">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="active-payment-title" class="text-lg font-bold text-ink-900">{activeBatch.courseName}</h2>
                    <p class="mt-1 text-sm text-ink-700">ยอดโอน {formatBaht(activeBatch.amount)}</p>
                  </div>
                  <button type="button" onClick={() => setActiveBatch(null)} class="min-h-10 px-2 text-sm font-semibold text-ink-700">ปิด</button>
                </div>

                <div class="mt-4 rounded-2xl bg-sage-50 p-4">
                  <p class="font-bold text-ink-900">โอนแล้วส่งสลิปได้ในหน้านี้</p>
                  <ol class="mt-3 space-y-2 text-sm leading-6 text-ink-700">
                    <li class="flex gap-2"><span class="font-bold text-sage-700">1.</span><span>โอนยอดนี้ไปยังบัญชีที่สถาบันแจ้งไว้</span></li>
                    <li class="flex gap-2"><span class="font-bold text-sage-700">2.</span><span>ใส่เลขอ้างอิงในหมายเหตุการโอน เพื่อจับคู่รายการได้เร็วขึ้น</span></li>
                    <li class="flex gap-2"><span class="font-bold text-sage-700">3.</span><span>ถ่ายรูปหรือเลือกรูปสลิป แล้วกดส่งให้สถาบันตรวจสอบ</span></li>
                  </ol>
                  {activeBatch.instituteName && <p class="mt-3 text-xs text-ink-700">{activeBatch.instituteName}</p>}
                  {activeBatch.instituteContactPhone && (
                    <a href={`tel:${activeBatch.instituteContactPhone}`} class="mt-2 inline-flex min-h-10 items-center font-bold text-sage-700 underline underline-offset-2">
                      สอบถามบัญชีรับโอน · {activeBatch.instituteContactPhone}
                    </a>
                  )}
                </div>

                <div class="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-sage-100 px-4 py-3">
                  <div class="min-w-0">
                    <p class="text-xs text-ink-700">เลขอ้างอิง</p>
                    <p class="truncate font-bold text-ink-900">{activeBatch.invoiceNo}</p>
                  </div>
                  <button type="button" onClick={copyInvoiceNo} class="min-h-10 shrink-0 rounded-xl bg-sage-100 px-3 text-sm font-bold text-sage-700">คัดลอก</button>
                </div>

                <form onSubmit={submitSlip} class="mt-4 space-y-3">
                  <label for="payment-slip" class="flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-sage-400 bg-sage-50 px-4 text-center font-bold text-sage-700 transition hover:bg-sage-100 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sage-600">
                    {slipFile ? 'เลือกรูปอื่น' : 'ถ่ายรูปสลิป / เลือกรูปจากเครื่อง'}
                    <input id="payment-slip" type="file" accept="image/*" capture="environment" onChange={handleSlipFile} class="sr-only" />
                  </label>
                  {slipPreviewUrl && (
                    <div class="overflow-hidden rounded-2xl border border-sage-100">
                      <img src={slipPreviewUrl} alt="ตัวอย่างรูปสลิปที่เลือก" class="max-h-72 w-full object-contain" />
                      <button type="button" onClick={() => setSlipFile(null)} class="min-h-10 w-full bg-white text-sm font-bold text-ink-700">เอารูปออก</button>
                    </div>
                  )}
                  <p class="text-xs leading-5 text-ink-700">รับไฟล์รูปภาพ ระบบย่อขนาดให้อัตโนมัติ และส่งไปยังสถาบันเพื่อตรวจสอบ</p>
                  <button type="submit" disabled={!slipFile || uploading} class="min-h-12 w-full rounded-2xl bg-sage-700 px-4 font-bold text-white transition hover:bg-sage-600 disabled:cursor-not-allowed disabled:opacity-50">
                    {uploading ? 'กำลังส่งสลิป…' : 'ส่งสลิปให้สถาบันตรวจสอบ'}
                  </button>
                </form>
              </section>
            )}

            <section aria-labelledby="payable-title">
              <div class="mb-3 flex items-end justify-between gap-3">
                <h2 id="payable-title" class="text-lg font-bold text-ink-900">ยอดที่ต้องชำระ</h2>
                <span class="text-sm text-ink-700">{balances.length} รายการ</span>
              </div>
              {balances.length ? (
                <div class="divide-y divide-sage-100 overflow-hidden rounded-card border border-sage-100 bg-white shadow-soft">
                  {balances.map(balance => (
                    <article key={balance.enrollmentId} class="flex items-center justify-between gap-3 p-4">
                      <div class="min-w-0">
                        <p class="truncate font-bold text-ink-900">{balance.courseName}</p>
                        <p class="mt-1 font-semibold text-sage-700">{formatBaht(balance.amountDue)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startPayment(balance)}
                        disabled={creatingEnrollmentId !== null}
                        class="min-h-11 shrink-0 rounded-xl bg-sage-700 px-4 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {creatingEnrollmentId === balance.enrollmentId ? 'กำลังเตรียม…' : 'ชำระเงิน'}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p class="rounded-2xl bg-white px-4 py-5 text-sm text-ink-700">ไม่มียอดค้างที่ต้องชำระ</p>
              )}
            </section>

            <section aria-labelledby="pending-title">
              <h2 id="pending-title" class="mb-3 text-lg font-bold text-ink-900">รายการรอตรวจสอบ</h2>
              {pendingPayments.length ? (
                <div class="divide-y divide-gold-100 overflow-hidden rounded-card border border-gold-100 bg-white shadow-soft">
                  {pendingPayments.map(payment => (
                    <article key={payment.id} class="p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="truncate font-bold text-ink-900">{payment.description}</p>
                          <p class="mt-1 text-xs text-ink-700">{payment.invoiceNo} · {payment.date}</p>
                        </div>
                        <div class="shrink-0 text-right">
                          <p class="font-bold text-ink-900">{formatBaht(payment.amount)}</p>
                          <span class="text-xs font-semibold text-gold-600">{payment.slipUrl ? 'ส่งสลิปแล้ว' : 'ยังไม่ได้แนบสลิป'}</span>
                        </div>
                      </div>
                      {(payment.batchId || payment.id > 0) && !payment.slipUrl && (
                        <button type="button" onClick={() => continuePayment(payment)} class="mt-3 min-h-11 w-full rounded-xl border border-sage-200 font-bold text-sage-700">แนบสลิป</button>
                      )}
                      {payment.slipUrl && <p class="mt-2 text-xs text-ink-700">ส่งสลิปแล้ว รอสถาบันตรวจสอบ</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <p class="rounded-2xl bg-white px-4 py-5 text-sm text-ink-700">ยังไม่มีรายการรอตรวจสอบ</p>
              )}
            </section>

            {settledPayments.length > 0 && (
              <section aria-labelledby="history-title">
                <h2 id="history-title" class="mb-3 text-lg font-bold text-ink-900">ประวัติการชำระ</h2>
                <div class="divide-y divide-sage-100 overflow-hidden rounded-card border border-sage-100 bg-white shadow-soft">
                  {settledPayments.map(payment => (
                    <article key={payment.id} class="p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="truncate font-bold text-ink-900">{payment.description}</p>
                          <p class="mt-1 text-xs text-ink-700">{payment.invoiceNo} · {payment.date}</p>
                        </div>
                        <div class="shrink-0 text-right">
                          <p class="font-bold text-ink-900">{formatBaht(payment.amount)}</p>
                          <span class="text-xs font-semibold text-sage-700">{payment.status === 'paid' ? 'ชำระแล้ว' : payment.status}</span>
                        </div>
                      </div>
                      {payment.receiptPdfUrl && (
                        <button
                          type="button"
                          onClick={() => downloadReceipt(payment)}
                          disabled={downloadingId === payment.id}
                          class="mt-3 min-h-11 w-full rounded-xl border border-sage-200 text-sm font-bold text-sage-700 disabled:opacity-50"
                        >
                          {downloadingId === payment.id ? 'กำลังเปิดใบเสร็จ…' : 'เปิดใบเสร็จ PDF'}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </LiffLayout>
  );
};
