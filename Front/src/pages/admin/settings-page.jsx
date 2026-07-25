import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { showToast, showConfirm } from '../../components/ui';
import { instituteService } from '../../services/institute-service';
import { useAppContext } from '../../store/AppContext';
import { useAbortController } from '../../hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlineBuildingOffice2, HiOutlineExclamationTriangle, HiOutlineTrash, HiOutlineDocumentArrowDown, HiOutlineCheck } from 'react-icons/hi2';

export function SettingsPage({ path }) {
  const { state, dispatch } = useAppContext();
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
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
        <div class={`${isNeo ? 'neo-card bg-white' : 'bg-zinc-50 rounded-2xl border border-zinc-100'} overflow-hidden`}>
          <div class="flex items-center gap-4 px-6 py-5 border-b border-zinc-100">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oasis-primary/5 text-oasis-primary">
              <HiOutlineBuildingOffice2 class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-900">ข้อมูลสถาบัน</h3>
              <p class="text-sm text-zinc-500">จัดการข้อมูลสำหรับใบเสร็จและการแสดงผล</p>
            </div>
          </div>
          <div class="divide-y divide-zinc-100">
            <div class="flex items-center justify-between px-6 py-4 gap-4 hover:bg-zinc-50 transition-colors">
              <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>โลโก้สถาบัน</label>
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

        <div class="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} class={`inline-flex items-center gap-2 bg-oasis-primary hover:bg-oasis-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 ${isNeo ? 'neo-btn' : ''}`}>
            <HiOutlineCheck class="h-4 w-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

function SettingsInput({ label, value, onChange, type = 'text' }) {
  return (
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-1 sm:gap-4 hover:bg-zinc-50 transition-colors">
      <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>{label}</label>
      <input type={type} value={value} onInput={onChange} class={`w-full sm:w-64 px-3.5 py-2 text-sm bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none ${isNeo ? 'neo-input' : 'border border-zinc-200 rounded-xl focus:ring-2 focus:ring-oasis-primary/20 focus:border-oasis-primary transition-all'}`} />
    </div>
  );
}

function SettingsTextarea({ label, value, onChange }) {
  return (
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between px-6 py-4 gap-1 sm:gap-4 hover:bg-zinc-50 transition-colors">
      <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'} pt-1`}>{label}</label>
      <textarea value={value} onInput={onChange} rows={2} class={`w-full sm:w-64 px-3.5 py-2 text-sm bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none ${isNeo ? 'neo-input' : 'border border-zinc-200 rounded-xl focus:ring-2 focus:ring-oasis-primary/20 focus:border-oasis-primary transition-all'} resize-none`} />
    </div>
  );
}

