import { route } from 'preact-router';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { HiOutlineArrowPath, HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineDocumentText, HiOutlineTicket } from 'react-icons/hi2';
import { useLiffContext } from '../store/LiffContext';
import {
  cancelMakeupBooking,
  createChildLeaveRequest,
  createMakeupBooking,
  getChildLeaveRequests,
  getChildSessions,
  getMakeupCredits,
  getMakeupSlots,
  getMakeupBookings,
  uploadLeaveAttachment,
} from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';

const tabs = [
  { id: 'leave', label: 'แจ้งลา', icon: HiOutlineDocumentText },
  { id: 'makeup', label: 'เรียนชดเชย', icon: HiOutlineTicket },
];

const unwrap = response => response?.data?.data || response?.data || [];
const formatDate = value => value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';
const statusLabel = value => ({ pending: 'รอพิจารณา', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ', available: 'พร้อมใช้', reserved: 'ถูกจองแล้ว', used: 'ใช้แล้ว', expired: 'หมดอายุ', cancelled: 'ยกเลิกแล้ว' }[value] || value || '-');

export const LeaveMakeupPage = ({ childId }) => {
  const { state } = useLiffContext();
  const selectedChildId = Number(childId || state.activeChildId);
  const activeChild = state.children.find(child => child.id === selectedChildId);
  const [tab, setTab] = useState('leave');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!state.parentToken) route('/liff/login', true);
  }, [state.parentToken]);

  if (!state.parentToken) return null;

  return (
    <LiffLayout showBack>
      <div class="space-y-5">
        <header>
          <p class="text-sm font-medium text-sage-600">จัดการสิทธิ์การเรียน</p>
          <h1 class="mt-1 text-2xl font-bold text-ink-900">ลาและเรียนชดเชย</h1>
          {activeChild && <p class="mt-1 text-sm text-ink-500">ของ {activeChild.fullName}</p>}
        </header>

        <div class="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-soft" role="tablist" aria-label="เมนูลาและเรียนชดเชย">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              class={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${tab === id ? 'bg-sage-600 text-white shadow-sm' : 'text-ink-500 hover:bg-sage-50'}`}
            >
              <Icon class="h-5 w-5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'leave' ? (
          <LeavePanel childId={selectedChildId} refreshKey={refreshKey} onRefresh={() => setRefreshKey(value => value + 1)} />
        ) : (
          <MakeupPanel childId={selectedChildId} refreshKey={refreshKey} onRefresh={() => setRefreshKey(value => value + 1)} />
        )}
      </div>
    </LiffLayout>
  );
};

const LeavePanel = ({ childId, refreshKey, onRefresh }) => {
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getChildSessions(childId), getChildLeaveRequests(childId)])
      .then(([sessionResponse, leaveResponse]) => {
        if (!active) return;
        setSessions(unwrap(sessionResponse));
        setRequests(unwrap(leaveResponse));
      })
      .catch(apiError => active && setError(apiError.message || 'โหลดข้อมูลการลาไม่สำเร็จ'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [childId, refreshKey]);

  const submit = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!sessionId || reason.trim().length < 2) {
      setError('กรุณาเลือกคาบเรียนและระบุเหตุผลอย่างน้อย 2 ตัวอักษร');
      return;
    }
    setSubmitting(true);
    try {
      const response = await createChildLeaveRequest(childId, { sessionId: Number(sessionId), reason: reason.trim() });
      const created = response.data?.data || response.data;
      if (attachment && created?.id) await uploadLeaveAttachment(created.id, attachment);
      setReason('');
      setSessionId('');
      setAttachment(null);
      setSuccess('ส่งคำขอลาแล้ว ระบบจะพิจารณาตามเวลาเรียนและแจ้งผลในรายการด้านล่าง');
      onRefresh();
    } catch (apiError) {
      setError(apiError.message || 'ส่งคำขอลาไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="space-y-4">
      <section class="rounded-card bg-white p-5 shadow-soft">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-600"><HiOutlineCalendarDays class="h-5 w-5" /></div>
          <div><h2 class="font-bold text-ink-900">แจ้งล่วงหน้าเพื่อรักษาสิทธิ์</h2><p class="mt-1 text-sm leading-6 text-ink-500">เลือกคาบเรียนที่น้องไม่สามารถมาได้ ระบบจะจัดประเภทคำขอตามเวลาให้อัตโนมัติ</p></div>
        </div>
        <form class="mt-5 space-y-4" onSubmit={submit}>
          <label class="block"><span class="mb-1.5 block text-sm font-bold text-ink-700">คาบเรียน</span><select value={sessionId} onChange={event => setSessionId(event.currentTarget.value)} class="w-full rounded-2xl border border-sage-200 bg-sage-50 px-3 py-3 text-sm text-ink-900 outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200" disabled={loading || submitting}><option value="">เลือกคาบเรียน</option>{sessions.map(session => <option key={session.id} value={session.id}>{session.courseName} · {formatDate(session.scheduledAt)}</option>)}</select></label>
          <label class="block"><span class="mb-1.5 block text-sm font-bold text-ink-700">เหตุผล</span><textarea value={reason} onInput={event => setReason(event.currentTarget.value)} rows="3" placeholder="เช่น ป่วย มีธุระครอบครัว" class="w-full resize-none rounded-2xl border border-sage-200 bg-sage-50 px-3 py-3 text-sm text-ink-900 outline-none placeholder:text-ink-500 focus:border-sage-600 focus:ring-2 focus:ring-sage-200" disabled={submitting} /></label>
          <label class="block"><span class="mb-1.5 block text-sm font-bold text-ink-700">หลักฐานการลา <span class="font-normal text-ink-500">(ถ้ามี, PDF/JPG/PNG/WEBP ไม่เกิน 5MB)</span></span><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => setAttachment(event.currentTarget.files?.[0] || null)} disabled={submitting} class="block w-full rounded-2xl border border-dashed border-sage-300 bg-sage-50 px-3 py-3 text-sm text-ink-700 file:mr-3 file:rounded-xl file:border-0 file:bg-sage-600 file:px-3 file:py-2 file:font-bold file:text-white" /></label>
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}
          <button type="submit" disabled={submitting || loading || !sessions.length} class="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-sage-600 px-4 text-sm font-bold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <HiOutlineArrowPath class="h-5 w-5 animate-spin" /> : <HiOutlineDocumentText class="h-5 w-5" />} {submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอลา'}</button>
        </form>
      </section>

      <section><SectionTitle icon={HiOutlineDocumentText} title="คำขอของฉัน" /><div class="mt-3 space-y-2">{loading ? <SkeletonList /> : requests.length ? requests.map(request => <LeaveItem key={request.id} request={request} />) : <EmptyState text="ยังไม่มีคำขอลา" />}</div></section>
    </div>
  );
};

const MakeupPanel = ({ childId, refreshKey, onRefresh }) => {
  const [credits, setCredits] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getMakeupCredits(childId), getMakeupBookings(childId), getMakeupSlots({ from: new Date().toISOString() })])
      .then(([creditResponse, bookingResponse, slotResponse]) => {
        if (!active) return;
        setCredits(unwrap(creditResponse));
        setBookings(unwrap(bookingResponse));
        setSlots(unwrap(slotResponse));
      })
      .catch(apiError => active && setError(apiError.message || 'โหลดสิทธิ์เรียนชดเชยไม่สำเร็จ'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [childId, refreshKey]);

  const availableCredit = useMemo(() => credits.find(credit => credit.status === 'available' && new Date(credit.expiresAt) > new Date()), [credits]);

  const book = async slot => {
    if (!availableCredit) { setError('ยังไม่มีเครดิตเรียนชดเชยที่พร้อมใช้'); return; }
    setError(''); setSuccess(''); setBookingId(slot.id);
    try {
      await createMakeupBooking({ slotId: slot.id, studentId: childId, creditId: availableCredit.id });
      setSuccess('จองเรียนชดเชยสำเร็จ');
      onRefresh();
    } catch (apiError) {
      setError(apiError.message || 'จองที่นั่งไม่สำเร็จ อาจมีผู้จองเต็มแล้ว');
    } finally { setBookingId(null); }
  };

  const cancel = async booking => {
    setError(''); setSuccess(''); setBookingId(booking.id);
    try { await cancelMakeupBooking(booking.id); setSuccess('ยกเลิกการจองและคืนเครดิตแล้ว'); onRefresh(); }
    catch (apiError) { setError(apiError.message || 'ยกเลิกการจองไม่สำเร็จ'); }
    finally { setBookingId(null); }
  };

  return (
    <div class="space-y-4">
      <section class="rounded-card bg-sage-700 p-5 text-white shadow-float"><div class="flex items-center gap-3"><HiOutlineTicket class="h-7 w-7 text-gold-100" /><div><p class="text-sm text-white/70">เครดิตที่พร้อมใช้</p><p class="mt-0.5 text-2xl font-bold">{loading ? '...' : availableCredit ? '1 สิทธิ์' : 'ไม่มีสิทธิ์'}</p></div></div>{availableCredit && <p class="mt-3 text-xs text-white/70">ใช้ได้ถึง {formatDate(availableCredit.expiresAt)}</p>}</section>
      {error && <Alert tone="error">{error}</Alert>}{success && <Alert tone="success">{success}</Alert>}
      <section><SectionTitle icon={HiOutlineTicket} title="การจองของฉัน" /><div class="mt-3 space-y-2">{loading ? <SkeletonList /> : bookings.length ? bookings.map(booking => <BookingItem key={booking.id} booking={booking} busy={bookingId === booking.id} onCancel={() => cancel(booking)} />) : <EmptyState text="ยังไม่มีการจองเรียนชดเชย" />}</div></section>
      <section><SectionTitle icon={HiOutlineCalendarDays} title="ที่นั่งเรียนชดเชยที่เปิดอยู่" /><div class="mt-3 space-y-3">{loading ? <SkeletonList /> : slots.length ? slots.map(slot => <SlotItem key={slot.id} slot={slot} disabled={!availableCredit || bookingId === slot.id} busy={bookingId === slot.id} onBook={() => book(slot)} onCancel={() => cancel(slot)} />) : <EmptyState text="ยังไม่มีที่นั่งเรียนชดเชย" />}</div></section>
    </div>
  );
};

const LeaveItem = ({ request }) => <article class="rounded-2xl border border-sage-100 bg-white p-4 shadow-soft"><div class="flex items-start justify-between gap-3"><div><p class="font-bold text-ink-900">{request.courseName || 'คาบเรียน'}</p><p class="mt-1 text-xs text-ink-500">{request.reason || 'ไม่ได้ระบุเหตุผล'}</p></div><span class="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-bold text-sage-700">{statusLabel(request.status)}</span></div><p class="mt-3 text-xs text-ink-500">ยื่นเมื่อ {formatDate(request.createdAt)}</p></article>;

const BookingItem = ({ booking, busy, onCancel }) => <article class="rounded-2xl border border-sage-100 bg-white p-4 shadow-soft"><div class="flex items-start justify-between gap-3"><div><p class="font-bold text-ink-900">เรียนชดเชย · ครูผู้สอน #{booking.teacherId}</p><p class="mt-1 text-sm text-ink-500">{formatDate(booking.scheduledAt)} · ห้อง {booking.roomId || '-'}</p></div><span class="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-bold text-sage-700">{statusLabel(booking.status)}</span></div>{booking.status === 'reserved' && <button type="button" disabled={busy} onClick={onCancel} class="mt-3 min-h-10 w-full rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700 disabled:opacity-50">{busy ? 'กำลังยกเลิก...' : 'ยกเลิกการจองและคืนเครดิต'}</button>}</article>;

const SlotItem = ({ slot, disabled, busy, onBook, onCancel }) => <article class="rounded-2xl border border-sage-100 bg-white p-4 shadow-soft"><div class="flex items-start justify-between gap-3"><div><p class="font-bold text-ink-900">ครูผู้สอน #{slot.teacherId}</p><p class="mt-1 text-sm text-ink-500">{formatDate(slot.scheduledAt)} · ห้อง {slot.roomId || '-'}</p></div><span class="rounded-full bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-600">{slot.bookedCount}/{slot.capacity} ที่นั่ง</span></div><div class="mt-3 flex gap-2"><button type="button" disabled={disabled} onClick={onBook} class="min-h-10 flex-1 rounded-xl bg-sage-600 px-3 text-sm font-bold text-white hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'กำลังดำเนินการ...' : 'จองที่นั่ง'}</button>{slot.status === 'reserved' && <button type="button" disabled={busy} onClick={onCancel} class="min-h-10 rounded-xl border border-sage-200 px-3 text-sm font-bold text-sage-700 disabled:opacity-50">ยกเลิก</button>}</div></article>;

const SectionTitle = ({ icon: Icon, title }) => <div class="flex items-center gap-2"><Icon class="h-5 w-5 text-sage-600" /><h2 class="text-lg font-bold text-ink-900">{title}</h2></div>;
const Alert = ({ tone, children }) => <div role="alert" class={`rounded-2xl px-4 py-3 text-sm font-semibold ${tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-sage-50 text-sage-700'}`}>{children}</div>;
const EmptyState = ({ text }) => <div class="rounded-2xl border border-dashed border-sage-200 bg-white px-4 py-8 text-center text-sm text-ink-500">{text}</div>;
const SkeletonList = () => <div class="space-y-2" aria-label="กำลังโหลด"><div class="h-20 animate-pulse rounded-2xl bg-sage-100" /><div class="h-20 animate-pulse rounded-2xl bg-sage-100" /></div>;
