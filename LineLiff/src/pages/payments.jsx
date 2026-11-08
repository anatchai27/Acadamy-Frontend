import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import {
  createChildPaymentBatch,
  createChildOnlinePaymentBatch,
  getChildPayableBalances,
  getChildPayments,
  refreshChildOnlinePaymentStatus,
  uploadPaymentBatchSlip,
  uploadPaymentSlip,
} from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';
import { compressImageFile } from '../utils/image-compression';
import { validatePaymentSlip } from '../utils/validation';
import { formatPhoneNumber } from '../utils/phone';
import { FoxSticker } from '../components/fox-sticker';

const formatBaht = amount => `฿${Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hasPaymentDestination = payment => Boolean(payment.bankAccountNumber || payment.promptPayId || payment.paymentQrImageUrl);
const paymentStatusLabel = status => ({
  paid: 'ชำระแล้ว',
  succeeded: 'ชำระแล้ว',
  pending: 'รอตรวจสอบ',
  failed: 'ชำระไม่สำเร็จ',
  cancelled: 'ยกเลิกรายการ',
  expired: 'หมดอายุ',
  refunded: 'คืนเงินแล้ว',
  partially_refunded: 'คืนเงินบางส่วน',
}[status] || status || 'ไม่ทราบสถานะ');
const paymentStatusClass = status => ['paid', 'succeeded'].includes(status)
  ? 'text-emerald-700'
  : ['failed', 'cancelled', 'expired', 'refunded', 'partially_refunded'].includes(status)
    ? 'text-red-700'
    : 'text-amber-800';
const installmentBanks = [
  { value: 'installment_bay', label: 'กรุงศรี', minimum: 500, terms: [3, 4, 6, 9, 10] },
  { value: 'installment_bbl', label: 'ธนาคารกรุงเทพ', minimum: 500, terms: [3, 4, 5, 6, 7, 8, 9, 10] },
  { value: 'installment_first_choice', label: 'กรุงศรี เฟิร์สช้อยส์', minimum: 300, terms: [3, 4, 6, 9, 10, 12, 18, 24, 36] },
  { value: 'installment_kbank', label: 'กสิกรไทย', minimum: 0, terms: [3, 4, 6, 10] },
  { value: 'installment_ktc', label: 'บัตร KTC', minimum: 0, terms: [3, 4, 5, 6, 7, 8, 9, 10] },
  { value: 'installment_scb', label: 'ไทยพาณิชย์', minimum: 500, terms: [3, 4, 6, 9, 10] },
  { value: 'installment_uob', label: 'ยูโอบี', minimum: 500, terms: [3, 4, 6, 10] },
  { value: 'installment_ttb', label: 'ทีทีบี', minimum: 500, terms: [3, 4, 6, 10] },
];
const installmentBankLabel = bankType => installmentBanks.find(bank => bank.value === bankType)?.label || bankType;

export const normalizePayment = (payment) => ({
  id: payment.id ?? payment.Id ?? payment.invoiceNo,
  batchId: payment.batchId ?? payment.BatchId ?? null,
  invoiceNo: payment.invoiceNo || payment.InvoiceNo || '-',
  description: payment.description || payment.courseName || 'รายการชำระเงิน',
  date: payment.date || payment.paidAt || payment.PaidAt || '-',
  amount: Number(payment.amount ?? payment.Amount ?? 0),
  method: payment.method || payment.Method || 'transfer',
  status: payment.status || payment.Status || 'unknown',
  slipUrl: payment.slipUrl || payment.SlipUrl || '',
  receiptPdfUrl: payment.receiptPdfUrl || payment.ReceiptPdfUrl || '',
  instituteName: payment.instituteName || payment.InstituteName || '',
  instituteContactPhone: payment.instituteContactPhone || payment.InstituteContactPhone || '',
  bankName: payment.bankName || payment.BankName || '',
  bankAccountName: payment.bankAccountName || payment.BankAccountName || '',
  bankAccountNumber: payment.bankAccountNumber || payment.BankAccountNumber || '',
  promptPayId: payment.promptPayId || payment.PromptPayId || '',
  paymentInstructions: payment.paymentInstructions || payment.PaymentInstructions || '',
  paymentQrImageUrl: payment.paymentQrImageUrl || payment.PaymentQrImageUrl || '',
  gatewayQrUrl: payment.gatewayQrUrl || payment.GatewayQrUrl || '',
  checkoutUrl: payment.checkoutUrl || payment.CheckoutUrl || '',
  gatewayExpiresAt: payment.gatewayExpiresAt || payment.GatewayExpiresAt || '',
  installmentBank: payment.installmentBank || payment.InstallmentBank || '',
  installmentTerm: Number(payment.installmentTerm ?? payment.InstallmentTerm ?? 0) || null,
});

export const normalizePayableBalance = balance => ({
  enrollmentId: Number(balance.enrollmentId ?? balance.EnrollmentId),
  studentId: Number(balance.studentId ?? balance.StudentId),
  studentName: balance.studentName || balance.StudentName || '',
  courseName: balance.courseName || balance.CourseName || 'ค่าเรียน',
  amountDue: Number(balance.amountDue ?? balance.AmountDue ?? 0),
  instituteName: balance.instituteName || balance.InstituteName || '',
  instituteContactPhone: balance.instituteContactPhone || balance.InstituteContactPhone || '',
  bankName: balance.bankName || balance.BankName || '',
  bankAccountName: balance.bankAccountName || balance.BankAccountName || '',
  bankAccountNumber: balance.bankAccountNumber || balance.BankAccountNumber || '',
  promptPayId: balance.promptPayId || balance.PromptPayId || '',
  paymentInstructions: balance.paymentInstructions || balance.PaymentInstructions || '',
  paymentQrImageUrl: balance.paymentQrImageUrl || balance.PaymentQrImageUrl || '',
});

export const PaymentsPage = ({ childId }) => {
  const { state } = useLiffContext();
  const [payments, setPayments] = useState([]);
  const [balances, setBalances] = useState([]);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [paymentOptions, setPaymentOptions] = useState({ promptPayEnabled: false, installmentsEnabled: false });
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [installmentSelections, setInstallmentSelections] = useState({});
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
        setPaymentOptions(balanceResponse.data?.paymentOptions || { promptPayEnabled: false, installmentsEnabled: false });
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
    const batchId = Number(new URLSearchParams(window.location.search).get('paymentBatchId'));
    if (!state.parentToken || !Number.isSafeInteger(batchId) || batchId <= 0) return;
    refreshChildOnlinePaymentStatus(selectedChildId, batchId)
      .then(response => {
        setNotice(response.data?.message || response.data?.Message || 'กลับจากหน้าชำระเงินแล้ว');
        loadPayments();
      })
      .catch(apiError => setActionError(apiError.message || 'กลับจากหน้าชำระเงินแล้ว แต่ตรวจสอบสถานะไม่ได้'));
  }, [state.parentToken, selectedChildId]);

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

  const startPayment = async (balance, amount) => {
    setActionError('');
    setNotice('');
    setCreatingEnrollmentId(balance.enrollmentId);
    try {
      const installmentSelection = installmentSelections[balance.enrollmentId] || { bank: 'installment_kbank', term: 3 };
      const response = paymentMethod === 'transfer'
        ? await createChildPaymentBatch(selectedChildId, balance.enrollmentId, amount)
        : await createChildOnlinePaymentBatch(
          selectedChildId,
          balance.enrollmentId,
          amount,
          paymentMethod,
          paymentMethod === 'credit_card_installment' ? installmentSelection.bank : null,
          paymentMethod === 'credit_card_installment' ? Number(installmentSelection.term) : null,
        );
      const batch = response.data?.data || response.data;
      setActiveBatch({
        batchId: batch.batchId ?? batch.BatchId,
        invoiceNo: batch.invoiceNo ?? batch.InvoiceNo,
        amount: Number(batch.amount ?? batch.Amount ?? balance.amountDue),
        courseName: balance.courseName,
        instituteName: balance.instituteName,
        instituteContactPhone: balance.instituteContactPhone,
        bankName: balance.bankName,
        bankAccountName: balance.bankAccountName,
        bankAccountNumber: balance.bankAccountNumber,
        promptPayId: balance.promptPayId,
        paymentInstructions: balance.paymentInstructions,
        paymentQrImageUrl: balance.paymentQrImageUrl,
        method: batch.method ?? batch.Method ?? paymentMethod,
        gatewayQrUrl: batch.gatewayQrUrl ?? batch.GatewayQrUrl ?? '',
        checkoutUrl: batch.checkoutUrl ?? batch.CheckoutUrl ?? '',
        gatewayExpiresAt: batch.gatewayExpiresAt ?? batch.GatewayExpiresAt ?? '',
        installmentBank: batch.installmentBank ?? batch.InstallmentBank ?? '',
        installmentTerm: Number(batch.installmentTerm ?? batch.InstallmentTerm ?? 0) || null,
        status: batch.status ?? batch.Status ?? 'pending',
      });
      setSlipFile(null);
      setNotice(paymentMethod === 'transfer'
        ? 'สร้างรายการชำระแล้ว โอนตามข้อมูลบัญชีของสถาบัน แล้วแนบสลิปได้เลย'
        : paymentMethod === 'promptpay'
          ? 'สร้าง QR พร้อมเพย์ตามยอดนี้แล้ว ชำระผ่าน QR และตรวจสอบสถานะได้ที่รายการนี้'
          : 'เตรียมรายการผ่อนแล้ว ดำเนินการต่อบนหน้าชำระเงินที่ปลอดภัยของ Omise');
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
      instituteName: payment.instituteName,
      instituteContactPhone: payment.instituteContactPhone,
      method: payment.method,
      bankName: payment.bankName,
      bankAccountName: payment.bankAccountName,
      bankAccountNumber: payment.bankAccountNumber,
      promptPayId: payment.promptPayId,
      paymentInstructions: payment.paymentInstructions,
      paymentQrImageUrl: payment.paymentQrImageUrl,
      gatewayQrUrl: payment.gatewayQrUrl,
      checkoutUrl: payment.checkoutUrl,
      gatewayExpiresAt: payment.gatewayExpiresAt,
      installmentBank: payment.installmentBank,
      installmentTerm: payment.installmentTerm,
      status: payment.status,
    });
  };

  const checkPaymentStatus = async batch => {
    if (!batch?.batchId) return;
    setActionError('');
    setUploading(true);
    try {
      const response = await refreshChildOnlinePaymentStatus(selectedChildId, batch.batchId);
      const result = response.data?.data || response.data;
      setActiveBatch(previous => previous?.batchId === batch.batchId ? {
        ...previous,
        status: result.status ?? result.Status ?? previous.status,
        receiptPdfUrl: result.receiptPdfUrl ?? result.ReceiptPdfUrl ?? previous.receiptPdfUrl,
      } : previous);
      setNotice(response.data?.message || response.data?.Message || 'อัปเดตสถานะการชำระแล้ว');
      loadPayments();
    } catch (apiError) {
      setActionError(apiError.message || 'ตรวจสอบสถานะไม่สำเร็จ ลองอีกครั้งเมื่อมีอินเทอร์เน็ต');
    } finally {
      setUploading(false);
    }
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

        {notice && <div role="status" class="rounded-2xl bg-sage-100 px-4 py-3 text-sm font-semibold text-sage-700">{notice === 'ส่งสลิปแล้ว รายการกำลังรอสถาบันตรวจสอบ' ? <FoxSticker action="thumbsUp" message={notice} compact /> : notice}</div>}
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

            {balances.some(balance => balance.amountDue > 0 && !hasPaymentDestination(balance))
              && !paymentOptions.promptPayEnabled && !paymentOptions.installmentsEnabled && (
              <aside role="status" class="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                <p class="font-bold">สถาบันยังไม่ได้ตั้งค่าช่องทางรับชำระเงิน</p>
                <p class="mt-1">จึงยังชำระรายการที่มียอดค้างผ่านระบบไม่ได้ กรุณาติดต่อสถาบันเพื่อสอบถามช่องทางชำระเงิน</p>
              </aside>
            )}

            {activeBatch && (
              <section class="rounded-card border border-sage-200 bg-white p-5 shadow-soft" aria-labelledby="active-payment-title">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="active-payment-title" class="text-lg font-bold text-ink-900">{activeBatch.courseName}</h2>
                    <p class="mt-1 text-sm text-ink-700">ยอดชำระ {formatBaht(activeBatch.amount)}</p>
                  </div>
                  <button type="button" onClick={() => setActiveBatch(null)} class="min-h-10 px-2 text-sm font-semibold text-ink-700">ปิด</button>
                </div>

                <div class="mt-4 rounded-2xl bg-sage-50 p-4">
                  {(activeBatch.method || 'transfer') === 'transfer' ? (
                    <>
                      <p class="font-bold text-ink-900">โอนแล้วส่งสลิปได้ในหน้านี้</p>
                      <ol class="mt-3 space-y-2 text-sm leading-6 text-ink-700">
                        <li class="flex gap-2"><span class="font-bold text-sage-700">1.</span><span>โอนยอดนี้ตามบัญชีรับชำระของสถาบัน</span></li>
                        <li class="flex gap-2"><span class="font-bold text-sage-700">2.</span><span>ใส่เลขอ้างอิงในหมายเหตุการโอน เพื่อให้สถาบันตรวจสอบได้เร็วขึ้น</span></li>
                        <li class="flex gap-2"><span class="font-bold text-sage-700">3.</span><span>ถ่ายรูปหรือเลือกรูปสลิป แล้วส่งให้สถาบันตรวจสอบ</span></li>
                      </ol>
                      {activeBatch.instituteName && <p class="mt-3 text-sm font-bold text-ink-900">{activeBatch.instituteName}</p>}
                      {(activeBatch.bankName || activeBatch.bankAccountName || activeBatch.bankAccountNumber || activeBatch.promptPayId) ? (
                        <dl class="mt-3 space-y-2 rounded-xl bg-white p-3 text-sm">
                          {activeBatch.bankName && <div class="flex flex-wrap justify-between gap-x-3"><dt class="text-ink-700">ธนาคาร</dt><dd class="font-semibold text-ink-900">{activeBatch.bankName}</dd></div>}
                          {activeBatch.bankAccountName && <div class="flex flex-wrap justify-between gap-x-3"><dt class="text-ink-700">ชื่อบัญชี</dt><dd class="font-semibold text-ink-900">{activeBatch.bankAccountName}</dd></div>}
                          {activeBatch.bankAccountNumber && <div class="flex flex-wrap justify-between gap-x-3"><dt class="text-ink-700">เลขที่บัญชี</dt><dd class="font-bold tracking-wide text-ink-900">{activeBatch.bankAccountNumber}</dd></div>}
                          {activeBatch.promptPayId && <div class="flex flex-wrap justify-between gap-x-3"><dt class="text-ink-700">พร้อมเพย์</dt><dd class="font-bold tracking-wide text-ink-900">{activeBatch.promptPayId}</dd></div>}
                        </dl>
                      ) : !activeBatch.paymentQrImageUrl ? (
                        <p class="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">สถาบันยังไม่ได้ระบุบัญชีรับโอน กรุณาติดต่อสถาบันก่อนชำระเงิน</p>
                      ) : null}
                      {activeBatch.paymentQrImageUrl && (
                        <figure class="mt-4 rounded-xl border border-sage-100 bg-white p-3 text-center">
                          <img src={activeBatch.paymentQrImageUrl} alt={`QR Code สำหรับชำระเงินให้${activeBatch.instituteName || 'สถาบัน'}`} class="mx-auto max-h-64 w-full max-w-64 object-contain" loading="lazy" />
                          <figcaption class="mt-2 text-xs leading-5 text-ink-700">QR คงที่ของสถาบัน · ตรวจยอด {formatBaht(activeBatch.amount)} ก่อนยืนยัน</figcaption>
                        </figure>
                      )}
                      {activeBatch.paymentInstructions && <p class="mt-3 text-sm leading-6 text-ink-900">{activeBatch.paymentInstructions}</p>}
                      {activeBatch.instituteContactPhone && (
                        <a href={`tel:${activeBatch.instituteContactPhone}`} class="mt-2 inline-flex min-h-10 items-center font-bold text-sage-700 underline underline-offset-2">
                          สอบถามบัญชีรับโอน · {formatPhoneNumber(activeBatch.instituteContactPhone)}
                        </a>
                      )}
                    </>
                  ) : (activeBatch.method === 'promptpay') ? (
                    <>
                      <p class="font-bold text-ink-900">QR พร้อมเพย์สำหรับยอดนี้</p>
                      {activeBatch.gatewayQrUrl && <figure class="mt-3 rounded-xl border border-sage-100 bg-white p-3 text-center">
                        <img src={activeBatch.gatewayQrUrl} alt={`QR พร้อมเพย์สำหรับยอด ${formatBaht(activeBatch.amount)}`} class="mx-auto max-h-64 w-full max-w-64 object-contain" />
                        <figcaption class="mt-2 text-sm font-bold text-ink-900">สแกนจ่าย {formatBaht(activeBatch.amount)} · เลขอ้างอิง {activeBatch.invoiceNo}</figcaption>
                      </figure>}
                      {activeBatch.gatewayExpiresAt && <p class="mt-3 text-xs leading-5 text-ink-700">QR ใช้ได้ถึง {new Date(activeBatch.gatewayExpiresAt).toLocaleString('th-TH')}</p>}
                      <p class="mt-2 text-sm leading-6 text-ink-700">QR นี้ผูกกับยอดบิลแล้ว ไม่ต้องส่งสลิป ระบบจะตรวจผลจากผู้ให้บริการให้</p>
                    </>
                  ) : (
                    <>
                      <p class="font-bold text-ink-900">ผ่อนชำระผ่านบัตรเครดิต</p>
                      <p class="mt-2 text-sm leading-6 text-ink-700">{installmentBankLabel(activeBatch.installmentBank) || 'เลือกธนาคารที่รองรับ'} · {activeBatch.installmentTerm || '-'} งวด · ยอดตั้งต้น {formatBaht(activeBatch.amount)}</p>
                      <p class="mt-2 text-sm leading-6 text-ink-700">ข้อมูลบัตรจะกรอกบนหน้าชำระที่ปลอดภัยของ Omise เท่านั้น ตรวจยอดต่องวดและดอกเบี้ยก่อนยืนยัน</p>
                    </>
                  )}
                </div>

                <div class="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-sage-100 px-4 py-3">
                  <div class="min-w-0">
                    <p class="text-xs text-ink-700">เลขอ้างอิง</p>
                    <p class="truncate font-bold text-ink-900">{activeBatch.invoiceNo}</p>
                  </div>
                  <button type="button" onClick={copyInvoiceNo} class="min-h-10 shrink-0 rounded-xl bg-sage-100 px-3 text-sm font-bold text-sage-700">คัดลอก</button>
                </div>

                {(activeBatch.method || 'transfer') === 'transfer' && <form onSubmit={submitSlip} class="mt-4 space-y-3">
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
                </form>}
                {activeBatch.method === 'promptpay' && activeBatch.status === 'pending' && <button type="button" onClick={() => checkPaymentStatus(activeBatch)} disabled={uploading} class="mt-4 min-h-12 w-full rounded-2xl bg-sage-700 px-4 font-bold text-white disabled:opacity-50">{uploading ? 'กำลังตรวจสอบ…' : 'ชำระแล้ว · ตรวจสอบสถานะ'}</button>}
                {activeBatch.method === 'credit_card_installment' && activeBatch.status === 'pending' && activeBatch.checkoutUrl && <a href={activeBatch.checkoutUrl} class="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-sage-700 px-4 text-center font-bold text-white">ไปหน้าชำระเงินปลอดภัยของ Omise</a>}
                {(activeBatch.method === 'credit_card_installment' || activeBatch.method === 'promptpay') && activeBatch.status === 'pending' && <button type="button" onClick={() => checkPaymentStatus(activeBatch)} disabled={uploading} class="mt-2 min-h-11 w-full rounded-2xl border border-sage-200 px-4 font-bold text-sage-700 disabled:opacity-50">{uploading ? 'กำลังตรวจสอบ…' : 'ตรวจสอบสถานะการชำระ'}</button>}
                {activeBatch.status === 'succeeded' && activeBatch.receiptPdfUrl && <a href={activeBatch.receiptPdfUrl} target="_blank" rel="noreferrer" class="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-sage-200 font-bold text-sage-700">เปิดใบเสร็จ PDF</a>}
              </section>
            )}

            <section aria-labelledby="payable-title">
              <div class="mb-3 flex items-end justify-between gap-3">
                <h2 id="payable-title" class="text-lg font-bold text-ink-900">ยอดที่ต้องชำระ</h2>
                <span class="text-sm text-ink-700">{balances.length} รายการ</span>
              </div>
              {(paymentOptions.promptPayEnabled || paymentOptions.installmentsEnabled) && <fieldset class="mb-3 space-y-2 rounded-2xl border border-sage-100 bg-white p-4">
                <legend class="px-1 text-sm font-bold text-ink-900">เลือกช่องทางชำระ</legend>
                <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink-900">
                  <input type="radio" name="payment-method" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} class="h-4 w-4 accent-sage-700" />
                  โอนเงินและส่งสลิป
                </label>
                {paymentOptions.promptPayEnabled && <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink-900">
                  <input type="radio" name="payment-method" value="promptpay" checked={paymentMethod === 'promptpay'} onChange={() => setPaymentMethod('promptpay')} class="h-4 w-4 accent-sage-700" />
                  PromptPay QR ระบุยอดอัตโนมัติ
                </label>}
                {paymentOptions.installmentsEnabled && <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink-900">
                  <input type="radio" name="payment-method" value="credit_card_installment" checked={paymentMethod === 'credit_card_installment'} onChange={() => setPaymentMethod('credit_card_installment')} class="h-4 w-4 accent-sage-700" />
                  ผ่อนชำระด้วยบัตรเครดิต
                </label>}
                {paymentMethod === 'credit_card_installment' && <p class="text-xs leading-5 text-ink-700">เลือกธนาคารและงวดในแต่ละคอร์ส ระบบจะแสดงยอดและดอกเบี้ยสุดท้ายบนหน้า Omise ก่อนยืนยัน</p>}
              </fieldset>}
              {balances.length ? (
                <div class="divide-y divide-sage-100 overflow-hidden rounded-card border border-sage-100 bg-white shadow-soft">
                  {balances.map(balance => {
                    const amountValue = paymentAmounts[balance.enrollmentId] ?? String(balance.amountDue);
                    const selectedAmount = Number(amountValue);
                    const installmentSelection = installmentSelections[balance.enrollmentId] || { bank: 'installment_kbank', term: 3 };
                    const selectedBank = installmentBanks.find(bank => bank.value === installmentSelection.bank) || installmentBanks[3];
                    const amountIsValid = Number.isFinite(selectedAmount)
                      && selectedAmount > 0
                      && selectedAmount <= balance.amountDue;
                    const methodIsAvailable = paymentMethod === 'transfer'
                      ? hasPaymentDestination(balance)
                      : paymentMethod === 'promptpay'
                        ? paymentOptions.promptPayEnabled
                        : paymentOptions.installmentsEnabled
                          && selectedAmount >= Math.max(20, selectedBank.minimum)
                          && selectedBank.terms.includes(Number(installmentSelection.term));

                    return (
                      <article key={balance.enrollmentId} class="space-y-3 p-4">
                        <div>
                          <p class="truncate font-bold text-ink-900">{balance.courseName}</p>
                          <p class="mt-1 text-sm text-ink-700">ยอดค้าง {formatBaht(balance.amountDue)}</p>
                        </div>
                        {paymentMethod === 'credit_card_installment' && paymentOptions.installmentsEnabled && <div class="grid grid-cols-2 gap-2">
                          <label class="text-xs font-semibold text-ink-700">ธนาคาร
                            <select value={installmentSelection.bank} onChange={event => {
                              const bank = installmentBanks.find(item => item.value === event.currentTarget.value) || installmentBanks[3];
                              setInstallmentSelections(previous => ({ ...previous, [balance.enrollmentId]: { bank: bank.value, term: bank.terms[0] } }));
                            }} class="mt-1 min-h-11 w-full rounded-xl border border-sage-200 bg-white px-3 text-sm text-ink-900">
                              {installmentBanks.map(bank => <option key={bank.value} value={bank.value} disabled={selectedAmount < Math.max(20, bank.minimum)}>{bank.label}{bank.minimum ? ` · ขั้นต่ำ ฿${bank.minimum}` : ''}</option>)}
                            </select>
                          </label>
                          <label class="text-xs font-semibold text-ink-700">จำนวนงวด
                            <select value={installmentSelection.term} onChange={event => setInstallmentSelections(previous => ({ ...previous, [balance.enrollmentId]: { ...installmentSelection, term: Number(event.currentTarget.value) } }))} class="mt-1 min-h-11 w-full rounded-xl border border-sage-200 bg-white px-3 text-sm text-ink-900">
                              {selectedBank.terms.map(term => <option key={term} value={term}>{term} งวด</option>)}
                            </select>
                          </label>
                          {selectedAmount < Math.max(20, selectedBank.minimum) && <p role="status" class="col-span-2 text-xs leading-5 text-amber-900">ยอดนี้ยังไม่ถึงขั้นต่ำของธนาคารที่เลือก กรุณาเลือกธนาคารอื่นหรือเพิ่มยอดชำระ</p>}
                        </div>}
                        {methodIsAvailable ? (
                          <div class="flex flex-wrap items-end gap-2">
                            <label class="min-w-40 flex-1 text-xs font-semibold text-ink-700">
                              จำนวนเงินที่ต้องการชำระ
                              <span class="mt-1 flex h-11 items-center rounded-xl border border-sage-200 bg-white px-3 focus-within:border-sage-600 focus-within:ring-2 focus-within:ring-sage-100">
                                <span class="mr-2 text-ink-700">฿</span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0.01"
                                  max={balance.amountDue}
                                  step="0.01"
                                  value={amountValue}
                                  aria-label={`จำนวนเงินที่ต้องการชำระ ${balance.courseName}`}
                                  onInput={event => setPaymentAmounts(previous => ({ ...previous, [balance.enrollmentId]: event.currentTarget.value }))}
                                  disabled={creatingEnrollmentId !== null}
                                  class="min-w-0 flex-1 bg-transparent text-base font-bold text-ink-900 outline-none"
                                />
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setPaymentAmounts(previous => ({ ...previous, [balance.enrollmentId]: String(balance.amountDue) }))}
                              disabled={creatingEnrollmentId !== null}
                              class="min-h-11 rounded-xl border border-sage-200 px-3 text-xs font-bold text-sage-700 disabled:opacity-50"
                            >
                              จ่ายเต็มยอด
                            </button>
                            <button
                              type="button"
                              onClick={() => startPayment(balance, selectedAmount)}
                              disabled={creatingEnrollmentId !== null || !amountIsValid || (paymentMethod === 'credit_card_installment' && selectedAmount < Math.max(20, selectedBank.minimum))}
                              class="min-h-11 shrink-0 rounded-xl bg-sage-700 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {creatingEnrollmentId === balance.enrollmentId ? 'กำลังเตรียม…' : paymentMethod === 'transfer' ? 'ชำระเงิน' : paymentMethod === 'promptpay' ? 'สร้าง QR พร้อมเพย์' : 'เริ่มรายการผ่อน'}
                            </button>
                            {!amountIsValid && <p class="w-full text-xs font-semibold text-red-700" role="alert">กรอกยอดมากกว่า 0 และไม่เกินยอดค้าง</p>}
                          </div>
                        ) : paymentMethod === 'transfer' ? (
                          <p class="text-xs font-semibold leading-5 text-amber-900" role="status">สถาบันยังไม่ได้ตั้งค่าบัญชีรับโอน</p>
                        ) : <p class="text-xs font-semibold leading-5 text-amber-900" role="status">ช่องทางชำระนี้ยังไม่พร้อมใช้งาน</p>}
                      </article>
                    );
                  })}
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
                          <span class="text-xs font-semibold text-gold-600">{payment.method === 'promptpay' ? 'รอตรวจสอบจากระบบ' : payment.method === 'credit_card_installment' ? 'รอดำเนินการผ่าน Omise' : payment.slipUrl ? 'ส่งสลิปแล้ว' : 'ยังไม่ได้แนบสลิป'}</span>
                        </div>
                      </div>
                      {(payment.method === 'promptpay' || payment.method === 'credit_card_installment') && payment.batchId && <button type="button" onClick={() => continuePayment(payment)} class="mt-3 min-h-11 w-full rounded-xl border border-sage-200 font-bold text-sage-700">{payment.method === 'promptpay' ? 'ดู QR / ตรวจสถานะ' : 'ทำรายการต่อ'}</button>}
                      {payment.method !== 'promptpay' && payment.method !== 'credit_card_installment' && (payment.batchId || payment.id > 0) && !payment.slipUrl && (
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
                          <span class={`text-xs font-semibold ${paymentStatusClass(payment.status)}`}>{paymentStatusLabel(payment.status)}</span>
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
