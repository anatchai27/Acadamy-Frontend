import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { HiOutlineUsers, HiOutlineQrCode, HiOutlineClipboardDocumentCheck, HiOutlineBanknotes } from 'react-icons/hi2';
import { StatCard } from './stat-card';
import { BentoGrid, BentoCell } from '../ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { studentService, attendanceService, leaveRequestService, reportService } from '../../services';
import { Input } from '../ui';
import { useTranslation } from '../../hooks';

export const countAttendanceStatuses = attendances => (attendances || []).reduce((counts, attendance) => {
  const status = attendance.status || attendance.Status;
  if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
  return counts;
}, { present: 0, late: 0, absent: 0, leave: 0 });

export const getRevenueTotal = payload => {
  const rows = Array.isArray(payload) ? payload : payload?.rows || [];
  return rows.reduce((total, row) => total + (Number(row.grossAmount ?? row.GrossAmount) || 0), 0);
};

const getLocalDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const defaultData = {
  students: {
    value: '—',
    trendText: '',
    trendDirection: 'neutral',
    isAlertState: false
  },
  attendance: {
    value: '—',
    trendText: '',
    trendDirection: 'neutral',
    isAlertState: false
  },
  requests: {
    value: '—',
    trendText: '',
    trendDirection: 'neutral',
    isAlertState: false
  },
  revenue: {
    value: '฿—',
    trendText: '',
    trendDirection: 'up',
    isAlertState: false
  }
};
export const DashboardOverviewWidget = () => {
  const { t, currentLanguage } = useTranslation();
  const [data, setData] = useState(defaultData);
  const [selectedDate, setSelectedDate] = useState(getLocalDate);
  const [error, setError] = useState('');
  useEffect(() => {
    studentService.getStudents({
      limit: 1
    }).then(res => {
      const payload = res.data?.data || res.data || {};
      const total = payload.pagination?.totalItems !== undefined && payload.pagination?.totalItems !== null ? payload.pagination?.totalItems : Array.isArray(payload.students) ? payload.students.length : 0;
      setData(prev => ({
        ...prev,
        students: {
          ...prev.students,
          value: String(total),
          trendText: t('dashboard.overview.studentsCount', { count: total })
        }
      }));
    }).catch(() => setError(t('dashboard.overview.errors.students')));
    attendanceService.getDailyAttendance({ date: selectedDate }).then(res => {
      const payload = res.data?.data || res.data || {};
      const attendances = payload.attendances || [];
      const counts = countAttendanceStatuses(attendances);
      setData(prev => ({
        ...prev,
        attendance: {
          ...prev.attendance,
          value: String(counts.present + counts.late),
          trendText: t('dashboard.overview.attendanceBreakdown', counts),
          breakdown: counts,
        }
      }));
    }).catch(() => setError(t('dashboard.overview.errors.attendance')));
    leaveRequestService.getLeaveRequests({
      status: 'pending'
    }).then(res => {
      const payload = res.data?.data || res.data || {};
      const requests = payload.requests || (Array.isArray(payload) ? payload : []);
      const count = requests.length;
      setData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          value: String(count),
          trendText: count > 0 ? t('dashboard.overview.pendingRequests') : t('dashboard.overview.noRequests'),
          isAlertState: count > 0
        }
      }));
    }).catch(() => setError(t('dashboard.overview.errors.requests')));
    reportService.getRevenueReport({ from: selectedDate, to: selectedDate, group_by: 'day' }).then(res => {
      const payload = res.data?.data || res.data || [];
      const totalAmount = getRevenueTotal(payload);
      setData(prev => ({
        ...prev,
        revenue: {
          ...prev.revenue,
          value: `฿${Number(totalAmount).toLocaleString()}`,
          trendText: new Date(`${selectedDate}T00:00:00`).toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US')
        }
      }));
    }).catch(() => setError(t('dashboard.overview.errors.revenue')));
  }, [selectedDate, currentLanguage]);
  return <section id="dashboard-overview" aria-label={t('dashboard.overview.ariaLabel')}>
    <div id="dashboard-date-filter" class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 class="text-lg font-semibold text-zinc-900">{t('dashboard.overview.title')}</h2><p class="text-sm text-zinc-500">{t('dashboard.overview.description')}</p></div>
      <Input type="date" label={t('dashboard.overview.date')} value={selectedDate} onChange={event => setSelectedDate(event.target.value)} />
    </div>
    {error && <div id="dashboard-error" role="alert" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    <BentoGrid id="dashboard-stat-grid" class="mb-8">
      <BentoCell id="dashboard-stat-students"><StatCard id="students" title={t('dashboard.overview.stats.students')} value={data.students.value} trendText={data.students.trendText} trendDirection={data.students.trendDirection} isAlertState={data.students.isAlertState} icon={<UsersGroupIcon class="h-5 w-5" />} /></BentoCell>
      <BentoCell id="dashboard-stat-attendance"><StatCard id="attendance" title={t('dashboard.overview.stats.attendance')} value={data.attendance.value} trendText={data.attendance.trendText} trendDirection={data.attendance.trendDirection} isAlertState={data.attendance.isAlertState} icon={<QrCheckIcon class="h-5 w-5" />} /></BentoCell>
      <BentoCell>
        <button id="dashboard-stat-requests" type="button" onClick={() => route('/admin/requests')} class="w-full text-left">
          <StatCard id="requests" title={t('dashboard.overview.stats.requests')} value={data.requests.value} trendText={data.requests.trendText} trendDirection={data.requests.trendDirection} isAlertState={data.requests.isAlertState} icon={<ClipboardDocIcon class="h-5 w-5" />} />
        </button>
      </BentoCell>
      <BentoCell id="dashboard-stat-revenue"><StatCard id="revenue" title={t('dashboard.overview.stats.revenue')} value={data.revenue.value} trendText={data.revenue.trendText} trendDirection={data.revenue.trendDirection} isAlertState={data.revenue.isAlertState} icon={<BanknotesIcon class="h-5 w-5" />} /></BentoCell>
    </BentoGrid>
  </section>;
};
const UsersGroupIcon = ({
  class: className
}) => {
  return <HiOutlineUsers class={className} />;
};
const QrCheckIcon = ({
  class: className
}) => {
  return <HiOutlineQrCode class={className} />;
};
const ClipboardDocIcon = ({
  class: className
}) => {
  return <HiOutlineClipboardDocumentCheck class={className} />;
};
const BanknotesIcon = ({
  class: className
}) => {
  return <HiOutlineBanknotes class={className} />;
};
