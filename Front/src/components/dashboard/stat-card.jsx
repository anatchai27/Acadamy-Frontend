const cardConfig = {
  students: {
    iconContainer: 'bg-blue-50',
    iconColor: 'text-blue-600',
    valueDefault: 'text-slate-900',
  },
  attendance: {
    iconContainer: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueDefault: 'text-slate-900',
  },
  requests: {
    iconContainer: 'bg-amber-50',
    iconColor: 'text-amber-600',
    alertBorder: 'ring-2 ring-amber-500/30',
    valueDefault: 'text-slate-900',
    valueAlert: 'text-amber-600',
  },
  revenue: {
    iconContainer: 'bg-slate-100',
    iconColor: 'text-slate-700',
    valueDefault: 'text-slate-900',
  },
};

export function StatCard({ id, title, value, trendText, trendDirection, isAlertState, icon }) {
  const config = cardConfig[id] || cardConfig.students;

  const borderClass = isAlertState && config.alertBorder
    ? config.alertBorder
    : '';

  const valueClass = isAlertState && config.valueAlert
    ? config.valueAlert
    : config.valueDefault;

  return (
    <div class={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md ${borderClass}`}>
      <div class="flex items-start justify-between mb-4">
        <div class={`flex h-10 w-10 items-center justify-center rounded-xl ${config.iconContainer}`}>
          {icon}
        </div>
        {trendText && (
          trendDirection === 'up' || trendDirection === 'down'
            ? (
              <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700`}>
                {trendDirection === 'up' ? <ArrowUpIcon class="h-3 w-3" /> : <ArrowDownIcon class="h-3 w-3" />}
                {trendText}
              </span>
            )
            : (
              <span class="text-xs font-medium text-slate-500">{trendText}</span>
            )
        )}
      </div>
      <p class={`text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
      <p class="text-xs text-slate-500 mt-1">{title}</p>
    </div>
  );
}

function ArrowUpIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function ArrowDownIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}
