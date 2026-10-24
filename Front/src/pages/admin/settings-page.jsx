import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { showToast, showConfirm } from '../../components/ui';
import { instituteService } from '../../services/institute-service';
import { useAppContext } from '../../store/AppContext';
import { useAbortController } from '../../hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlineBuildingOffice2, HiOutlineExclamationTriangle, HiOutlineTrash, HiOutlineDocumentArrowDown, HiOutlineCheck, HiOutlineQuestionMarkCircle, HiOutlineChevronDown, HiOutlineSparkles, HiOutlineCalendarDays } from 'react-icons/hi2';
import pkg from '../../../package.json';

export function SettingsPage({ path }) {
  const { state, dispatch } = useAppContext();
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  const fileInputRef = useRef(null);
  const paymentQrInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [changelog, setChangelog] = useState([]);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get('tab') === 'payment' ? 'payment' : 'institute');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentQrFile, setPaymentQrFile] = useState(null);
  const [paymentQrPreview, setPaymentQrPreview] = useState(null);

  useEffect(() => {
    fetch('/changelog.json')
      .then((res) => res.json())
      .then((data) => setChangelog(data))
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    name: '',
    email: '',
    contactPhone: '',
    address: '',
    taxId: '',
    receiptNote: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    promptPayId: '',
    paymentInstructions: '',
    paymentQrImageUrl: '',
  });

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setPaymentField = (field) => (e) => setPaymentForm((prev) => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    instituteService.getInstitute({ signal: getSignal() })
      .then((res) => {
        const data = res.data?.data || {};
        setForm({
          name: data.name || '',
          email: data.email || '',
          contactPhone: data.contactPhone || '',
          address: data.address || '',
          taxId: data.taxId || '',
          receiptNote: data.receiptNote || '',
        });
        setPaymentForm({
          bankName: data.bankName || '',
          bankAccountName: data.bankAccountName || '',
          bankAccountNumber: data.bankAccountNumber || '',
          promptPayId: data.promptPayId || '',
          paymentInstructions: data.paymentInstructions || '',
          paymentQrImageUrl: data.paymentQrImageUrl || '',
        });
        setPaymentQrPreview(data.paymentQrImageUrl || null);
        setLogoPreview(data.logoUrl || null);
      })
      .catch(() => showToast('ไม่สามารถโหลดข้อมูลสถาบันได้', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('รองรับเฉพาะไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('ไฟล์ต้องมีขนาดไม่เกิน 2MB', 'error');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveInstitute = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      showToast('กรุณาระบุชื่อสถาบัน', 'error');
      return;
    }
    setSaving(true);
    try {
      await instituteService.updateInstitute({
        name: form.name.trim(),
        email: form.email,
        contactPhone: form.contactPhone,
        address: form.address,
        taxId: form.taxId,
        receiptNote: form.receiptNote,
      });

      if (logoFile) {
        const uploadRes = await instituteService.uploadLogo(logoFile);
        const newLogoUrl = uploadRes.data?.data?.logoUrl;
        if (newLogoUrl) {
          setLogoPreview(newLogoUrl);
          setLogoFile(null);
          dispatch({ type: 'SET_INSTITUTE_LOGO', payload: newLogoUrl });
        }
      }

      dispatch({ type: 'SET_INSTITUTE_NAME', payload: form.name });
      showToast('บันทึกข้อมูลสถาบันสำเร็จ', 'success');
    } catch (err) {
      showToast(err?.data?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async (event) => {
    event.preventDefault();
    setPaymentSaving(true);
    try {
      let paymentQrImageUrl = paymentForm.paymentQrImageUrl;
      if (paymentQrFile) {
        const uploadRes = await instituteService.uploadPaymentQr(paymentQrFile);
        paymentQrImageUrl = uploadRes.data?.fileUrl || uploadRes.data?.data?.fileUrl || '';
        if (!paymentQrImageUrl) throw new Error('อัปโหลด QR ไม่สำเร็จ กรุณาลองใหม่');
      }
      await instituteService.updateInstitute({
        bankName: paymentForm.bankName,
        bankAccountName: paymentForm.bankAccountName,
        bankAccountNumber: paymentForm.bankAccountNumber,
        promptPayId: paymentForm.promptPayId,
        paymentInstructions: paymentForm.paymentInstructions,
        paymentQrImageUrl,
      });
      setPaymentForm((prev) => ({ ...prev, paymentQrImageUrl }));
      setPaymentQrPreview(paymentQrImageUrl || null);
      setPaymentQrFile(null);
      showToast('บันทึกข้อมูลรับชำระเงินแล้ว', 'success');
    } catch (err) {
      showToast(err?.data?.message || err?.message || 'บันทึกข้อมูลรับชำระเงินไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handlePaymentQrSelect = (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('รองรับเฉพาะไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('ไฟล์ QR ต้องมีขนาดไม่เกิน 5MB', 'error');
      return;
    }
    setPaymentQrFile(file);
    const reader = new FileReader();
    reader.onload = (result) => setPaymentQrPreview(result.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemovePaymentQr = () => {
    setPaymentQrFile(null);
    setPaymentQrPreview(null);
    setPaymentForm((prev) => ({ ...prev, paymentQrImageUrl: '' }));
    if (paymentQrInputRef.current) paymentQrInputRef.current.value = '';
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm({
      title: 'ลบบัญชีผู้ดูแลระบบ',
      message: 'การลบบัญชีจะลบข้อมูลทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้ คุณแน่ใจ?',
      yesLabel: 'ลบเลย',
      cancelLabel: 'ยกเลิก',
    });
    if (!confirmed) return;
    showToast('ฟังก์ชันลบบัญชีจะทำงานเมื่อเชื่อมต่อ API แล้ว', 'info');
  };

  if (loading) {
    return (
      <AdminLayout path={path}>
        <div class="flex items-center justify-center py-20">
          <div class="h-8 w-8 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout path={path}>
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">ตั้งค่าระบบ</h2>
        <p class="text-sm text-zinc-500 mt-1">จัดการข้อมูลสถาบันและตั้งค่าระบบ</p>
      </div>

      <div class="max-w-3xl space-y-6">
        <div class={`${isNeo ? 'neo-tab-group w-full sm:w-auto' : 'grid w-full grid-cols-2 rounded-xl border border-zinc-200 bg-white p-1 sm:inline-flex sm:w-auto'}`} role="tablist" aria-label="หมวดตั้งค่าระบบ">
          <button
            type="button"
            id="settings-tab-institute"
            role="tab"
            aria-selected={activeTab === 'institute'}
            aria-controls="settings-panel-institute"
            onClick={() => setActiveTab('institute')}
            class={`flex-1 px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${isNeo ? (activeTab === 'institute' ? 'neo-tab-active' : 'neo-tab-inactive') : `rounded-lg ${activeTab === 'institute' ? 'bg-oasis-primary text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}`}
          >
            ข้อมูลสถาบัน
          </button>
          <button
            type="button"
            id="settings-tab-payment"
            role="tab"
            aria-selected={activeTab === 'payment'}
            aria-controls="settings-panel-payment"
            onClick={() => setActiveTab('payment')}
            class={`flex-1 px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${isNeo ? (activeTab === 'payment' ? 'neo-tab-active' : 'neo-tab-inactive') : `rounded-lg ${activeTab === 'payment' ? 'bg-oasis-primary text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}`}
          >
            การรับชำระเงิน
          </button>
        </div>

        {activeTab === 'institute' ? (
          <section id="settings-panel-institute" role="tabpanel" aria-labelledby="settings-tab-institute" class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-zinc-200 bg-white shadow-sm'} overflow-hidden`}>
            <div class="border-b border-zinc-200 px-5 py-4 sm:px-6">
              <div class="flex items-center gap-3">
                <div class={`flex h-10 w-10 shrink-0 items-center justify-center ${isNeo ? 'border-2 border-black bg-amber-100 text-black' : 'rounded-xl bg-oasis-primary/10 text-oasis-primary'}`}>
                  <HiOutlineBuildingOffice2 class="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 class="font-semibold text-zinc-900">ข้อมูลสถาบัน</h3>
                  <p class="mt-0.5 text-sm text-zinc-600">รายละเอียดสำหรับการติดต่อและออกใบเสร็จ</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSaveInstitute}>
              <div class="divide-y divide-zinc-100">
                <div class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <span class="text-sm font-medium text-zinc-800">โลโก้สถาบัน</span>
                  <div class="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="ตัวอย่างโลโก้สถาบัน" class="h-11 w-11 rounded-lg border border-zinc-200 object-cover" />
                    ) : (
                      <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-oasis-primary/10 text-sm font-bold text-oasis-primary">TH</div>
                    )}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoSelect} class="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} class="min-h-11 rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary">
                      {logoFile ? 'เปลี่ยนโลโก้' : 'เลือกรูปโลโก้'}
                    </button>
                  </div>
                </div>
                <SettingsInput id="institute-name" label="ชื่อสถาบัน" value={form.name} onChange={setField('name')} />
                <SettingsInput id="institute-email" label="อีเมลติดต่อ" value={form.email} onChange={setField('email')} type="email" />
                <SettingsInput id="institute-phone" label="เบอร์โทรศัพท์" value={form.contactPhone} onChange={setField('contactPhone')} type="tel" />
                <SettingsInput id="institute-address" label="ที่อยู่สำหรับออกใบเสร็จ" value={form.address} onChange={setField('address')} />
                <SettingsInput id="institute-tax-id" label="เลขประจำตัวผู้เสียภาษี" value={form.taxId} onChange={setField('taxId')} />
                <SettingsTextarea id="institute-receipt-note" label="หมายเหตุท้ายใบเสร็จ" value={form.receiptNote} onChange={setField('receiptNote')} />
              </div>
              <div class="flex justify-end border-t border-zinc-200 px-5 py-4 sm:px-6">
                <button type="submit" disabled={saving} class={`inline-flex min-h-11 items-center gap-2 bg-oasis-primary px-5 text-sm font-semibold text-white transition hover:bg-oasis-primary-dark disabled:cursor-not-allowed disabled:opacity-60 ${isNeo ? 'neo-btn' : 'rounded-xl shadow-sm'}`}>
                  <HiOutlineCheck class="h-4 w-4" aria-hidden="true" />
                  {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสถาบัน'}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section id="settings-panel-payment" role="tabpanel" aria-labelledby="settings-tab-payment" class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-zinc-200 bg-white shadow-sm'} overflow-hidden`}>
            <div class="border-b border-zinc-200 px-5 py-4 sm:px-6">
              <h3 class="font-semibold text-zinc-900">บัญชีรับโอนจากผู้ปกครอง</h3>
              <p class="mt-0.5 text-sm text-zinc-600">ข้อมูลนี้จะแสดงในหน้าชำระเงินของผู้ปกครองที่ผูกกับนักเรียนของสถาบัน</p>
            </div>
            <form onSubmit={handleSavePayment}>
              <div class="divide-y divide-zinc-100">
                <div class="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-zinc-800">QR Code รับชำระ</p>
                    <p class="mt-1 max-w-xl text-sm leading-5 text-zinc-600">อัปโหลดรูป QR ที่สถาบันใช้รับโอน ผู้ปกครองจะเห็นรูปนี้ในหน้ารายการชำระเงิน</p>
                    <p class="mt-1 text-xs text-zinc-500">ไฟล์รูปภาพไม่เกิน 5MB · ใช้ QR แบบคงที่ ไม่เปลี่ยนยอดตามรายการ</p>
                  </div>
                  <div class="flex shrink-0 items-center gap-3">
                    {paymentQrPreview ? (
                      <img src={paymentQrPreview} alt="ตัวอย่าง QR Code รับชำระเงิน" class="h-24 w-24 rounded-lg border border-zinc-200 bg-white object-contain p-1" />
                    ) : (
                      <div class="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-center text-xs text-zinc-500">ยังไม่มี QR</div>
                    )}
                    <div class="flex flex-col gap-2">
                      <input type="file" accept="image/*" ref={paymentQrInputRef} onChange={handlePaymentQrSelect} class="hidden" />
                      <button type="button" onClick={() => paymentQrInputRef.current?.click()} class="min-h-10 rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary">
                        {paymentQrFile || paymentForm.paymentQrImageUrl ? 'เปลี่ยนรูป QR' : 'เลือกรูป QR'}
                      </button>
                      {paymentQrPreview && <button type="button" onClick={handleRemovePaymentQr} class="min-h-10 rounded-xl px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">ลบ QR</button>}
                    </div>
                  </div>
                </div>
                <SettingsInput id="payment-bank-name" label="ธนาคาร" placeholder="เช่น ธนาคารกสิกรไทย" value={paymentForm.bankName} onChange={setPaymentField('bankName')} />
                <SettingsInput id="payment-account-name" label="ชื่อบัญชี" placeholder="ชื่อเจ้าของบัญชี" value={paymentForm.bankAccountName} onChange={setPaymentField('bankAccountName')} />
                <SettingsInput id="payment-account-number" label="เลขที่บัญชี" placeholder="เลขที่บัญชีรับโอน" value={paymentForm.bankAccountNumber} onChange={setPaymentField('bankAccountNumber')} inputMode="numeric" />
                <SettingsInput id="payment-promptpay" label="หมายเลขพร้อมเพย์" placeholder="เบอร์โทรศัพท์หรือเลขประจำตัวที่ผูกไว้" value={paymentForm.promptPayId} onChange={setPaymentField('promptPayId')} inputMode="numeric" />
                <SettingsTextarea id="payment-instructions" label="คำแนะนำการโอน" placeholder="เช่น กรุณาใส่เลขอ้างอิงในหมายเหตุการโอน" value={paymentForm.paymentInstructions} onChange={setPaymentField('paymentInstructions')} />
              </div>
              <div class="flex justify-end border-t border-zinc-200 px-5 py-4 sm:px-6">
                <button type="submit" disabled={paymentSaving} class={`inline-flex min-h-11 items-center gap-2 bg-oasis-primary px-5 text-sm font-semibold text-white transition hover:bg-oasis-primary-dark disabled:cursor-not-allowed disabled:opacity-60 ${isNeo ? 'neo-btn' : 'rounded-xl shadow-sm'}`}>
                  <HiOutlineCheck class="h-4 w-4" aria-hidden="true" />
                  {paymentSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลรับชำระเงิน'}
                </button>
              </div>
            </form>
          </section>
        )}

        <div class={`${isNeo ? 'neo-card bg-white' : 'bg-zinc-50 rounded-2xl border border-oasis-danger/20'} overflow-hidden`}>
          <div class="flex items-center gap-4 px-6 py-5 border-b border-oasis-danger/10">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oasis-danger/5 text-oasis-danger">
              <HiOutlineExclamationTriangle class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-900">โซนอันตราย</h3>
              <p class="text-sm text-zinc-500">การดำเนินการที่ไม่สามารถย้อนกลับได้</p>
            </div>
          </div>
          <div class="px-6 py-4">
            <p class="text-sm text-zinc-600 mb-3">
              การลบบัญชีผู้ดูแลระบบจะลบข้อมูลทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้
            </p>
            <button onClick={handleDeleteAccount} class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-oasis-danger bg-oasis-danger/5 hover:bg-oasis-danger/10 rounded-xl transition-colors border border-oasis-danger/20">
              <HiOutlineTrash class="h-4 w-4" />
              ลบบัญชีผู้ดูแลระบบ
            </button>
          </div>
        </div>

        {/* Help & About */}
        <div class={`${isNeo ? 'neo-card bg-white' : 'bg-zinc-50 rounded-2xl border border-zinc-100'} overflow-hidden`}>
          <div class="flex items-center gap-4 px-6 py-5 border-b border-zinc-100">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oasis-primary/5 text-oasis-primary">
              <HiOutlineQuestionMarkCircle class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-900">ช่วยเหลือ</h3>
              <p class="text-sm text-zinc-500">เวอร์ชันและการอัปเดต</p>
            </div>
          </div>
          <div class="divide-y divide-zinc-100">
            <div class="flex items-center justify-between px-6 py-4 gap-4">
              <span class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>เวอร์ชัน</span>
              <span class="text-sm text-zinc-500 font-mono">v{pkg.appVersion || pkg.version}</span>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setChangelogOpen(!changelogOpen)}
                class="w-full flex items-center justify-between px-6 py-4 gap-4 hover:bg-zinc-50 transition-colors text-left"
              >
                <span class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>ประวัติการอัปเดต</span>
                <HiOutlineChevronDown class={`h-4 w-4 text-zinc-400 transition-transform ${changelogOpen ? 'rotate-180' : ''}`} />
              </button>
              {changelogOpen && (
                <div class="px-6 pb-4 space-y-4">
                  {changelog.map((release) => (
                    <div key={release.version} class={`${isNeo ? 'border-l-2 border-black pl-4' : 'border-l-2 border-oasis-primary/30 pl-4'}`}>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-mono font-semibold text-oasis-primary">v{release.version}</span>
                        <span class="text-xs text-zinc-400 flex items-center gap-1">
                          <HiOutlineCalendarDays class="h-3 w-3" />
                          {release.date}
                        </span>
                      </div>
                      <p class="text-sm font-medium text-zinc-800 mb-1">{release.title}</p>
                      <ul class="space-y-0.5">
                        {release.notes.map((note, i) => (
                          <li key={i} class="text-xs text-zinc-500 flex items-start gap-1.5">
                            <HiOutlineSparkles class="h-3 w-3 text-oasis-primary mt-0.5 shrink-0" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SettingsInput({ id, label, value, onChange, type = 'text', placeholder, inputMode }) {
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  return (
    <div class="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
      <label for={id} class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>{label}</label>
      <input id={id} type={type} inputMode={inputMode} placeholder={placeholder} value={value} onInput={onChange} class={`w-full min-h-11 bg-white px-3.5 py-2 text-sm text-zinc-800 placeholder-zinc-500 focus:outline-none sm:w-72 ${isNeo ? 'neo-input' : 'rounded-xl border border-zinc-300 transition focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/20'}`} />
    </div>
  );
}

function SettingsTextarea({ id, label, value, onChange, placeholder }) {
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  return (
    <div class="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6">
      <label for={id} class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'} sm:pt-2`}>{label}</label>
      <textarea id={id} value={value} onInput={onChange} placeholder={placeholder} rows={3} class={`w-full bg-white px-3.5 py-2 text-sm text-zinc-800 placeholder-zinc-500 focus:outline-none sm:w-72 ${isNeo ? 'neo-input' : 'rounded-xl border border-zinc-300 transition focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/20'} resize-y`} />
    </div>
  );
}

