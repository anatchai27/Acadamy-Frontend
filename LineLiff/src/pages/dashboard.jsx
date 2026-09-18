import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineClipboardDocumentCheck, HiOutlineClock } from 'react-icons/hi2';
import { useLiffContext } from '../store/LiffContext';
import { getChildSessions, getParentDashboard } from '../services/parent-service';
import { ChildSwitcher } from '../components/child-switcher';
import { LiffLayout } from '../components/liff-layout';

export const getDashboardSchedule = dashboard => (
  Array.isArray(dashboard?.todaySchedule) ? dashboard.todaySchedule : []
);

export const resolveActiveChildId = (children, activeChildId) => {
  const allowedChildren = Array.isArray(children) ? children : [];
  return allowedChildren.some(child => child.id === activeChildId)
    ? activeChildId
    : allowedChildren[0]?.id || null;
};

export const getTodaySchedule = (sessions, now = new Date()) => {
  if (!Array.isArray(sessions)) return [];
  const today = new Date(now);
  return sessions
    .filter(session => {
      const scheduledAt = new Date(session.scheduledAt || session.ScheduledAt);
      return scheduledAt.toDateString() === today.toDateString();
    })
    .map(session => {
      const scheduledAt = new Date(session.scheduledAt || session.ScheduledAt);
      const durationMin = Number(session.durationMin ?? session.DurationMin ?? 0);
      const endAt = new Date(scheduledAt.getTime() + durationMin * 60 * 1000);
      return {
        time: scheduledAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        endTime: durationMin > 0 ? endAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '',
        title: session.courseName || session.CourseName || 'คาบเรียน',
        subtitle: session.roomId || session.RoomId ? `ห้อง ${session.roomId || session.RoomId}` : 'ตารางเรียน',
        status: session.status || session.Status || 'scheduled',
        tone: 'sage',
        active: (session.status || session.Status) === 'in_progress',
      };
    });
};

