export function AuthFormLayout({ title, subtitle, children }) {
  return (
    <div class="w-full max-w-md bg-white border border-slate-300 rounded-sm p-10">
      <h2 class="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
      {subtitle && <p class="text-slate-600 text-sm mb-8">{subtitle}</p>}
      {children}
    </div>
  );
}
