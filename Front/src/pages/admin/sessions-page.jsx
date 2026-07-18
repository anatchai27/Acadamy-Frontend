import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast, DatePickerInput } from '../../components/ui';
import { sessionService, courseService } from '../../services';
import { useAbortController } from '../../hooks';

const STATUS_MAP = {
  scheduled: { label: 'ตามตาราง', color: 'bg-oasis-primary/10 text-oasis-primary' },
  completed: { label: 'เสร็จสิ้น', color: 'bg-oasis-success-light text-oasis-success-dark' },
  cancelled: { label: 'ยกเลิก', color: 'bg-oasis-danger-light text-oasis-danger-dark' },
};

const emptyForm = {
  scheduledAt: '',
  durationMin: '120',
  roomId: '',
};

export function SessionsPage({ path, courseId }) {
  const [sessions, setSessions] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const getSignal = useAbortController();

  const fetchCourse = async () => {
    try {
      const res = await courseService.getCourseById(courseId);
      setCourse(res.data?.data || res.data || null);
    } catch { /* silent */ }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await sessionService.getSessions(courseId, {}, { signal: getSignal() });
      const payload = res.data?.data || res.data || {};
      setSessions(payload.sessions || (Array.isArray(payload) ? payload : []));
    } catch {
      showToast('ไม่สามารถโหลดตารางสอนได้', 'error');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    fetchCourse();
    fetchSessions();
  }, [courseId]);

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.scheduledAt) {
      showToast('กรุณาระบุวันที่และเวลาเริ่ม', 'error');
      return;
    }
    if (!form.durationMin || Number(form.durationMin) <= 0) {
      showToast('กรุณาระบุระยะเวลา (นาที)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMin: Number(form.durationMin) || 120,
        roomId: form.roomId.trim() || undefined,
      };

      await sessionService.createSession(courseId, payload);
      showToast('เพิ่มคาบเรียนสำเร็จ', 'success');
      closeForm();
      fetchSessions();
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'บันทึกไม่สำเร็จ';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  return (
    <AdminLayout path={path}>
      <button
        type="button"
        onClick={() => route('/admin/courses')}
        class="text-sm text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 mb-4"
      >
        <ChevronLeftIcon class="h-4 w-4" />
        กลับไปหน้าคอร์สเรียน
      </button>

      <div class="mb-8 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">
            {course?.name || 'ตารางสอน'}
          </h2>
          <p class="text-sm text-zinc-500 mt-1">
            {course?.subject && `${course.subject} · `}จัดการคาบเรียนทั้งหมด
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <span class="flex items-center gap-1.5">
            <PlusIcon class="h-4 w-4" />
            เพิ่มคาบเรียน
          </span>
        </Button>
      </div>

      {showForm && (
        <div class="bg-white rounded-2xl border border-zinc-200/80 p-6 mb-6">
          <h3 class="text-base font-semibold text-zinc-900 mb-4">เพิ่มคาบเรียนใหม่</h3>
          <form onSubmit={handleSubmit}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerInput
                label="วันที่และเวลาเริ่ม *"
                showTime
                value={form.scheduledAt ? new Date(form.scheduledAt) : null}
                onChange={(date) => setForm((prev) => ({ ...prev, scheduledAt: date ? date.toISOString() : '' }))}
                placeholder="เลือกวันที่และเวลา"
              />
              <SolidInput
                label="ระยะเวลา (นาที) *"
                type="number"
                placeholder="120"
                min="1"
                value={form.durationMin}
                onInput={updateField('durationMin')}
              />
              <SolidInput
                label="ห้องเรียน"
                placeholder="เช่น Room A"
                value={form.roomId}
                onInput={updateField('roomId')}
              />
            </div>
            <div class="flex gap-3 mt-4 pt-4 border-t border-zinc-100">
              <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>
                บันทึก
              </Button>
              <Button variant="outline" size="md" type="button" onClick={closeForm}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
          <p class="text-sm text-zinc-400">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
            <CalendarIcon class="h-10 w-10 text-zinc-300" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-700 mb-1">ยังไม่มีคาบเรียน</h3>
          <p class="text-sm text-zinc-400 mb-6">เพิ่มคาบเรียนเพื่อเริ่มจัดการตารางสอน</p>
          <Button variant="primary" size="md" onClick={openCreate}>+ เพิ่มคาบเรียนแรก</Button>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div class="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              class="bg-white rounded-2xl border border-zinc-200/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oasis-primary/5">
                  <CalendarIcon class="h-5 w-5 text-oasis-primary" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-zinc-900">
                    {formatDate(session.scheduledAt)}
                  </p>
                  {session.durationMin != null && (
                    <p class="text-xs text-zinc-500">
                      {session.durationMin} นาที
                    </p>
                  )}
                  <div class="flex flex-wrap items-center gap-1.5 mt-1">
                    {session.roomId && (
                      <span class="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        {session.roomId}
                      </span>
                    )}
                    {session.status && (
                      <span class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_MAP[session.status]?.color || 'bg-zinc-100 text-zinc-600'}`}>
                        {STATUS_MAP[session.status]?.label || session.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function PlusIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ChevronLeftIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function CalendarIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}