import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { HiOutlineUsers, HiOutlineQrCode, HiOutlineClipboardDocumentCheck, HiOutlineBanknotes } from 'react-icons/hi2';
import { StatCard } from './stat-card';
import { BentoGrid, BentoCell } from '../ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { studentService, attendanceService, leaveRequestService, reportService } from '../../services';
import { Input } from '../ui';

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
    title: 'นักเรียน',
    value: '—',
    trendText: '',
    trendDirection: 'neutral',
    isAlertState: false
  },
  attendance: {
    title: 'เช็คชื่อวันนี้',
    value: '—',
    trendText: '',
    trendDirection: 'neutral',
    isAlertState: false
  },
  requests: {
    title: 'คำขอลา/ชดเชย',
    value: '—',
    trendText: 'รอตรวจสอบ',
    trendDirection: 'neutral',
    isAlertState: false
  },
  revenue: {
    title: 'รายได้ (เดือนนี้)',
    value: '฿—',
    trendText: '',
    trendDirection: 'up',
    isAlertState: false
  }
};
export const DashboardOverviewWidget = () => {
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
          trendText: `ทั้งหมด ${total} คน`
        }
      }));
    }).catch(() => setError('โหลดข้อมูลนักเรียนไม่สำเร็จ'));
    attendanceService.getDailyAttendance({ date: selectedDate }).then(res => {
      const payload = res.data?.data || res.data || {};
      const attendances = payload.attendances || [];
      const counts = countAttendanceStatuses(attendances);
      setData(prev => ({
        ...prev,
        attendance: {
          ...prev.attendance,
          value: String(counts.present + counts.late),
          trendText: `มา ${counts.present} · สาย ${counts.late} · ขาด ${counts.absent} · ลา ${counts.leave}`,
          breakdown: counts,
        }
      }));
    }).catch(() => setError('โหลดข้อมูลเช็คชื่อไม่สำเร็จ'));
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
          trendText: count > 0 ? 'รอตรวจสอบ' : 'ไม่มีรายการใหม่',
          isAlertState: count > 0
        }
      }));
    }).catch(() => setError('โหลดคำขอลาไม่สำเร็จ'));
    reportService.getRevenueReport({ from: selectedDate, to: selectedDate, group_by: 'day' }).then(res => {
      const payload = res.data?.data || res.data || [];
      const totalAmount = getRevenueTotal(payload);
      setData(prev => ({
        ...prev,
        revenue: {
          ...prev.revenue,
          value: `฿${Number(totalAmount).toLocaleString()}`,
          trendText: selectedDate
        }
      }));
    }).catch(() => setError('โหลดรายได้ไม่สำเร็จ'));
  }, [selectedDate]);
  return <>
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 class="text-lg font-semibold text-zinc-900">ภาพรวมตามวันที่</h2><p class="text-sm text-zinc-500">ตัวเลขทั้งหมดมาจาก API ของวันที่เลือก</p></div>
      <Input type="date" label="วันที่" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} />
    </div>
    {error && <div role="alert" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    <BentoGrid class="mb-8">
      <BentoCell><StatCard id="students" title={data.students.title} value={data.students.value} trendText={data.students.trendText} trendDirection={data.students.trendDirection} isAlertState={data.students.isAlertState} icon={<UsersGroupIcon class="h-5 w-5" />} /></BentoCell>
      <BentoCell><StatCard id="attendance" title={data.attendance.title} value={data.attendance.value} trendText={data.attendance.trendText} trendDirection={data.attendance.trendDirection} isAlertState={data.attendance.isAlertState} icon={<QrCheckIcon class="h-5 w-5" />} /></BentoCell>
      <BentoCell>
        <button type="button" onClick={() => route('/admin/requests')} class="w-full text-left">
          <StatCard id="requests" title={data.requests.title} value={data.requests.value} trendText={data.requests.trendText} trendDirection={data.requests.trendDirection} isAlertState={data.requests.isAlertState} icon={<ClipboardDocIcon class="h-5 w-5" />} />
        </button>
      </BentoCell>
      <BentoCell><StatCard id="revenue" title={data.revenue.title} value={data.revenue.value} trendText={data.revenue.trendText} trendDirection={data.revenue.trendDirection} isAlertState={data.revenue.isAlertState} icon={<BanknotesIcon class="h-5 w-5" />} /></BentoCell>
    </BentoGrid>
  </>;
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
