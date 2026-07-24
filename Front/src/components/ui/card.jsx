import { useDesignTheme } from '../../hooks/useDesignTheme';

export function Card({ children, class: className = '', hover = true, neo }) {
  const { designTheme } = useDesignTheme();
  const isNeo = neo !== undefined ? neo : designTheme === 'neobrutalism';
  return (
    <div class={`${isNeo ? 'neo-card bg-white p-6' : 'bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm'} ${hover && !isNeo ? 'transition-all hover:shadow-md hover:border-zinc-300' : ''} ${className}`}>
      {children}
    </div>
  );
}
