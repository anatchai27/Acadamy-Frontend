import { useState } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { showToast, showConfirm } from '../../components/ui';

export function SettingsPage({ path }) {
  const [instituteName, setInstituteName] = useState('TiwHub Academy');
  const [contactEmail, setContactEmail] = useState('admin@tiwhub.com');
  const [contactPhone, setContactPhone] = useState('02-123-4567');
  const [emailNotify, setEmailNotify] = useState(true);
  const [lineNotify, setLineNotify] = useState(false);
  const [smsNotify, setSmsNotify] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: call API when available
      // await instituteService.update({ name: instituteName, phone: contactPhone, email: contactEmail });
      await new Promise((r) => setTimeout(r, 300));
      showToast('บันทึกการตั้งค่าสำเร็จ', 'success');
    } catch {
      showToast('บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
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

  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">ตั้งค่าระบบ</h2>
        <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">จัดการการตั้งค่าทั้งหมดของระบบ</p>
      </div>

      <div class="space-y-6 max-w-3xl">
        {/* General Info */}
        <div class="bg-tiwhub-surface dark:bg-tiwhub-heading/80 rounded-2xl shadow-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 overflow-hidden">
          <div class="flex items-center gap-4 px-6 py-5 border-b border-tiwhub-border-light dark:border-tiwhub-border/20">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tiwhub-primary/10 dark:bg-tiwhub-primary/15 text-tiwhub-primary dark:text-tiwhub-primary-light">
              <BuildingIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-tiwhub-heading dark:text-white">ข้อมูลทั่วไป</h3>
              <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70">จัดการข้อมูลพื้นฐานของสถาบัน</p>
            </div>
          </div>
          <div class="divide-y divide-tiwhub-border-light dark:divide-tiwhub-border/20">
            <SettingsInput label="ชื่อสถาบัน" value={instituteName} onChange={setInstituteName} />
            <SettingsInput label="อีเมลติดต่อ" value={contactEmail} onChange={setContactEmail} type="email" />
            <SettingsInput label="เบอร์โทรศัพท์" value={contactPhone} onChange={setContactPhone} type="tel" />
          </div>
        </div>

        {/* Notifications */}
        <div class="bg-tiwhub-surface dark:bg-tiwhub-heading/80 rounded-2xl shadow-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 overflow-hidden">
          <div class="flex items-center gap-4 px-6 py-5 border-b border-tiwhub-border-light dark:border-tiwhub-border/20">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tiwhub-primary/10 dark:bg-tiwhub-primary/15 text-tiwhub-primary dark:text-tiwhub-primary-light">
              <BellIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-tiwhub-heading dark:text-white">การแจ้งเตือน</h3>
              <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70">ตั้งค่าการแจ้งเตือนผ่านช่องทางต่างๆ</p>
            </div>
          </div>
          <div class="divide-y divide-tiwhub-border-light dark:divide-tiwhub-border/20">
            <SettingsToggle label="แจ้งเตือนทางอีเมล" desc="รับแจ้งเตือนสำคัญผ่านอีเมล" checked={emailNotify} onChange={setEmailNotify} />
            <SettingsToggle label="แจ้งเตือนทาง LINE" desc="รับแจ้งเตือนผ่าน LINE Official" checked={lineNotify} onChange={setLineNotify} />
            <SettingsToggle label="แจ้งเตือนทาง SMS" desc="รับแจ้งเตือนด่วนผ่าน SMS" checked={smsNotify} onChange={setSmsNotify} />
          </div>
        </div>

        {/* Danger Zone */}
        <div class="bg-tiwhub-surface dark:bg-tiwhub-heading/80 rounded-2xl shadow-sm border border-tiwhub-danger/20 dark:border-tiwhub-danger/20 overflow-hidden">
          <div class="flex items-center gap-4 px-6 py-5 border-b border-tiwhub-danger/10 dark:border-tiwhub-danger/10">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tiwhub-danger/10 dark:bg-tiwhub-danger/15 text-tiwhub-danger dark:text-tiwhub-danger">
              <WarningIcon class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-tiwhub-heading dark:text-white">โซนอันตราย</h3>
              <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70">การดำเนินการที่ไม่สามารถย้อนกลับได้</p>
            </div>
          </div>
          <div class="px-6 py-4">
            <p class="text-sm text-tiwhub-body dark:text-tiwhub-bg/80 mb-3">
              การลบบัญชีผู้ดูแลระบบจะลบข้อมูลทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้
            </p>
            <button
              onClick={handleDeleteAccount}
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-tiwhub-danger dark:text-tiwhub-danger bg-tiwhub-danger/10 dark:bg-tiwhub-danger/15 hover:bg-tiwhub-danger/15 dark:hover:bg-tiwhub-danger/20 rounded-xl transition-colors border border-tiwhub-danger/20 dark:border-tiwhub-danger/20"
            >
              <TrashIcon class="h-4 w-4" />
              ลบบัญชีผู้ดูแลระบบ
            </button>
          </div>
        </div>

        {/* Save */}
        <div class="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            class="inline-flex items-center gap-2 bg-tiwhub-primary hover:bg-tiwhub-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
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
    <div class="flex items-center justify-between px-6 py-4 gap-4 hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors">
      <label class="text-sm font-medium text-tiwhub-heading dark:text-white">{label}</label>
      <input
        type={type}
        value={value}
        onInput={(e) => onChange(e.target.value)}
        class="w-64 px-3.5 py-2 text-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 rounded-xl bg-tiwhub-surface dark:bg-tiwhub-heading/50 text-tiwhub-heading dark:text-white placeholder-tiwhub-muted focus:outline-none focus:ring-2 focus:ring-tiwhub-primary/20 focus:border-tiwhub-primary transition-all"
      />
    </div>
  );
}

function SettingsToggle({ label, desc, checked, onChange }) {
  return (
    <div class="flex items-center justify-between px-6 py-4 gap-4 hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors">
      <div class="flex-1 min-w-0">
        <label class="text-sm font-medium text-tiwhub-heading dark:text-white block">{label}</label>
        {desc && <p class="text-xs text-tiwhub-muted dark:text-tiwhub-muted/70 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-tiwhub-primary/20 focus:ring-offset-1 ${
          checked ? 'bg-tiwhub-primary' : 'bg-tiwhub-border dark:bg-tiwhub-border/30'
        }`}
      >
        <span class={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

/* ─── Icons ─── */

function BuildingIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function BellIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
