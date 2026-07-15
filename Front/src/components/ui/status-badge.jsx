const statusConfig = {
  // present / active / paid → green
  present: { label: 'มาเรียน', class: 'bg-emerald-100 text-emerald-800' },
  active: { label: 'ใช้งาน', class: 'bg-emerald-100 text-emerald-800' },
  paid: { label: 'ชำระแล้ว', class: 'bg-emerald-100 text-emerald-800' },
  success: { label: 'สำเร็จ', class: 'bg-emerald-100 text-emerald-800' },
  // late → amber
  late: { label: 'มาสาย', class: 'bg-amber-100 text-amber-800' },
  pending: { label: 'รอดำเนินการ', class: 'bg-amber-100 text-amber-800' },
  // absent / inactive → red
  absent: { label: 'ขาด', class: 'bg-red-100 text-red-800' },
  inactive: { label: 'ไม่ใช้งาน', class: 'bg-red-100 text-red-800' },
  unpaid: { label: 'ค้างชำระ', class: 'bg-red-100 text-red-800' },
  // leave → slate
  leave: { label: 'ลา', class: 'bg-slate-100 text-slate-700' },
};

export function StatusBadge({ status, label, class: className = '' }) {
  const config = statusConfig[status] || { label: status || '-', class: 'bg-slate-100 text-slate-700' };
  return (
    <span class={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${config.class} ${className}`}>
      {label || config.label}
    </span>
  );
}
