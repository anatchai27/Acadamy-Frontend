import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { showToast, showConfirm } from '../../components/ui';
import { instituteService } from '../../services/institute-service';
import { useAppContext } from '../../store/AppContext';
import { useAbortController } from '../../hooks';

export function SettingsPage({ path }) {
  const { state, dispatch } = useAppContext();
  const getSignal = useAbortController();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    contactPhone: '',
    address: '',
    taxId: '',
    receiptNote: '',
  });

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await instituteService.updateInstitute({
        name: form.name || undefined,
        email: form.email || undefined,
        contactPhone: form.contactPhone || undefined,
        address: form.address || undefined,
        taxId: form.taxId || undefined,
        receiptNote: form.receiptNote || undefined,
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

      <div class="space-y-6 max-w-3xl">
        <div class="bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
          <div class="flex items-center gap-4 px-6 py-5 border-b border-zinc-100">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oasis-primary/5 text-oasis-primary">
              <BuildingIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-900">ข้อมูลสถาบัน</h3>
              <p class="text-sm text-zinc-500">จัดการข้อมูลสำหรับใบเสร็จและการแสดงผล</p>
            </div>
          </div>
          <div class="divide-y divide-zinc-100">
            <div class="flex items-center justify-between px-6 py-4 gap-4 hover:bg-zinc-50 transition-colors">
              <label class="text-sm font-medium text-zinc-800">โลโก้สถาบัน</label>
              <div class="flex items-center gap-3">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" class="h-10 w-10 rounded-lg object-cover border border-zinc-200" />
                ) : (
                  <div class="h-10 w-10 rounded-lg bg-oasis-primary/5 flex items-center justify-center text-oasis-primary text-sm font-bold">TH</div>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoSelect} class="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} class="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                  อัปโหลด
                </button>
              </div>
            </div>
            <SettingsInput label="ชื่อสถาบัน" value={form.name} onChange={setField('name')} />
            <SettingsInput label="อีเมลติดต่อ" value={form.email} onChange={setField('email')} type="email" />
            <SettingsInput label="เบอร์โทรศัพท์" value={form.contactPhone} onChange={setField('contactPhone')} type="tel" />
            <SettingsInput label="ที่อยู่ (สำหรับออกใบเสร็จ)" value={form.address} onChange={setField('address')} />
            <SettingsInput label="เลขประจำตัวผู้เสียภาษี" value={form.taxId} onChange={setField('taxId')} />
            <SettingsTextarea label="หมายเหตุท้ายใบเสร็จ" value={form.receiptNote} onChange={setField('receiptNote')} />
          </div>
        </div>

        <div class="bg-zinc-50 rounded-2xl border border-oasis-danger/20 overflow-hidden">
          <div class="flex items-center gap-4 px-6 py-5 border-b border-oasis-danger/10">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oasis-danger/5 text-oasis-danger">
              <WarningIcon class="h-5 w-5" />
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
              <TrashIcon class="h-4 w-4" />
              ลบบัญชีผู้ดูแลระบบ
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} class="inline-flex items-center gap-2 bg-oasis-primary hover:bg-oasis-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50">
            <SaveIcon class="h-4 w-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

function SettingsInput({ label, value, onChange, type = 'text' }) {
  return (
    <div class="flex items-center justify-between px-6 py-4 gap-4 hover:bg-zinc-50 transition-colors">
      <label class="text-sm font-medium text-zinc-800">{label}</label>
      <input type={type} value={value} onInput={onChange} class="w-64 px-3.5 py-2 text-sm border border-zinc-200 rounded-xl bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-oasis-primary/20 focus:border-oasis-primary transition-all" />
    </div>
  );
}

function SettingsTextarea({ label, value, onChange }) {
  return (
    <div class="flex items-start justify-between px-6 py-4 gap-4 hover:bg-zinc-50 transition-colors">
      <label class="text-sm font-medium text-zinc-800 pt-1">{label}</label>
      <textarea value={value} onInput={onChange} rows={2} class="w-64 px-3.5 py-2 text-sm border border-zinc-200 rounded-xl bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-oasis-primary/20 focus:border-oasis-primary transition-all resize-none" />
    </div>
  );
}

/* ─── SVG Icons ─── */

function BuildingIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function WarningIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function TrashIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function SaveIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}