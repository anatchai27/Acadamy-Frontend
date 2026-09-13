import { useEffect, useState } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, SolidInput, showToast } from '../../components/ui';
import { getTeachers } from '../../services/teacher-service';
import { makeupService } from '../../services/makeup-service';
import { HiOutlineCalendarDays, HiOutlinePlus } from 'react-icons/hi2';

const emptyForm = { teacherId: '', scheduledAt: '', capacity: '1', roomId: '' };

const unwrap = response => response?.data?.data || response?.data || [];
const formatDate = value => value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export function MakeupSlotsPage({ path }) {
  const [slots, setSlots] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [slotResponse, teacherResponse] = await Promise.all([
        makeupService.getMakeupSlots({ from: new Date().toISOString() }),
        getTeachers(),
      ]);
      const slotData = unwrap(slotResponse);
      const teacherData = unwrap(teacherResponse);
      setSlots(Array.isArray(slotData) ? slotData : slotData.slots || []);
      setTeachers(Array.isArray(teacherData) ? teacherData : teacherData.teachers || []);
    } catch (apiError) {
      setError(apiError.message || 'ไม่สามารถโหลดที่นั่งเรียนชดเชยได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = field => event => setForm(current => ({ ...current, [field]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    if (!form.teacherId || !form.scheduledAt || Number(form.capacity) < 1) {
      setError('กรุณาระบุครู เวลา และจำนวนที่นั่งให้ครบ');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await makeupService.createMakeupSlot({
        teacherId: Number(form.teacherId),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        capacity: Number(form.capacity),
        roomId: form.roomId.trim() || null,
      });
      setForm(emptyForm);
      showToast('สร้างที่นั่งเรียนชดเชยสำเร็จ', 'success');
      await load();
    } catch (apiError) {
      setError(apiError.message || 'สร้างที่นั่งเรียนชดเชยไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async slot => {
    if (!window.confirm('ยืนยันยกเลิก slot นี้และคืนเครดิตให้ผู้จองทั้งหมดหรือไม่')) return;
    setBusyId(slot.id);
    setError('');
    try {
      await makeupService.cancelMakeupSlot(slot.id);
      showToast('ยกเลิก slot และคืนเครดิตแล้ว', 'success');
      await load();
    } catch (apiError) {
      setError(apiError.message || 'ยกเลิก slot ไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout path={path}>
      <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-oasis-primary">Make-up classes</p>
          <h1 class="mt-1 text-2xl font-semibold text-zinc-900">จัดการที่นั่งเรียนชดเชย</h1>
        </div>
        <span class="text-sm text-zinc-500">สร้างและยกเลิก slot จาก API จริง</span>
      </div>

      {error && <div role="alert" class="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section class="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-base font-semibold text-zinc-900">สร้าง slot ใหม่</h2>
        <form class="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label class="grid gap-2 text-sm text-zinc-600">
            ครูผู้สอน *
            <select class="rounded-xl border border-zinc-200 px-3 py-2.5" value={form.teacherId} onChange={update('teacherId')}>
              <option value="">เลือกครูผู้สอน</option>
              {teachers.map(teacher => <option value={teacher.id} key={teacher.id}>{teacher.fullName}</option>)}
            </select>
          </label>
          <label class="grid gap-2 text-sm text-zinc-600">
            วันและเวลา *
            <input class="rounded-xl border border-zinc-200 px-3 py-2.5" type="datetime-local" value={form.scheduledAt} onInput={update('scheduledAt')} />
          </label>
          <SolidInput label="จำนวนที่นั่ง *" type="number" min="1" value={form.capacity} onInput={update('capacity')} />
          <SolidInput label="ห้องเรียน" value={form.roomId} onInput={update('roomId')} placeholder="เช่น Room A" />
          <div class="md:col-span-2">
            <Button type="submit" loading={submitting} disabled={submitting}>
              <span class="flex items-center gap-2"><HiOutlinePlus class="h-4 w-4" />สร้าง slot</span>
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 class="mb-3 text-lg font-semibold text-zinc-900">slot ที่เปิดอยู่</h2>
        {loading && <p class="py-10 text-center text-sm text-zinc-500">กำลังโหลดข้อมูล...</p>}
        {!loading && slots.length === 0 && <div class="rounded-2xl border border-dashed border-zinc-300 px-4 py-12 text-center text-sm text-zinc-500">ยังไม่มี slot ที่เปิดอยู่</div>}
        <div class="grid gap-3 md:grid-cols-2">
          {!loading && slots.map(slot => (
            <article class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" key={slot.id}>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-zinc-900">ครู #{slot.teacherId}</p>
                  <p class="mt-1 flex items-center gap-1 text-sm text-zinc-500"><HiOutlineCalendarDays class="h-4 w-4" />{formatDate(slot.scheduledAt)}</p>
                </div>
                <span class="rounded-full bg-oasis-primary/10 px-2.5 py-1 text-xs font-semibold text-oasis-primary">{slot.bookedCount}/{slot.capacity}</span>
              </div>
              <p class="mt-3 text-sm text-zinc-500">ห้อง {slot.roomId || '-'}</p>
              <Button class="mt-4 w-full" variant="outline" disabled={busyId === slot.id} onClick={() => cancel(slot)}>
                {busyId === slot.id ? 'กำลังยกเลิก...' : 'ยกเลิก slot และคืนเครดิต'}
              </Button>
            </article>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
