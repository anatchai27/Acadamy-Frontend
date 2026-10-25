import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { sessionService, courseService, roomService } from '../../services';
import { useAbortController } from '../../hooks';
import { BentoGrid } from '../../components/ui/bento-grid';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlinePlus, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineCalendar, HiOutlineUser, HiOutlineBookOpen, HiOutlineClock, HiOutlineCurrencyDollar } from 'react-icons/hi2';

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
const toDateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const getSessionDateKey = session => {
  const date = new Date(session.scheduledAt);
  return Number.isNaN(date.getTime()) ? null : toDateKey(date);
};
const getCalendarDays = month => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - firstDay.getDay());
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const end = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + (6 - lastDay.getDay()));
  const days = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) days.push(new Date(day));
  return days;
};
const calendarWeekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function SessionsPage({ path, courseId }) {
  const [sessions, setSessions] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [course, setCourse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [replaceFuture, setReplaceFuture] = useState(false);
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
    setEditingSessionId(null);
    setForm(emptyForm);
    setRecurring(false);
    setReplaceFuture(false);
    setRecurrence({ startDate: '', endDate: '', rules: [{ ...emptyRule }] });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSessionId(null);
    setReplaceFuture(false);
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

  const openEditSession = session => {
    const scheduledAt = new Date(session.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) return;
    const localDate = `${scheduledAt.getFullYear()}-${String(scheduledAt.getMonth() + 1).padStart(2, '0')}-${String(scheduledAt.getDate()).padStart(2, '0')}`;
    const localTime = `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}`;
    setEditingSessionId(session.id);
    setRecurring(false);
    setForm({ scheduledDate: localDate, scheduledTime: localTime, durationMin: String(session.durationMin || 120), roomId: session.roomId ? String(session.roomId) : '' });
    setShowForm(true);
  };

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

    if (recurring && replaceFuture) {
      const futureScheduledCount = sessions.filter(session =>
        session.status === 'scheduled' && new Date(session.scheduledAt).getTime() >= Date.now(),
      ).length;
      const confirmed = window.confirm(
        `ยืนยันแทนที่ตารางเรียนในอนาคต?\n\nระบบจะยกเลิกคาบที่ยังไม่มีข้อมูลเช็คชื่อ (มีคาบ scheduled ในอนาคต ${futureScheduledCount} คาบ) และสร้างตารางใหม่ตามที่กำหนด\n\nคาบที่ผ่านมาและคาบที่มีข้อมูลเช็คชื่อจะคงไว้ สิทธิ์เรียนของนักเรียนและเอกสารของคอร์สจะไม่เปลี่ยนแปลง`,
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      if (recurring) {
        const schedulePayload = {
          startDate: recurrence.startDate,
          endDate: recurrence.endDate,
          rules: recurrence.rules.map(rule => ({ ...rule, dayOfWeek: Number(rule.dayOfWeek), durationMin: Number(rule.durationMin), roomId: rule.roomId || null })),
        };
        if (replaceFuture) {
          const result = await sessionService.replaceFutureSessions(courseId, schedulePayload);
          const summary = result.data?.data || result.data || {};
          showToast(`แทนที่ตารางสำเร็จ · ยกเลิก ${summary.cancelledCount ?? 0} คาบ · คงไว้ ${summary.preservedCount ?? 0} คาบ · สร้างใหม่ ${summary.createdCount ?? 0} คาบ`, 'success');
        } else {
          await sessionService.createRecurringSessions(courseId, schedulePayload);
          showToast('สร้างตารางเรียนแบบหลายวันสำเร็จ', 'success');
        }
      } else if (editingSessionId) {
        await sessionService.updateSession(courseId, editingSessionId, {
          scheduledAt: toISOString(form.scheduledDate, form.scheduledTime),
          durationMin: Number(form.durationMin) || 120,
          roomId: form.roomId.trim() || null,
        });
        showToast('อัปเดตตารางเรียนสำเร็จ', 'success');
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
  const calendarDays = getCalendarDays(calendarMonth);
  const sessionsByDate = sessions.reduce((grouped, session) => {
    const dateKey = getSessionDateKey(session);
    if (dateKey) grouped[dateKey] = [...(grouped[dateKey] || []), session];
    return grouped;
  }, {});
  const selectedDaySessions = sessionsByDate[selectedDate] || [];
  const selectedSession = selectedDaySessions.find(session => String(session.id) === String(selectedSessionId));
  const monthLabel = calendarMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const todayKey = toDateKey(new Date());

  const changeCalendarMonth = offset => {
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
    setCalendarMonth(nextMonth);
    setSelectedDate(toDateKey(nextMonth));
    setSelectedSessionId(null);
  };

  const showToday = () => {
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toDateKey(today));
    setSelectedSessionId(null);
  };

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
            <h3 class="text-base font-semibold text-zinc-900 mb-1">{editingSessionId ? 'แก้ไขคาบเรียน' : 'กำหนดรายละเอียดการสอน'}</h3>
            <p class="mb-4 text-sm text-zinc-500">ตั้งวัน เวลา และห้องเรียนสำหรับวิชานี้</p>
           <label class="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-700">
             <input type="checkbox" checked={recurring} disabled={Boolean(editingSessionId)} onChange={event => { setRecurring(event.currentTarget.checked); if (!event.currentTarget.checked) setReplaceFuture(false); }} class="h-4 w-4 accent-oasis-primary disabled:opacity-50" />
             กำหนดตารางสอนหลายวัน
           </label>
           {recurring ? (
             <div class="grid gap-4">
               <label class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                 <input type="checkbox" aria-label="แทนที่ตารางเรียนในอนาคต" checked={replaceFuture} onChange={event => setReplaceFuture(event.currentTarget.checked)} class="mt-0.5 h-4 w-4 shrink-0 accent-amber-600" />
                 <span>
                   <span class="block font-semibold">แทนที่ตารางเรียนในอนาคต</span>
                   <span class="mt-1 block text-xs leading-5 text-amber-800">ยกเลิกเฉพาะคาบที่ยังไม่มีข้อมูลเช็คชื่อ คาบที่ผ่านมาและคาบที่มีเช็คชื่อจะคงไว้ สิทธิ์เรียนและเอกสารคอร์สไม่เปลี่ยน</span>
                 </span>
               </label>
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
                {editingSessionId ? 'บันทึกการแก้ไข' : 'บันทึก'}
              </Button>
              <Button variant="outline" size="md" type="button" onClick={closeForm}>
                ยกเลิก
              </Button>
            </div>
           </form>
           )}
           {recurring && <div class="flex gap-3 mt-4 pt-4 border-t border-zinc-100"><Button variant="primary" type="button" onClick={handleSubmit} loading={submitting} disabled={submitting}>{replaceFuture ? 'แทนที่และบันทึกตาราง' : 'บันทึกตาราง'}</Button><Button variant="outline" size="md" type="button" onClick={closeForm}>ยกเลิก</Button></div>}
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
        <section class={`${isNeo ? 'neo-card border-3 border-black bg-white' : 'overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm'}`}>
          <div class="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div class="min-w-0">
              <h3 class="font-semibold text-zinc-900">ปฏิทินตารางสอน</h3>
              <p class="mt-0.5 truncate text-xs text-zinc-500">{course?.subject || course?.name || 'เลือกคาบเรียนเพื่อดูรายละเอียด'}</p>
            </div>
            <div class="flex items-center justify-between gap-2 sm:justify-end">
              <div class="flex items-center gap-1">
                <button type="button" aria-label="เดือนก่อนหน้า" onClick={() => changeCalendarMonth(-1)} class="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oasis-primary">
                  <HiOutlineChevronLeft class="h-4 w-4" />
                </button>
                <button type="button" onClick={showToday} class="h-9 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oasis-primary">วันนี้</button>
                <button type="button" aria-label="เดือนถัดไป" onClick={() => changeCalendarMonth(1)} class="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oasis-primary">
                  <HiOutlineChevronRight class="h-4 w-4" />
                </button>
              </div>
              <p aria-live="polite" class="min-w-28 text-right text-sm font-bold text-zinc-900">{monthLabel}</p>
            </div>
          </div>

          <div class="p-2 sm:p-4">
            <div class="grid grid-cols-7 border-b border-zinc-100 pb-2 text-center text-[11px] font-semibold text-zinc-500 sm:text-xs">
              {calendarWeekdays.map((weekday, index) => <div key={weekday} class={index === 0 || index === 6 ? 'text-zinc-400' : ''}>{weekday}</div>)}
            </div>
            <div class="grid grid-cols-7">
              {calendarDays.map(day => {
                const dateKey = toDateKey(day);
                const daySessions = sessionsByDate[dateKey] || [];
                const inCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                const isSelected = dateKey === selectedDate;
                return (
                  <div key={dateKey} class={`min-h-[5.25rem] border-b border-r border-zinc-100 p-1 last:border-r-0 sm:min-h-28 sm:p-2 ${inCurrentMonth ? 'bg-white' : 'bg-zinc-50/70'}`}>
                    <button
                      type="button"
                      aria-label={`เลือกวันที่ ${day.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}${daySessions.length ? ` มี ${daySessions.length} คาบเรียน` : ''}`}
                      aria-pressed={isSelected}
                      onClick={() => { setSelectedDate(dateKey); setSelectedSessionId(null); }}
                      class={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-oasis-primary ${!inCurrentMonth ? 'text-zinc-300' : 'text-zinc-700'} ${dateKey === todayKey ? 'bg-oasis-primary text-white' : ''} ${isSelected && dateKey !== todayKey ? 'bg-oasis-primary/10 text-oasis-primary ring-1 ring-oasis-primary/30' : ''}`}
                    >
                      {new Intl.DateTimeFormat('th-TH', { day: 'numeric' }).format(day)}
                    </button>
                    <div class="space-y-1">
                      {daySessions.map(session => (
                        <button
                          key={session.id}
                          type="button"
                          aria-pressed={String(session.id) === String(selectedSessionId)}
                          onClick={() => { setSelectedDate(dateKey); setSelectedSessionId(session.id); }}
                          class={`block w-full truncate rounded px-1 py-1 text-left text-[9px] font-semibold leading-tight transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-oasis-primary sm:text-[11px] ${String(session.id) === String(selectedSessionId) ? 'bg-oasis-primary text-white' : session.status === 'cancelled' ? 'bg-oasis-danger-light text-oasis-danger-dark hover:bg-red-100' : session.status === 'completed' ? 'bg-oasis-success-light text-oasis-success-dark hover:bg-green-100' : 'bg-oasis-primary/10 text-oasis-primary hover:bg-oasis-primary/20'}`}
                          title={`${formatTime(session.scheduledAt)} · ${getRoomName(session.roomId)}`}
                        >
                          {formatTime(session.scheduledAt)} <span class="hidden sm:inline">น.</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1 text-[11px] text-zinc-500">
              <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-oasis-primary/20" />ตามตาราง</span>
              <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-oasis-success-light" />เสร็จสิ้น</span>
              <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-oasis-danger-light" />ยกเลิก</span>
            </div>
          </div>

          <div class="border-t border-zinc-100 bg-zinc-50/70 px-4 py-4 sm:px-5">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h4 class="text-sm font-bold text-zinc-900">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
              <span class="text-xs text-zinc-500">{selectedDaySessions.length} คาบเรียน</span>
            </div>
            {selectedSession ? (
              <div class="mt-3 rounded-xl border border-oasis-primary/20 bg-white p-4 shadow-sm">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-lg font-bold text-zinc-900">{formatTime(selectedSession.scheduledAt)} น.</p>
                    <p class="mt-1 text-sm text-zinc-600">ระยะเวลา {selectedSession.durationMin} นาที</p>
                  </div>
                  <span class={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_MAP[selectedSession.status]?.color || 'bg-zinc-100 text-zinc-600'}`}>
                    {STATUS_MAP[selectedSession.status]?.label || selectedSession.status || 'ตามตาราง'}
                  </span>
                </div>
                <div class="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3 text-sm text-zinc-600">
                  <HiOutlineCalendar class="h-4 w-4 shrink-0 text-oasis-primary" />
                  <span>{getRoomName(selectedSession.roomId)}</span>
                </div>
                {selectedSession.status === 'scheduled' && (
                  <div class="mt-4 flex justify-end border-t border-zinc-100 pt-3">
                    <Button variant="outline" size="md" onClick={() => openEditSession(selectedSession)}>แก้ไขคาบเรียน</Button>
                  </div>
                )}
              </div>
            ) : selectedDaySessions.length ? (
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                {selectedDaySessions.map(session => (
                  <button key={session.id} type="button" onClick={() => setSelectedSessionId(session.id)} class="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-left transition hover:border-oasis-primary/40 hover:bg-oasis-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oasis-primary">
                    <span class="min-w-0">
                      <span class="block font-semibold text-zinc-900">{formatTime(session.scheduledAt)} น. · {session.durationMin} นาที</span>
                      <span class="mt-0.5 block truncate text-xs text-zinc-500">{getRoomName(session.roomId)}</span>
                    </span>
                    <span class={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${STATUS_MAP[session.status]?.color || 'bg-zinc-100 text-zinc-600'}`}>
                      {STATUS_MAP[session.status]?.label || session.status || 'ตามตาราง'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p class="mt-2 text-sm text-zinc-500">ไม่มีคาบเรียนในวันที่เลือก</p>
            )}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}

