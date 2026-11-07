import { HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi2';
const cardConfig = {
  students: {
    surface: 'bg-white border-slate-200',
    iconContainer: 'bg-blue-50',
    iconColor: 'text-blue-600',
    valueDefault: 'text-oasis-navy'
  },
  attendance: {
    surface: 'bg-white border-slate-200',
    iconContainer: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueDefault: 'text-oasis-navy'
  },
  requests: {
    surface: 'bg-amber-50/20 border-amber-200',
    iconContainer: 'bg-amber-50',
    iconColor: 'text-amber-600',
    alertBorder: 'ring-2 ring-amber-500/30',
    valueDefault: 'text-amber-700',
    valueAlert: 'text-amber-600'
  },
  revenue: {
    surface: 'bg-white border-slate-200',
    iconContainer: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueDefault: 'text-oasis-navy'
  }
};
export const StatCard = ({
  id,
  title,
  value,
  trendText,
  trendDirection,
  isAlertState,
  icon
}) => {
  const config = cardConfig[id] || cardConfig.students;
  const borderClass = isAlertState && config.alertBorder ? config.alertBorder : '';
  const valueClass = isAlertState && config.valueAlert ? config.valueAlert : config.valueDefault;
  return <div id={`dashboard-card-${id}`} class={`dashboard-stat-card min-w-0 ${config.surface} rounded-2xl border p-4 shadow-[0_3px_14px_rgba(23,53,92,0.06)] transition-shadow hover:shadow-[0_8px_24px_rgba(23,53,92,0.10)] ${borderClass}`}>
      <div class="mb-3 flex items-center justify-between gap-2">
        <p class="min-w-0 text-sm font-semibold text-slate-600">{title}</p>
        <div class={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.iconContainer} ${config.iconColor}`}>{icon}</div>
      </div>
      <div class="flex min-w-0 flex-wrap items-baseline gap-2">
        <p class={`m-0 text-2xl font-bold tracking-tight ${valueClass}`}>{value}</p>
        {trendText && (trendDirection === 'up' || trendDirection === 'down') && <span class="inline-flex max-w-full items-center gap-1 break-words rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          {trendDirection === 'up' ? <ArrowUpIcon class="h-3 w-3" /> : <ArrowDownIcon class="h-3 w-3" />}
          {trendText}
        </span>}
      </div>
      {trendText && trendDirection !== 'up' && trendDirection !== 'down' && <p class="mt-3 border-t border-slate-100 pt-2 text-xs font-medium text-slate-500">{trendText}</p>}
    </div>;
};
const ArrowUpIcon = ({
  class: className
}) => {
  return <HiOutlineArrowUp class={className} />;
};
const ArrowDownIcon = ({
  class: className
}) => {
  return <HiOutlineArrowDown class={className} />;
};
