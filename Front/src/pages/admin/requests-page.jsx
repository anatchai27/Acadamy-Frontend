import { useState, useEffect, useCallback } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, showToast, showConfirm } from '../../components/ui';
import { leaveRequestService } from '../../services';
import { useAbortController } from '../../hooks';

const STATUS_MAP = {
  pending: { label: 'รอตรวจสอบ', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const TYPE_MAP = {
  leave: 'ลาหยุด',
  makeup: 'ชดเชย',
};

export function RequestsPage({ path }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const getSignal = useAbortController();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: filter };
      const res = await leaveRequestService.getLeaveRequests(params, { signal: getSignal() });
      const payload = res.data?.data || res.data || {};
      setRequests(payload.requests || (Array.isArray(payload) ? payload : []));
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลคำร้องขอได้', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการอนุมัติ',
      message: 'คุณแน่ใจว่าต้องการอนุมัติคำร้องขอนี้ใช่หรือไม่?',
      yesLabel: 'อนุมัติ',
      cancelLabel: 'ยกเลิก',
    });
    if (!confirmed) return;

    setActionLoading(id);
    try {
      await leaveRequestService.approveLeaveRequest(id);
      showToast('อนุมัติคำร้องขอสำเร็จ', 'success');
      fetchRequests();
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'อนุมัติไม่สำเร็จ';
      showToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const confirmed = await showConfirm({
      title: 'ยืนยันการปฏิเสธ',
      message: 'คุณแน่ใจว่าต้องการปฏิเสธคำร้องขอนี้ใช่หรือไม่?',
      yesLabel: 'ปฏิเสธ',
      cancelLabel: 'ยกเลิก',
    });
    if (!confirmed) return;

    setActionLoading(id);
    try {
      await leaveRequestService.rejectLeaveRequest(id);
      showToast('ปฏิเสธคำร้องขอแล้ว', 'success');
      fetchRequests();
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'ปฏิเสธไม่สำเร็จ';
      showToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">คำร้องขอ</h2>
        <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">
          ตรวจสอบและจัดการคำขอลา / ชดเชยของนักเรียน
          {pendingCount > 0 && (
            <span class="ml-2 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              รอดำเนินการ {pendingCount} รายการ
            </span>
          )}
        </p>
      </div>

      {/* Status Filter */}
      <div class="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden mb-6">
        {[
          { value: 'pending', label: 'รอตรวจสอบ' },
          { value: 'approved', label: 'อนุมัติแล้ว' },
          { value: 'rejected', label: 'ปฏิเสธ' },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            class={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === opt.value
                ? 'bg-amber-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p class="text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && requests.length === 0 && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <ClipboardIcon class="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">ไม่มีคำร้องขอ</h3>
          <p class="text-sm text-slate-400">
            {filter === 'pending' ? 'ไม่มีคำร้องขอที่รอดำเนินการ' : `ไม่มีคำร้องขอสถานะ "${STATUS_MAP[filter]?.label || filter}"`}
          </p>
        </div>
      )}

      {/* Requests List */}
      {!loading && requests.length > 0 && (
        <div class="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                      {req.studentName || `นักเรียน #${req.studentId}`}
                    </h3>
                    <span class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_MAP[req.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_MAP[req.status]?.label || req.status}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>ประเภท: {TYPE_MAP[req.type] || req.type}</span>
                    {req.sessionScheduledAt && <span>วันที่: {new Date(req.sessionScheduledAt).toLocaleDateString('th-TH')}</span>}
                    {req.reason && (
                      <span class="italic">เหตุผล: {req.reason}</span>
                    )}
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoading === req.id}
                      class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                    >
                      ปฏิเสธ
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(req.id)}
                      loading={actionLoading === req.id}
                      disabled={actionLoading === req.id}
                    >
                      อนุมัติ
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function ClipboardIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
