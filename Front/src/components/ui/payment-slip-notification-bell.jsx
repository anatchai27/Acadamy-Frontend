import { useEffect, useRef, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { financeService } from '../../services/finance-service';
import { BellIcon } from './icons';

const formatBaht = amount => `฿${Number(amount || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;

export const PaymentSlipNotificationBell = ({ isNeo = false }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [review, setReview] = useState({ count: 0, items: [], leaveRequestCount: 0, leaveRequests: [] });
  const containerRef = useRef(null);

  const refresh = async () => {
    try {
      const response = await financeService.getPendingSlipReviews();
      const payload = response.data?.data || response.data || {};
      setReview({
        count: Number(payload.count || 0),
        items: Array.isArray(payload.items) ? payload.items : [],
        leaveRequestCount: Number(payload.leaveRequestCount || 0),
        leaveRequests: Array.isArray(payload.leaveRequests) ? payload.leaveRequests : [],
      });
      setError('');
    } catch {
      setError('โหลดรายการสลิปไม่สำเร็จ ลองกดรีเฟรชอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 30000);
    const closeOnOutsideClick = event => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('click', closeOnOutsideClick);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('click', closeOnOutsideClick);
    };
  }, []);

  const openReviewQueue = () => {
    setOpen(false);
    route('/admin/finance?review=slips');
    window.dispatchEvent(new Event('open-payment-slip-review'));
  };

  const openNotification = item => {
    setOpen(false);
    if (item.kind === 'leave') {
      route('/admin/requests');
      window.dispatchEvent(new Event('open-leave-request-queue'));
      return;
    }
    openReviewQueue();
  };

  const totalCount = review.count + review.leaveRequestCount;
  const notifications = [
    ...review.items.map(item => ({ ...item, kind: 'slip' })),
    ...review.leaveRequests.map(item => ({ ...item, kind: 'leave' })),
  ].sort((left, right) => new Date(right.requestedAt || right.paidAt || 0) - new Date(left.requestedAt || left.paidAt || 0));

  return (
    <div class="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={totalCount ? `มีรายการรอตรวจ ${totalCount} รายการ` : 'การแจ้งเตือน'}
        aria-expanded={open}
        onClick={event => {
          event.stopPropagation();
          setOpen(value => !value);
          if (!open) refresh();
        }}
        class={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isNeo ? 'border-2 border-black bg-white text-black hover:bg-amber-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <BellIcon class="h-5 w-5" />
        {totalCount > 0 && (
          <span class="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white" aria-hidden="true">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="สลิปที่รอตรวจสอบ"
          class="absolute right-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xl"
        >
          <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900">รายการที่รอตรวจ</h2>
              <p class="mt-0.5 text-xs text-slate-600">สลิป {review.count} · คำขอลา {review.leaveRequestCount}</p>
            </div>
            <button type="button" onClick={refresh} disabled={loading} class="rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
              รีเฟรช
            </button>
          </div>

          {error ? (
            <div class="px-4 py-4 text-sm text-red-700" role="alert">{error}</div>
          ) : loading ? (
            <div class="px-4 py-5 text-sm text-slate-600" role="status">กำลังโหลดรายการ…</div>
          ) : notifications.length === 0 ? (
            <div class="px-4 py-5 text-sm text-slate-600">ตอนนี้ไม่มีรายการรอตรวจ เยี่ยมเลย!</div>
          ) : (
            <ul class="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {notifications.slice(0, 8).map(item => (
                <li key={`${item.kind}-${item.id}`}>
                  <button type="button" onClick={() => openNotification(item)} class="w-full px-4 py-3 text-left transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none">
                    <span class="flex items-start justify-between gap-3">
                      <span class="min-w-0">
                        <span class="block truncate text-sm font-semibold text-slate-900">{item.studentName || 'ไม่ทราบชื่อนักเรียน'}</span>
                        <span class="mt-0.5 block truncate text-xs text-slate-600">{item.kind === 'leave' ? `คำขอลา · ${item.reason || 'ไม่มีรายละเอียด'}` : `${item.courseName || 'บิลรวม'} · ${item.invoiceNo}`}</span>
                      </span>
                      {item.kind === 'slip' && <span class="shrink-0 text-sm font-bold text-slate-900">{formatBaht(item.amount)}</span>}
                    </span>
                    <span class="mt-2 block text-xs font-semibold text-blue-700">{item.kind === 'leave' ? 'เปิดคำร้องขอ →' : 'เปิดคิวตรวจสลิป →'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div class="grid grid-cols-2 border-t border-slate-100">
            <button type="button" onClick={() => openNotification({ kind: 'leave' })} disabled={review.leaveRequestCount === 0} class="min-h-11 px-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:text-slate-400 disabled:hover:bg-white">
              ดูคำร้องขอลา
            </button>
            <button type="button" onClick={openReviewQueue} disabled={review.count === 0} class="min-h-11 border-l border-slate-100 px-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:text-slate-400 disabled:hover:bg-white">
              ดูคิวตรวจสลิป
            </button>
          </div>
        </section>
      )}
    </div>
  );
};