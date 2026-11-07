import { useEffect, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { courseService, financeService, roomService, sessionService } from '../../services';
import { useTranslation } from '../../hooks';
import {
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineUser,
} from 'react-icons/hi2';

const getLocalDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const unwrap = response => response?.data?.data || response?.data || {};
const asArray = (value, key) => Array.isArray(value) ? value : Array.isArray(value?.[key]) ? value[key] : [];

export const getTodaySessions = (sessions, date = new Date()) => {
  const todayKey = getLocalDateKey(date);
  return (sessions || [])
    .filter(session => {
      const scheduledAt = new Date(session.scheduledAt);
      return !Number.isNaN(scheduledAt.getTime()) && getLocalDateKey(scheduledAt) === todayKey;
    })
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt));
};

const loadSessionsWithLimit = async (courses, signal, concurrency = 4) => {
  const result = [];
  let nextIndex = 0;
  let failedCount = 0;

  const workers = Array.from({ length: Math.min(concurrency, courses.length) }, async () => {
    while (nextIndex < courses.length) {
      const index = nextIndex;
      nextIndex += 1;
      const course = courses[index];
      try {
        const response = await sessionService.getSessions(course.id, {}, { signal });
        const sessions = asArray(unwrap(response), 'sessions');
        result.push(...sessions.map(session => ({ ...session, courseId: session.courseId || course.id, course })));
      } catch (error) {
        if (error?.name === 'AbortError' || signal.aborted) throw error;
        failedCount += 1;
      }
    }
  });

  await Promise.all(workers);
  return { sessions: result, failedCount };
};

const formatTime = (date, language) => new Intl.DateTimeFormat(language === 'th' ? 'th-TH' : 'en-US', {
  hour: '2-digit',
  minute: '2-digit',
}).format(date);

const statusClass = status => ({
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
}[status] || 'bg-slate-100 text-slate-600');

const statusKey = status => ({
  scheduled: 'scheduled',
  completed: 'completed',
  cancelled: 'cancelled',
}[status] || 'unknownStatus');

