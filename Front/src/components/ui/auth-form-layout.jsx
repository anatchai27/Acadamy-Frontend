import { useDesignTheme } from '../../hooks/useDesignTheme';

export function AuthFormLayout({ title, subtitle, children }) {
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  return (
    <div class={'w-full max-w-md ' + (isNeo ? 'neo-card bg-white p-10' : 'bg-white border border-zinc-200/80 rounded-2xl p-10 shadow-sm')}>
      <h2 class={'text-2xl font-semibold mb-2 tracking-tight ' + (isNeo ? 'text-black' : 'text-zinc-900')}>{title}</h2>
      {subtitle && <p class="text-zinc-500 text-sm mb-8">{subtitle}</p>}
      {children}
    </div>
  );
}