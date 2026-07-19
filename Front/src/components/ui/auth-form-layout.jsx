export function AuthFormLayout({ title, subtitle, children }) {
  return (
    <div class="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl p-10 shadow-sm">
      <h2 class="text-2xl font-semibold text-zinc-900 mb-2 tracking-tight">{title}</h2>
      {subtitle && <p class="text-zinc-500 text-sm mb-8">{subtitle}</p>}
      {children}
    </div>
  );
}
