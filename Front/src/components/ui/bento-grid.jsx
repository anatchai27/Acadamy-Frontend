import { useDesignTheme } from '../../hooks/useDesignTheme';

export function BentoGrid({ children, class: className = '' }) {
  return (
    <div class={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function BentoCell({ children, span, class: className = '', as = 'div' }) {
  const Tag = as;
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const colSpan = {
    1: 'col-span-1',
    2: 'col-span-1 sm:col-span-2',
    3: 'col-span-1 md:col-span-3',
    4: 'col-span-1 lg:col-span-4',
    full: 'col-span-1 lg:col-span-4',
  }[span] || 'col-span-1';

  return (
    <Tag class={`${colSpan} bento-cell-hover ${isNeo ? 'bg-white p-5' : 'bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm'} ${className}`}>
      {children}
    </Tag>
  );
}