function TodaySchedulePanel() {
  const { t, currentLanguage } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [partial, setPartial] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const today = new Date();
  const todayKey = getLocalDateKey(today);

  useEffect(() => {
    const controller = new AbortController();
    const loadSchedule = async () => {
      setLoading(true);
      setError(false);
      setPartial(false);
      try {
        const [coursesResponse, roomsResponse] = await Promise.all([
          courseService.getCourses({}, { signal: controller.signal }),
          roomService.getRooms({ signal: controller.signal }).catch(() => null),
        ]);
        const courses = asArray(unwrap(coursesResponse), 'courses');
        const roomPayload = roomsResponse ? unwrap(roomsResponse) : [];
        setRooms(asArray(roomPayload, 'rooms'));
        const result = await loadSessionsWithLimit(courses, controller.signal);
        setSessions(getTodaySessions(result.sessions));
        setPartial(result.failedCount > 0);
      } catch (loadError) {
        if (loadError?.name !== 'AbortError' && !controller.signal.aborted) {
          setError(true);
          setSessions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadSchedule();
    return () => controller.abort();
  }, [todayKey, loadVersion]);

  const visibleSessions = useMemo(() => filter === 'all'
    ? sessions
    : sessions.filter(session => session.status === filter), [sessions, filter]);
  const counts = useMemo(() => sessions.reduce((result, session) => {
    result[session.status] = (result[session.status] || 0) + 1;
    return result;
  }, { all: sessions.length }), [sessions]);
  const roomNames = useMemo(() => new Map(rooms.map(room => [String(room.id), room.name])), [rooms]);
  const filters = [
    { key: 'all', label: t('dashboard.operations.filters.all') },
    { key: 'scheduled', label: t('dashboard.operations.filters.scheduled') },
    { key: 'completed', label: t('dashboard.operations.filters.completed') },
    { key: 'cancelled', label: t('dashboard.operations.filters.cancelled') },
  ];

  return (
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="dashboard-schedule-title">
      <header class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div class="flex items-start gap-3">
          <span class="mt-1 h-3 w-3 shrink-0 rounded-full bg-oasis-primary" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <h2 id="dashboard-schedule-title" class="text-base font-bold text-oasis-heading">{t('dashboard.operations.scheduleTitle')}</h2>
            <p class="mt-0.5 text-sm text-oasis-body">{t('dashboard.operations.scheduleDescription')}</p>
          </div>
          <button type="button" class="min-h-10 shrink-0 rounded-lg px-2 text-sm font-semibold text-oasis-primary hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary" onClick={() => route('/admin/courses')}>
            {t('dashboard.operations.allCourses')}
          </button>
        </div>
        <div class="dashboard-filter-tabs flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="group" aria-label={t('dashboard.operations.filterLabel')}>
          {filters.map(item => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              class={`min-h-9 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary ${filter === item.key ? 'bg-white text-oasis-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {item.label} ({counts[item.key] || 0})
            </button>
          ))}
        </div>
      </header>

      {partial && !loading && <p class="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800" role="status">{t('dashboard.operations.partialSchedule')}</p>}
      {error && !loading && <div class="flex items-center justify-between gap-3 px-4 py-5 text-sm text-rose-700" role="alert"><span>{t('dashboard.operations.scheduleError')}</span><button type="button" class="shrink-0 font-bold underline" onClick={() => setLoadVersion(value => value + 1)}>{t('dashboard.operations.retry')}</button></div>}
      {loading && <div class="space-y-3 p-4" role="status" aria-live="polite"><span class="sr-only">{t('dashboard.operations.loadingSchedule')}</span><div class="h-24 animate-pulse rounded-xl bg-slate-100" /><div class="h-24 animate-pulse rounded-xl bg-slate-100" /></div>}
      {!loading && !error && visibleSessions.length === 0 && <div class="px-5 py-8 text-center" role="status"><HiOutlineCalendarDays class="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" /><p class="mt-2 text-sm font-semibold text-slate-700">{sessions.length ? t('dashboard.operations.noMatchingSessions') : t('dashboard.operations.noSessions')}</p><p class="mt-1 text-xs text-slate-500">{t('dashboard.operations.noSessionsHelp')}</p></div>}
      {!loading && !error && visibleSessions.length > 0 && (
        <div class="space-y-3 p-3 sm:p-4">
          {visibleSessions.slice(0, 5).map(session => {
            const start = new Date(session.scheduledAt);
            const end = new Date(start.getTime() + (Number(session.durationMin) || 0) * 60000);
            const courseName = currentLanguage === 'en'
              ? session.course?.nameEn || session.courseNameEn || session.courseName || session.course?.name
              : session.courseName || session.course?.name;
            const roomName = session.roomId
              ? roomNames.get(String(session.roomId)) || `#${session.roomId}`
              : t('dashboard.operations.roomNotSet');
            return (
              <article key={`${session.courseId}-${session.id}`} class="rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:bg-slate-50/70 sm:p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <span class={`inline-flex min-h-6 items-center rounded-md px-2 text-xs font-bold ${statusClass(session.status)}`}>{t(`dashboard.operations.status.${statusKey(session.status)}`)}</span>
                  <span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"><HiOutlineMapPin class="h-3.5 w-3.5" aria-hidden="true" />{roomName}</span>
                  <span class="inline-flex items-center gap-1 text-xs text-slate-600"><HiOutlineClock class="h-3.5 w-3.5" aria-hidden="true" />{formatTime(start, currentLanguage)}–{formatTime(end, currentLanguage)}</span>
                </div>
                <div class="mt-2.5 flex flex-wrap items-end justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="line-clamp-2 text-sm font-bold leading-snug text-slate-900">{courseName || t('dashboard.operations.courseNameUnavailable')}</h3>
                    <p class="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><HiOutlineUser class="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />{session.course?.teacherName || t('dashboard.operations.teacherUnassigned')}</p>
                  </div>
                  <button type="button" class="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:border-oasis-primary/40 hover:text-oasis-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary" onClick={() => route(`/admin/courses/${session.courseId}/sessions`)}>
                    <HiOutlineBookOpen class="h-4 w-4" aria-hidden="true" />{t('dashboard.operations.openCourse')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {!loading && !error && visibleSessions.length > 5 && <p class="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-500">{t('dashboard.operations.moreSessions', { count: visibleSessions.length - 5 })}</p>}
    </section>
  );
}

function DashboardPriorityQueue() {
  const { t, currentLanguage } = useTranslation();
  const [review, setReview] = useState({ count: 0, items: [], leaveRequestCount: 0, leaveRequests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    financeService.getPendingSlipReviews({ signal: controller.signal })
      .then(response => {
        const payload = unwrap(response);
        setReview({
          count: Number(payload.count || 0),
          items: Array.isArray(payload.items) ? payload.items : [],
          leaveRequestCount: Number(payload.leaveRequestCount || 0),
          leaveRequests: Array.isArray(payload.leaveRequests) ? payload.leaveRequests : [],
        });
        setError(false);
      })
      .catch(loadError => {
        if (loadError?.name !== 'AbortError' && !controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadVersion]);

  const rows = useMemo(() => [
    ...review.items.map(item => ({ ...item, kind: 'slip' })),
    ...review.leaveRequests.map(item => ({ ...item, kind: 'leave' })),
  ].sort((left, right) => new Date(right.requestedAt || right.paidAt || 0) - new Date(left.requestedAt || left.paidAt || 0)), [review]);
  const totalCount = review.count + review.leaveRequestCount;
  const openQueue = kind => {
    if (kind === 'leave') {
      route('/admin/requests');
      window.dispatchEvent(new Event('open-leave-request-queue'));
      return;
    }
    route('/admin/finance?review=slips');
    window.dispatchEvent(new Event('open-payment-slip-review'));
  };
  const formatAmount = amount => `฿${Number(amount || 0).toLocaleString(currentLanguage === 'th' ? 'th-TH' : 'en-US')}`;
  const formatDate = value => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(currentLanguage === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' }).format(date);
  };

  return (
    <section id="dashboard-pending-actions" class="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm" aria-labelledby="dashboard-pending-title">
      <header class="flex items-center justify-between gap-3 bg-rose-600 px-4 py-3 text-white">
        <div class="flex min-w-0 items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15" aria-hidden="true">!</span>
          <div class="min-w-0">
            <h2 id="dashboard-pending-title" class="truncate text-sm font-bold text-white">{t('dashboard.operations.pendingTitle')} ({totalCount})</h2>
            <p class="text-xs text-rose-100">{t('dashboard.operations.pendingSubtitle')}</p>
          </div>
        </div>
        <span class="shrink-0 rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold">{t('dashboard.operations.needsReview')}</span>
      </header>
      {error && !loading && <div class="flex items-center justify-between gap-3 px-4 py-5 text-sm text-rose-700" role="alert"><span>{t('dashboard.operations.pendingError')}</span><button type="button" class="shrink-0 font-bold underline" onClick={() => { setLoading(true); setLoadVersion(value => value + 1); }}>{t('dashboard.operations.retry')}</button></div>}
      {loading && <div class="space-y-3 p-4" role="status" aria-live="polite"><span class="sr-only">{t('dashboard.operations.loadingPending')}</span><div class="h-14 animate-pulse rounded-lg bg-slate-100" /><div class="h-14 animate-pulse rounded-lg bg-slate-100" /></div>}
      {!loading && !error && rows.length === 0 && <p class="px-4 py-8 text-center text-sm text-slate-600" role="status">{t('dashboard.operations.noPending')}</p>}
      {!loading && !error && rows.length > 0 && (
        <ul class="divide-y divide-slate-100 px-4">
          {rows.slice(0, 5).map(item => (
            <li key={`${item.kind}-${item.id}`} class="flex items-center gap-3 py-3">
              <span class={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${item.kind === 'slip' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`} aria-hidden="true">{item.kind === 'slip' ? '฿' : '↻'}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold text-slate-800">{item.kind === 'slip' ? t('dashboard.operations.slipFor', { name: item.studentName || t('dashboard.operations.studentUnknown') }) : t('dashboard.operations.requestFor', { name: item.studentName || t('dashboard.operations.studentUnknown') })}</p>
                <p class="truncate text-xs text-slate-600">{item.kind === 'slip' ? [item.courseName, item.invoiceNo].filter(Boolean).join(' · ') : item.reason || t('dashboard.operations.requestDetailsUnavailable')}</p>
                <p class="mt-0.5 text-[11px] text-slate-500">{item.kind === 'slip' ? t('dashboard.operations.paymentRecorded') : t('dashboard.operations.requestCreated')} {formatDate(item.kind === 'slip' ? item.paidAt : item.requestedAt)}</p>
              </div>
              {item.kind === 'slip' && <strong class="shrink-0 text-sm text-slate-800">{formatAmount(item.amount)}</strong>}
            </li>
          ))}
        </ul>
      )}
      <footer class="grid grid-cols-2 border-t border-slate-100">
        <button type="button" onClick={() => openQueue('leave')} class="min-h-11 px-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-oasis-primary">
          {t('dashboard.operations.viewRequests')} ({review.leaveRequestCount})
        </button>
        <button type="button" onClick={() => openQueue('slip')} class="min-h-11 border-l border-slate-100 px-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-oasis-primary">
          {t('dashboard.operations.viewSlips')} ({review.count})
        </button>
      </footer>
    </section>
  );
}

function DashboardQuickActions({ actions, cardGrid = false }) {
  const { t } = useTranslation();
  const heading = <div class="mb-3">
    <h2 id="dashboard-quick-actions-title" class="text-sm font-bold text-slate-800">{t('dashboard.quickActions')}</h2>
    <p class="mt-0.5 text-xs text-slate-500">{t('dashboard.quickActionsDescription')}</p>
  </div>;

  if (!actions.length) {
    return <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="dashboard-quick-actions-title">
      {heading}
      <p class="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">{t('dashboard.noQuickActions')}</p>
    </section>;
  }

  if (cardGrid) {
    return <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="dashboard-quick-actions-title">
      {heading}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map(action => (
          <button key={action.path} type="button" onClick={() => route(action.path)} class="dashboard-shortcut-card group flex min-h-32 flex-col items-stretch justify-between rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary">
            <span class="flex items-center justify-between">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-oasis-primary"><action.icon class="h-5 w-5" aria-hidden="true" /></span>
              <HiOutlineArrowRight class="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-oasis-primary" aria-hidden="true" />
            </span>
            <span class="mt-3 block"><span class="block text-sm font-bold text-slate-800">{t(action.label)}</span><span class="mt-0.5 block text-xs text-slate-500">{t(action.description)}</span></span>
          </button>
        ))}
      </div>
    </section>;
  }

  return (
    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="dashboard-quick-actions-title">
      {heading}
      <div class="divide-y divide-slate-100">
        {actions.map(action => (
          <button key={action.path} type="button" onClick={() => route(action.path)} class="group flex min-h-14 w-full items-center gap-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-oasis-primary"><action.icon class="h-5 w-5" aria-hidden="true" /></span>
            <span class="min-w-0 flex-1"><span class="block text-sm font-semibold text-slate-800">{t(action.label)}</span><span class="block text-xs text-slate-500">{t(action.description)}</span></span>
            <HiOutlineArrowRight class="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-oasis-primary" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

export function DashboardOperations({ role, actions }) {
  return (
    <div class="dashboard-operations-grid grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
      <div class="space-y-6 xl:col-span-7">
        <TodaySchedulePanel />
        {role === 'admin' && <DashboardQuickActions actions={actions} cardGrid />}
      </div>
      <div class="space-y-6 xl:col-span-5">
        {role === 'admin' ? <DashboardPriorityQueue /> : <DashboardQuickActions actions={actions} />}
      </div>
    </div>
  );
}
