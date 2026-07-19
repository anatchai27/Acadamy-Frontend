const statusConfig = {
  present: { label: 'มาเรียน', class: 'bg-emerald-100 text-emerald-700' },
  active: { label: 'ใช้งาน', class: 'bg-emerald-100 text-emerald-700' },
  paid: { label: 'ชำระแล้ว', class: 'bg-emerald-100 text-emerald-700' },
  success: { label: 'สำเร็จ', class: 'bg-emerald-100 text-emerald-700' },
  late: { label: 'มาสาย', class: 'bg-amber-100 text-amber-700' },
  pending: { label: 'รอดำเนินการ', class: 'bg-amber-100 text-amber-700' },
  absent: { label: 'ขาด', class: 'bg-red-100 text-red-700' },
  inactive: { label: 'ไม่ใช้งาน', class: 'bg-red-100 text-red-700' },
  unpaid: { label: 'ค้างชำระ', class: 'bg-red-100 text-red-700' },
  leave: { label: 'ลา', class: 'bg-slate-100 text-slate-600' },
};

export function StatusBadge({ status, label, class: className = '' }) {
  const config = statusConfig[status] || { label: status || '-', class: 'bg-zinc-100 text-zinc-600' };
  return (
    <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.class} ${className}`}>
      {label || config.label}
    </span>
  );
}
