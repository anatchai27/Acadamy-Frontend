import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { getParentProfile, updateParentProfile } from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';

export const ProfilePage = () => {
  const { state, dispatch, reset } = useLiffContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    !state.parentToken ? route('/liff/login', true) : getParentProfile()
      .then(res => {
        const p = res.data?.data || res.data;
        setProfile(p);
        setForm({ fullName: p.fullName || '', phone: p.phone || '', email: p.email || '' });
      })
      .catch(() => route('/liff/login', true))
      .finally(() => setLoading(false));
  }, [state.parentToken]);

  const handleSave = async () => {
    setSaving(true);
    (async () => {
      try {
        const res = await updateParentProfile(form);
        const updated = res.data?.data || res.data;
        setProfile(updated);
        setEditMode(false);
      } catch (err) {
        alert(err.message || 'ไม่สามารถบันทึกได้');
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleLogout = () => {
    reset();
    (async () => {
      const { logoutLiff } = await import('../services/liff');
      logoutLiff();
    })();
    route('/liff/login', true);
  };

  return loading ? (
    <LiffLayout>
      <div class="flex justify-center py-20">
        <div class="h-8 w-8 rounded-full border-3 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    </LiffLayout>
  ) : (
    <LiffLayout showBack>
      <div class="space-y-6">
        <div class="text-center">
          <div class="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {state.liffProfile?.displayName?.charAt(0) || '?'}
          </div>
          <h1 class="text-xl font-bold">{state.liffProfile?.displayName}</h1>
          <p class="text-sm text-gray-500">LINE ID: {state.liffProfile?.userId?.slice(0, 8)}...</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold">ข้อมูลผู้ปกครอง</h2>
            <button
              onClick={() => setEditMode(!editMode)}
              class="text-sm text-blue-600 font-medium"
            >
              {editMode ? 'ยกเลิก' : 'แก้ไข'}
            </button>
          </div>

          {editMode ? (
            <div class="space-y-3">
              <InputField label="ชื่อ-นามสกุล" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} />
              <InputField label="เบอร์โทร" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
              <InputField label="อีเมล" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" />
              <button
                onClick={handleSave}
                disabled={saving}
                class="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          ) : (
            <div class="space-y-3">
              <ProfileRow label="ชื่อ-นามสกุล" value={profile?.fullName || '-'} />
              <ProfileRow label="เบอร์โทร" value={profile?.phone || '-'} />
              <ProfileRow label="อีเมล" value={profile?.email || '-'} />
            </div>
          )}
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 class="font-semibold mb-3">บุตรหลาน</h2>
          {state.children.length === 0 ? (
            <p class="text-sm text-gray-400">ยังไม่มีข้อมูลบุตรหลาน</p>
          ) : (
            <div class="space-y-2">
              {state.children.map(c => (
                <div key={c.id} class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {(c.fullName || '?').charAt(0)}
                  </div>
                  <div>
                    <p class="font-medium text-sm">{c.fullName}</p>
                    <p class="text-xs text-gray-400">{c.grade || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          class="w-full bg-red-50 text-red-600 rounded-xl py-3 font-semibold border border-red-200"
        >
          ออกจากระบบ
        </button>
      </div>
    </LiffLayout>
  );
};

const ProfileRow = ({ label, value }) => {
  return (
    <div class="flex justify-between items-center">
      <span class="text-sm text-gray-500">{label}</span>
      <span class="text-sm font-medium">{value}</span>
    </div>
  );
};

const InputField = ({ label, value, onChange, type = 'text' }) => {
  return (
    <div>
      <label class="text-xs text-gray-500 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onInput={e => onChange(e.target.value)}
        class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};
