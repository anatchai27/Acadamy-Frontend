import { useState, useEffect, useCallback } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, showToast, showConfirm } from '../../components/ui';
import { leaveRequestService } from '../../services';
import { useAbortController } from '../../hooks';

const STATUS_MAP = {
  pending: { label: 'รอตรวจสอบ', color: 'bg-oasis-warning/5 text-oasis-warning' },
  approved: { label: 'อนุมัติแล้ว', color: 'bg-oasis-success/5 text-oasis-success' },
  rejected: { label: 'ปฏิเสธ', color: 'bg-oasis-danger/5 text-oasis-danger' },
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
        <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">คำร้องขอ</h2>
        <p class="text-sm text-zinc-500 mt-1">
          ตรวจสอบและจัดการคำขอลา / ชดเชยของนักเรียน
          {pendingCount > 0 && (
            <span class="ml-2 inline-flex items-center rounded-full bg-oasis-warning/5 px-2 py-0.5 text-xs font-medium text-oasis-warning">
              รอดำเนินการ {pendingCount} รายการ
            </span>
          )}
        </p>
      </div>

      {/* Status Filter */}
      <div class="inline-flex rounded-xl border border-zinc-200 overflow-hidden mb-6">
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
                ? 'bg-oasis-primary text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
          <p class="text-sm text-zinc-400">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && requests.length === 0 && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
            <ClipboardIcon class="h-10 w-10 text-zinc-300" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-600 mb-1">ไม่มีคำร้องขอ</h3>
          <p class="text-sm text-zinc-400">
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
              class="bg-white rounded-2xl border border-zinc-200 p-5"
            >
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-base font-semibold text-zinc-900">
                      {req.studentName || `นักเรียน #${req.studentId}`}
                    </h3>
                    <span class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_MAP[req.status]?.color || 'bg-zinc-100 text-zinc-600'}`}>
                      {STATUS_MAP[req.status]?.label || req.status}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
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
                      class="px-4 py-2 text-sm font-medium text-oasis-danger border border-oasis-danger/20 rounded-xl hover:bg-oasis-danger/5 disabled:opacity-50 transition-colors"
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