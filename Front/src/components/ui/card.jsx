import { useDesignTheme } from '../../hooks/useDesignTheme';
export const Card = ({
  children,
  id,
  class: className = '',
  hover = true,
  neo
}) => {
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = neo !== undefined ? neo : designTheme === 'neobrutalism';
  return <div id={id} class={`${isNeo ? 'neo-card bg-white p-6' : 'bg-oasis-surface border border-oasis-border rounded-2xl p-6 shadow-[var(--oasis-shadow-surface)]'} ${hover && !isNeo ? 'transition-[border-color,box-shadow] duration-200 hover:shadow-[var(--oasis-shadow-floating)] hover:border-oasis-primary/30' : ''} ${className}`}>
      {children}
    </div>;
};
