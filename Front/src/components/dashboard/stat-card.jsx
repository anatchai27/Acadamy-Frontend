import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi2';
const cardConfig = {
  students: {
    iconContainer: 'bg-blue-50',
    iconColor: 'text-blue-600',
    valueDefault: 'text-blue-700'
  },
  attendance: {
    iconContainer: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueDefault: 'text-emerald-700'
  },
  requests: {
    iconContainer: 'bg-amber-50',
    iconColor: 'text-amber-600',
    alertBorder: 'ring-2 ring-amber-500/30',
    valueDefault: 'text-amber-700',
    valueAlert: 'text-amber-600'
  },
  revenue: {
    iconContainer: 'bg-slate-100',
    iconColor: 'text-slate-700',
    valueDefault: 'text-slate-900'
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
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  const config = cardConfig[id] || cardConfig.students;
  const borderClass = isAlertState && config.alertBorder ? config.alertBorder : '';
  const valueClass = isAlertState && config.valueAlert ? config.valueAlert : config.valueDefault;
  return <div id={`dashboard-card-${id}`} class={`min-w-0 ${isNeo ? 'neo-card bg-white p-5' : 'bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md'} ${borderClass}`}>
      <div class="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div class={`flex h-10 w-10 items-center justify-center ${isNeo ? '' : 'rounded-xl'} ${config.iconContainer}`}>{icon}</div>
        {trendText ? trendDirection === 'up' || trendDirection === 'down' ? <span class="inline-flex max-w-full items-center gap-1 break-words px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              {trendDirection === 'up' ? <ArrowUpIcon class="h-3 w-3" /> : <ArrowDownIcon class="h-3 w-3" />}
              {trendText}
            </span> : <span class="max-w-full break-words text-xs font-medium text-slate-500">{trendText}</span> : null}
      </div>
      <p class={`text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
      <p class="text-xs text-slate-500 mt-1">{title}</p>
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
