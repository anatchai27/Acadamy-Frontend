import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { HiOutlineUsers, HiOutlineQrCode, HiOutlineClipboardDocumentCheck, HiOutlineBanknotes } from 'react-icons/hi2';
import { StatCard } from './stat-card';
import { BentoGrid, BentoCell } from '../ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { studentService, attendanceService, financeService, leaveRequestService } from '../../services';
import { useAbortController } from '../../hooks';
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
  const getSignal = useAbortController();
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
    }).catch(() => {});
    attendanceService.getDailyAttendance().then(res => {
      const payload = res.data?.data || res.data || {};
      const attendances = payload.attendances || [];
      const presentCount = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
      setData(prev => ({
        ...prev,
        attendance: {
          ...prev.attendance,
          value: `${presentCount}/${attendances.length}`,
          trendText: `มาแล้ว ${presentCount}/${attendances.length}`
        }
      }));
    }).catch(() => {});
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
    }).catch(() => {});
    financeService.getPayments({
      limit: 1
    }).then(res => {
      const payload = res.data?.data || res.data || {};
      const totalAmount = payload.summary?.totalAmountInRange;
      setData(prev => ({
        ...prev,
        revenue: {
          ...prev.revenue,
          value: totalAmount != null ? `฿${Number(totalAmount).toLocaleString()}` : '฿—',
          trendText: totalAmount != null ? 'เดือนนี้' : ''
        }
      }));
    }).catch(() => {});
  }, []);
  return <BentoGrid class="mb-8">
      <BentoCell><StatCard id="students" title={data.students.title} value={data.students.value} trendText={data.students.trendText} trendDirection={data.students.trendDirection} isAlertState={data.students.isAlertState} icon={<UsersGroupIcon class="h-5 w-5" />} /></BentoCell>
      <BentoCell><StatCard id="attendance" title={data.attendance.title} value={data.attendance.value} trendText={data.attendance.trendText} trendDirection={data.attendance.trendDirection} isAlertState={data.attendance.isAlertState} icon={<QrCheckIcon class="h-5 w-5" />} /></BentoCell>
      <BentoCell>
        <button type="button" onClick={() => route('/admin/requests')} class="w-full text-left">
          <StatCard id="requests" title={data.requests.title} value={data.requests.value} trendText={data.requests.trendText} trendDirection={data.requests.trendDirection} isAlertState={data.requests.isAlertState} icon={<ClipboardDocIcon class="h-5 w-5" />} />
        </button>
      </BentoCell>
      <BentoCell><StatCard id="revenue" title={data.revenue.title} value={data.revenue.value} trendText={data.revenue.trendText} trendDirection={data.revenue.trendDirection} isAlertState={data.revenue.isAlertState} icon={<BanknotesIcon class="h-5 w-5" />} /></BentoCell>
    </BentoGrid>;
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