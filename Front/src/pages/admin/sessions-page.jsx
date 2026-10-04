import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { sessionService, courseService, roomService } from '../../services';
import { useAbortController } from '../../hooks';
import { BentoGrid } from '../../components/ui/bento-grid';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlinePlus, HiOutlineChevronLeft, HiOutlineCalendar, HiOutlineUser, HiOutlineBookOpen, HiOutlineClock, HiOutlineCurrencyDollar } from 'react-icons/hi2';

const STATUS_MAP = {
  scheduled: { label: 'ตามตาราง', color: 'bg-oasis-primary/10 text-oasis-primary' },
  completed: { label: 'เสร็จสิ้น', color: 'bg-oasis-success-light text-oasis-success-dark' },
  cancelled: { label: 'ยกเลิก', color: 'bg-oasis-danger-light text-oasis-danger-dark' },
};

const emptyForm = {
  scheduledDate: '',
  scheduledTime: '',
  durationMin: '120',
  roomId: '',
};
const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const emptyRule = { dayOfWeek: '1', startTime: '10:00', durationMin: '120', roomId: '' };

const toISOString = (date, time) => new Date(`${date}T${time}`).toISOString();

export function SessionsPage({ path, courseId }) {
  const [sessions, setSessions] = useState([]);
  const [course, setCourse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState({ startDate: '', endDate: '', rules: [{ ...emptyRule }] });
  const getSignal = useAbortController();
  const getRoomSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

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

  const fetchRooms = async () => {
    try {
      const res = await roomService.getRooms({ signal: getRoomSignal() });
      const payload = res.data?.data || res.data || [];
      setRooms(Array.isArray(payload) ? payload.filter(room => room.isActive !== false) : []);
    } catch {
      setRooms([]);
      showToast('ไม่สามารถโหลด Master ห้องเรียนได้', 'error');
    }
  };

  useEffect(() => {
    if (!courseId) return;
    fetchCourse();
    fetchSessions();
    fetchRooms();
  }, [courseId]);

  const openCreate = () => {
    setForm(emptyForm);
    setRecurring(false);
    setRecurrence({ startDate: '', endDate: '', rules: [{ ...emptyRule }] });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setRecurrence({ startDate: '', endDate: '', rules: [{ ...emptyRule }] });
  };

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateRule = (index, field) => (e) => setRecurrence(previous => ({
    ...previous,
    rules: previous.rules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, [field]: e.target.value } : rule),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recurring && (!form.scheduledDate || !form.scheduledTime)) {
      showToast('กรุณาระบุวันเดือนปีและเวลาเริ่ม', 'error');
      return;
    }
    if (!recurring && (!form.durationMin || Number(form.durationMin) <= 0)) {
      showToast('กรุณาระบุระยะเวลา (นาที)', 'error');
      return;
    }
    if (recurring && (!recurrence.startDate || !recurrence.endDate || recurrence.rules.length === 0)) {
      showToast('กรุณาระบุช่วงวันที่และอย่างน้อย 1 วันเรียน', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (recurring) {
        await sessionService.createRecurringSessions(courseId, {
          startDate: recurrence.startDate,
          endDate: recurrence.endDate,
          rules: recurrence.rules.map(rule => ({ ...rule, dayOfWeek: Number(rule.dayOfWeek), durationMin: Number(rule.durationMin), roomId: rule.roomId || null })),
        });
        showToast('สร้างตารางเรียนแบบหลายวันสำเร็จ', 'success');
      } else {
        await sessionService.createSession(courseId, {
          scheduledAt: toISOString(form.scheduledDate, form.scheduledTime),
          durationMin: Number(form.durationMin) || 120,
          roomId: form.roomId.trim() || undefined,
        });
        showToast('เพิ่มคาบเรียนสำเร็จ', 'success');
      }
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
  const formatDay = (iso) => iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
  const getRoomName = roomId => rooms.find(room => String(room.id) === String(roomId))?.name || (roomId ? `ห้อง ${roomId}` : 'ไม่ระบุห้อง');
  const upcomingSessionsCount = sessions.filter((session) =>
    session.status === 'scheduled' && new Date(session.scheduledAt).getTime() >= Date.now(),
  ).length;

  return (
    <AdminLayout path={path}>
      <button
        type="button"
        onClick={() => route('/admin/courses')}
        class="text-sm text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 mb-4"
      >
        <HiOutlineChevronLeft class="h-4 w-4" />
        กลับไปหน้าคอร์สเรียน
      </button>

      <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-semibold tracking-tight text-zinc-900">
            {course?.name || 'ตารางสอน'}
          </h2>
          <p class="mt-1 text-sm text-zinc-500">
            {course?.subject && `${course.subject} · `}จัดการคาบเรียนทั้งหมด
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <span class="flex items-center gap-1.5">
            <HiOutlinePlus class="h-4 w-4" />
            เพิ่มคาบเรียน
          </span>
        </Button>
      </div>

      <section class={`${isNeo ? 'neo-card border-3 border-black bg-white' : 'rounded-2xl border border-zinc-200/80 bg-white shadow-sm'} mb-6 overflow-hidden`}>
        <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div class="p-5 sm:p-6">
            <div class="flex items-start gap-3">
              <div class={`flex h-11 w-11 shrink-0 items-center justify-center ${isNeo ? 'border-2 border-black bg-[#dbeafe]' : 'rounded-xl bg-oasis-primary/10 text-oasis-primary'}`}>
                <HiOutlineBookOpen class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">ข้อมูลคอร์สเรียน</p>
                <h3 class="mt-1 text-lg font-bold text-zinc-900">{course?.name || 'กำลังโหลดข้อมูลคอร์ส...'}</h3>
                <p class="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">
                  {course?.subject || 'ยังไม่ได้ระบุรายละเอียดวิชา'}
                </p>
              </div>
            </div>
          </div>
          <div class={`grid grid-cols-2 border-t border-zinc-100 sm:grid-cols-4 lg:min-w-[500px] lg:border-l lg:border-t-0 ${isNeo ? 'lg:border-black' : ''}`}>
            <div class="border-r border-zinc-100 p-4 sm:p-5 lg:border-b-0">
              <p class="flex items-center gap-1.5 text-xs text-zinc-400"><HiOutlineUser class="h-3.5 w-3.5" />ผู้สอน</p>
              <p class="mt-2 truncate text-sm font-semibold text-zinc-800" title={course?.teacherName || ''}>{course?.teacherName || 'ยังไม่กำหนด'}</p>
            </div>
            <div class="border-b border-zinc-100 p-4 sm:p-5 lg:border-b-0 lg:border-r">
              <p class="flex items-center gap-1.5 text-xs text-zinc-400"><HiOutlineClock class="h-3.5 w-3.5" />คาบที่ยังไม่ถึงวันเรียน</p>
              <p class="mt-2 text-sm font-semibold text-zinc-800">{upcomingSessionsCount} คาบ</p>
            </div>
            <div class="border-r border-zinc-100 p-4 sm:p-5">
              <p class="flex items-center gap-1.5 text-xs text-zinc-400"><HiOutlineCurrencyDollar class="h-3.5 w-3.5" />ค่าเรียน</p>
              <p class="mt-2 text-sm font-bold text-orange-600">{course?.price != null ? `฿${Number(course.price).toLocaleString()}` : '-'}</p>
            </div>
            <div class="p-4 sm:p-5">
              <p class="text-xs text-zinc-400">รหัสวิชา</p>
              <p class="mt-2 text-sm font-semibold text-zinc-800">#{course?.id || courseId}</p>
            </div>
          </div>
        </div>
      </section>

      {showForm && (
        <div class={`${isNeo ? 'neo-card bg-white p-6' : 'bg-white rounded-2xl border border-zinc-200/80 p-6'} mb-6`}>
          <div class="p-6">
            <h3 class="text-base font-semibold text-zinc-900 mb-1">กำหนดรายละเอียดการสอน</h3>
            <p class="mb-4 text-sm text-zinc-500">ตั้งวัน เวลา และห้องเรียนสำหรับวิชานี้</p>
           <label class="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-700">
             <input type="checkbox" checked={recurring} onChange={event => setRecurring(event.currentTarget.checked)} class="h-4 w-4 accent-oasis-primary" />
             กำหนดตารางสอนหลายวัน
           </label>
           {recurring ? (
             <div class="grid gap-4">
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label class="grid gap-2 text-sm font-medium text-zinc-700">เริ่มสอนวันที่ *<input type="date" value={recurrence.startDate} onInput={event => setRecurrence(previous => ({ ...previous, startDate: event.target.value }))} class="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm" /></label>
                  <label class="grid gap-2 text-sm font-medium text-zinc-700">สิ้นสุดวันที่ *<input type="date" value={recurrence.endDate} onInput={event => setRecurrence(previous => ({ ...previous, endDate: event.target.value }))} class="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm" /></label>
               </div>
               {recurrence.rules.map((rule, index) => (
                 <div class="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]" key={index}>
                    <label class="grid gap-2 text-xs font-semibold text-zinc-600">วันสอน<select value={rule.dayOfWeek} onChange={updateRule(index, 'dayOfWeek')} class="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal">{dayNames.map((day, dayIndex) => <option key={dayIndex} value={dayIndex}>{day}</option>)}</select></label>
                    <label class="grid gap-2 text-xs font-semibold text-zinc-600">เวลาเรียน<input type="time" value={rule.startTime} onInput={updateRule(index, 'startTime')} class="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal" /></label>
                    <label class="grid gap-2 text-xs font-semibold text-zinc-600">ระยะเวลา (นาที)<input type="number" min="1" value={rule.durationMin} onInput={updateRule(index, 'durationMin')} class="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal" /></label>
                    <label class="grid gap-2 text-xs font-semibold text-zinc-600">สถานที่เรียน<select value={rule.roomId} onChange={updateRule(index, 'roomId')} class="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal"><option value="">ไม่ระบุ</option>{rooms.map(room => <option key={room.id} value={String(room.id)}>{room.name}</option>)}</select></label>
                   <button type="button" class="self-end rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50" disabled={recurrence.rules.length === 1} onClick={() => setRecurrence(previous => ({ ...previous, rules: previous.rules.filter((_, ruleIndex) => ruleIndex !== index) }))}>ลบ</button>
                 </div>
               ))}
                <Button type="button" variant="outline" onClick={() => setRecurrence(previous => ({ ...previous, rules: [...previous.rules, { ...emptyRule }] }))}>+ เพิ่มวันสอน</Button>
             </div>
           ) : (
           <form onSubmit={handleSubmit}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="grid gap-2 text-sm font-medium text-zinc-700">
                 วันที่สอน *
                <input
                  type="date"
                  value={form.scheduledDate}
                  onInput={updateField('scheduledDate')}
                  class={`w-full px-4 py-2.5 text-sm focus:outline-none ${isNeo ? 'neo-input' : 'rounded-xl border border-zinc-200 focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                />
              </label>
              <label class="grid gap-2 text-sm font-medium text-zinc-700">
                 เวลาเรียนเริ่ม *
                <input
                  type="time"
                  value={form.scheduledTime}
                  onInput={updateField('scheduledTime')}
                  class={`w-full px-4 py-2.5 text-sm focus:outline-none ${isNeo ? 'neo-input' : 'rounded-xl border border-zinc-200 focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                />
              </label>
              <SolidInput
                 label="ระยะเวลาต่อครั้ง (นาที) *"
                type="number"
                placeholder="120"
                min="1"
                value={form.durationMin}
                onInput={updateField('durationMin')}
              />
              <label class="grid gap-2 text-sm font-medium text-zinc-700">
                 สถานที่เรียน
                <select
                  value={form.roomId}
                  onChange={updateField('roomId')}
                  class={`w-full px-4 py-2.5 text-sm focus:outline-none ${isNeo ? 'neo-input' : 'rounded-xl border border-zinc-200 bg-white focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                >
                  <option value="">ไม่ระบุห้องเรียน</option>
                  {rooms.map(room => (
                    <option key={room.id} value={String(room.id)}>
                      {room.name}{room.description ? ` - ${room.description}` : ''}
                    </option>
                  ))}
                </select>
                {!rooms.length && <span class="text-xs font-normal text-zinc-500">ยังไม่มีห้องเรียนใน Master Data</span>}
              </label>
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
           )}
           {recurring && <div class="flex gap-3 mt-4 pt-4 border-t border-zinc-100"><Button variant="primary" type="button" onClick={handleSubmit} loading={submitting} disabled={submitting}>บันทึกตาราง</Button><Button variant="outline" size="md" type="button" onClick={closeForm}>ยกเลิก</Button></div>}
         </div>
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
            <HiOutlineCalendar class="h-10 w-10 text-zinc-300" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-700 mb-1">ยังไม่มีคาบเรียน</h3>
          <p class="text-sm text-zinc-400 mb-6">เพิ่มคาบเรียนเพื่อเริ่มจัดการตารางสอน</p>
          <Button variant="primary" size="md" onClick={openCreate}>+ เพิ่มคาบเรียนแรก</Button>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <section class="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h3 class="font-semibold text-zinc-900">รายละเอียดการสอน</h3>
              <p class="mt-0.5 text-xs text-zinc-500">{course?.subject || course?.name || 'รายละเอียดวิชาและตารางเรียน'}</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[680px] text-left text-sm">
              <thead class="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr><th class="px-5 py-3">วันสอน</th><th class="px-5 py-3">เวลาเรียน</th><th class="px-5 py-3">ระยะเวลา</th><th class="px-5 py-3">สถานที่เรียน</th><th class="px-5 py-3">สถานะการสอน</th></tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
          {sessions.map((session) => (
            <tr
              key={session.id}
              class="transition-colors hover:bg-zinc-50"
            >
              <td class="px-5 py-4 font-medium text-zinc-800">{formatDay(session.scheduledAt)}</td>
              <td class="px-5 py-4 text-zinc-600">{formatTime(session.scheduledAt)} น.</td>
              <td class="px-5 py-4 text-zinc-600">{session.durationMin} นาที</td>
              <td class="px-5 py-4 text-zinc-600">{getRoomName(session.roomId)}</td>
              <td class="px-5 py-4"><span class={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_MAP[session.status]?.color || 'bg-zinc-100 text-zinc-600'}`}>
                {STATUS_MAP[session.status]?.label || session.status || 'ตามตาราง'}
              </span></td>
            </tr>
          ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AdminLayout>
  );
}

