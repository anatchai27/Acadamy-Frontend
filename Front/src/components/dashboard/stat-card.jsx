const cardConfig = {
  students: {
    iconContainer: 'bg-oasis-primary/5',
    iconColor: 'text-oasis-primary',
    valueDefault: 'text-zinc-900',
  },
  attendance: {
    iconContainer: 'bg-oasis-success/5',
    iconColor: 'text-oasis-success',
    valueDefault: 'text-zinc-900',
  },
  requests: {
    iconContainer: 'bg-oasis-warning/5',
    iconColor: 'text-oasis-warning',
    alertBorder: 'ring-2 ring-oasis-warning/30',
    valueDefault: 'text-zinc-900',
    valueAlert: 'text-oasis-warning',
  },
  revenue: {
    iconContainer: 'bg-zinc-100',
    iconColor: 'text-zinc-700',
    valueDefault: 'text-zinc-900',
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
    <div class={`bg-zinc-50 rounded-2xl border border-zinc-100 p-5 shadow-sm transition-all hover:shadow-md ${borderClass}`}>
      <div class="flex items-start justify-between mb-4">
        <div class={`flex h-10 w-10 items-center justify-center rounded-xl ${config.iconContainer}`}>
          {icon}
        </div>
        {trendText && (
          trendDirection === 'up' || trendDirection === 'down'
            ? (
              <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-oasis-success-light text-oasis-success-dark`}>
                {trendDirection === 'up' ? <ArrowUpIcon class="h-3 w-3" /> : <ArrowDownIcon class="h-3 w-3" />}
                {trendText}
              </span>
            )
            : (
              <span class="text-xs font-medium text-zinc-500">{trendText}</span>
            )
        )}
      </div>
      <p class={`text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
      <p class="text-xs text-zinc-500 mt-1">{title}</p>
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
