const statusConfig = {
  present: { label: 'มาเรียน', class: 'bg-oasis-success-light text-oasis-success-dark' },
  active: { label: 'ใช้งาน', class: 'bg-oasis-success-light text-oasis-success-dark' },
  paid: { label: 'ชำระแล้ว', class: 'bg-oasis-success-light text-oasis-success-dark' },
  success: { label: 'สำเร็จ', class: 'bg-oasis-success-light text-oasis-success-dark' },
  late: { label: 'มาสาย', class: 'bg-oasis-warning-light text-oasis-warning-dark' },
  pending: { label: 'รอดำเนินการ', class: 'bg-oasis-warning-light text-oasis-warning-dark' },
  absent: { label: 'ขาด', class: 'bg-oasis-danger-light text-oasis-danger-dark' },
  inactive: { label: 'ไม่ใช้งาน', class: 'bg-oasis-danger-light text-oasis-danger-dark' },
  unpaid: { label: 'ค้างชำระ', class: 'bg-oasis-danger-light text-oasis-danger-dark' },
  leave: { label: 'ลา', class: 'bg-zinc-100 text-zinc-600' },
};

export function StatusBadge({ status, label, class: className = '' }) {
  const config = statusConfig[status] || { label: status || '-', class: 'bg-zinc-100 text-zinc-600' };
  return (
    <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.class} ${className}`}>
      {label || config.label}
    </span>
  );
}