export const DashboardPage = () => {
  const { state, dispatch } = useLiffContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  useEffect(() => {
    if (!state.parentToken) {
      route('/liff/login', true);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    getParentDashboard()
      .then((res) => {
        if (!active) return;
        const dashboard = res.data?.data || res.data;
        setData({ ...dashboard, todaySchedule: [] });

        const children = Array.isArray(dashboard?.children) ? dashboard.children : [];
        dispatch({ type: 'SET_CHILDREN', payload: children });

        const resolvedActiveChildId = resolveActiveChildId(children, state.activeChildId);
        if (resolvedActiveChildId !== state.activeChildId) {
          dispatch({
            type: 'SET_ACTIVE_CHILD',
            payload: resolvedActiveChildId,
          });
        }
      })
      .catch((apiError) => {
        if (!active) return;
        setError(apiError?.message || 'โหลดข้อมูลหน้าหลักไม่สำเร็จ');
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [state.parentToken]);

  useEffect(() => {
    if (!state.parentToken || !state.activeChildId) return;

    let active = true;
    setScheduleError('');
    getChildSessions(state.activeChildId)
      .then((res) => {
        if (!active) return;
        const sessions = res.data?.data || res.data || [];
        setData(previous => ({
          ...(previous || {}),
          todaySchedule: getTodaySchedule(sessions),
        }));
      })
      .catch((apiError) => {
        if (!active) return;
        setScheduleError(apiError?.message || 'โหลดตารางเรียนไม่สำเร็จ');
        setData(previous => ({ ...(previous || {}), todaySchedule: [] }));
      });

    return () => { active = false; };
  }, [state.parentToken, state.activeChildId]);

  const activeChild = state.children.find(
    (child) => child.id === state.activeChildId,
  );

  if (loading) {
    return (
      <LiffLayout>
        <div class="flex min-h-[70vh] items-center justify-center">
          <div class="h-9 w-9 animate-spin rounded-full border-4 border-sage-200 border-t-sage-600" />
        </div>
      </LiffLayout>
    );
  }

  if (error) {
    return (
      <LiffLayout>
        <div class="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <p class="text-lg font-bold text-ink-900">โหลดข้อมูลไม่สำเร็จ</p>
          <p class="mt-2 text-sm text-ink-500">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            class="mt-5 min-h-11 rounded-2xl bg-sage-600 px-5 text-sm font-bold text-white"
          >
            ลองใหม่
          </button>
        </div>
      </LiffLayout>
    );
  }

  const schedule = getDashboardSchedule(data);

  return (
    <LiffLayout>
      <div class="space-y-5 pb-8">
        <header class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-ink-500">วันนี้เป็นอย่างไรบ้าง</p>
            <h1 class="mt-1 text-2xl font-bold tracking-tight text-ink-900">
              สวัสดี, {state.liffProfile?.displayName || 'คุณพ่อคุณแม่'}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => route('/liff/profile')}
            class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-sage-700 shadow-soft transition hover:-translate-y-0.5 active:scale-95"
            aria-label="เปิดโปรไฟล์"
          >
            {state.liffProfile?.displayName?.charAt(0) || '?'}
          </button>
        </header>

        <ChildSwitcher />

        {activeChild && (
          <>
            <section class="relative overflow-hidden rounded-card bg-gradient-to-br from-sage-600 to-sage-700 p-5 text-white shadow-float">
              <div class="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
              <div class="absolute -bottom-16 right-14 h-32 w-32 rounded-full bg-gold-500/20" />

              <div class="relative flex items-center gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white/20 text-2xl font-bold ring-4 ring-white/15">
                  {activeChild.photoUrl ? (
                    <img
                      src={activeChild.photoUrl}
                      alt={activeChild.fullName}
                      class="h-full w-full object-cover"
                    />
                  ) : (
                    activeChild.fullName?.charAt(0) || '?'
                  )}
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-xl font-bold">{activeChild.fullName}</p>
                  <p class="mt-0.5 text-sm text-white/75">
                    {activeChild.grade || 'ไม่ได้ระบุชั้นเรียน'}
                  </p>
                </div>
              </div>

              <div class="relative mt-5 flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
                <span class="h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_0_5px_rgba(190,242,100,0.15)]" />
                <span class="text-sm font-semibold">
                  {data?.currentStatus || 'กำลังเรียนอยู่'}
                </span>
                <span class="ml-auto text-xs text-white/70">อัปเดตล่าสุด</span>
              </div>
            </section>

            <section>
              <div class="mb-3 flex items-end justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-sage-600">
                    Today
                  </p>
                  <h2 class="mt-1 text-lg font-bold text-ink-900">ตารางเรียนวันนี้</h2>
                </div>
                <span class="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-600">
                  {data?.todayLabel || 'วันนี้'}
                </span>
              </div>

              <div class="rounded-card border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl">
                {scheduleError ? (
                  <p class="py-6 text-center text-sm text-red-600">{scheduleError}</p>
                ) : schedule.length > 0 ? schedule.map((item, index) => (
                  <TimelineItem key={`${item.title}-${index}`} {...item} />
                )) : (
                  <p class="py-6 text-center text-sm text-ink-500">วันนี้ยังไม่มีตารางเรียน</p>
                )}
              </div>
            </section>

            <section>
              <div class="mb-3 flex items-center justify-between">
                <h2 class="text-lg font-bold text-ink-900">ภาพรวมการเรียน</h2>
                <button
                  type="button"
                  onClick={() => route(`/liff/attendance/${activeChild.id}`)}
                  class="text-sm font-semibold text-sage-600"
                >
                  ดูทั้งหมด
                </button>
              </div>

              <div class="grid grid-cols-2 gap-3">
                 <StatCard icon={HiOutlineCheckCircle} label="มาเรียนเดือนนี้" value={data?.attendanceRate || '-'} detail={data?.attendanceRate ? 'จากข้อมูลจริง' : 'ยังไม่มีข้อมูล'} tone="sage" />
                <StatCard icon={HiOutlineChartBar} label="คะแนนล่าสุด" value={data?.latestSkillScore || '-'} detail="คะแนนทักษะ" tone="indigo" />
                <StatCard icon={HiOutlineClipboardDocumentCheck} label="การบ้านคงค้าง" value={data?.pendingHomework || '0'} detail="งานที่ต้องส่ง" tone="gold" />
                <StatCard icon={HiOutlineClock} label="เช็คชื่อวันนี้" value={data?.todayAttendance || '0'} detail="ครั้งที่บันทึก" tone="sage" />
              </div>
            </section>

            <div class="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => route(`/liff/scores/${activeChild.id}`)} class="rounded-card border border-indigo-100 bg-white p-4 text-left shadow-soft">
                <p class="font-bold text-ink-900">ดูคะแนนทักษะ</p><p class="mt-1 text-xs text-ink-500">ดูกราฟพัฒนาการรายหัวข้อ</p>
              </button>
              <button type="button" onClick={() => route(`/liff/homework/${activeChild.id}`)} class="rounded-card border border-gold-100 bg-white p-4 text-left shadow-soft">
                <p class="font-bold text-ink-900">การบ้าน</p><p class="mt-1 text-xs text-ink-500">ดูโจทย์และส่งรูปงาน</p>
              </button>
            </div>

            <button
              type="button"
              onClick={() => route(`/liff/leave-makeup/${activeChild.id}`)}
              class="flex w-full items-center justify-between rounded-card border border-sage-200 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-sage-400"
            >
              <span>
                <span class="block font-bold text-ink-900">ลาและเรียนชดเชย</span>
                <span class="mt-1 block text-sm text-ink-500">แจ้งลา ดูเครดิต และจองที่นั่งเรียนชดเชย</span>
              </span>
              <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-50 text-sage-700" aria-hidden="true">→</span>
            </button>

            <div class="rounded-card border border-gold-100 bg-gold-50 p-4 shadow-soft">
              <div class="flex gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                  +
                </div>
                <div>
                  <p class="font-bold text-ink-900">กำลังไปได้ดี</p>
                  <p class="mt-1 text-sm leading-6 text-ink-700">
                    ติดตามการเรียนของน้องได้จากหน้านี้ทุกวัน
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </LiffLayout>
  );
};

const TimelineItem = ({
  time,
  endTime,
  title,
  subtitle,
  tone = 'sage',
  status,
  active = false,
}) => {
  const dotColors = {
    sage: 'bg-sage-500 ring-sage-100',
    indigo: 'bg-indigo-500 ring-indigo-100',
    gold: 'bg-gold-500 ring-gold-100',
  };

  return (
    <div class="relative flex gap-3 pb-5 last:pb-0">
      <div class="flex w-14 shrink-0 flex-col items-center">
        <span class="text-xs font-bold text-ink-700">{time}</span>
        <span class="mt-0.5 text-[10px] text-ink-500">{endTime}</span>
      </div>

      <div class="relative flex min-w-0 flex-1 gap-3">
        <div class="flex flex-col items-center">
          <span class={`mt-1.5 h-3 w-3 rounded-full ring-4 ${dotColors[tone] || dotColors.sage}`} />
          <span class="mt-2 h-full w-px bg-sage-100" />
        </div>

        <div class={`min-w-0 flex-1 rounded-2xl p-3 ${active ? 'bg-sage-50 ring-1 ring-sage-200' : 'bg-slate-50/80'}`}>
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate font-bold text-ink-900">{title}</p>
              <p class="mt-0.5 truncate text-xs text-ink-500">{subtitle}</p>
            </div>
            <span class={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-sage-100 text-sage-700' : 'bg-white text-ink-500'}`}>
              {status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, detail, tone = 'sage' }) => {
  const tones = {
    sage: 'bg-sage-100 text-sage-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    gold: 'bg-gold-100 text-gold-600',
  };

  return (
    <div class="rounded-card border border-white/80 bg-white/80 p-4 shadow-soft transition hover:-translate-y-0.5">
      <div class={`mb-4 flex h-9 w-9 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon class="h-5 w-5" aria-hidden="true" />
      </div>
      <p class="text-xs font-medium text-ink-500">{label}</p>
      <p class="mt-1 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
      <p class="mt-1 text-[11px] text-ink-500">{detail}</p>
    </div>
  );
};
