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
  return <div id={id} class={`${isNeo ? 'neo-card bg-white p-6' : 'bg-oasis-surface border border-oasis-border rounded-2xl p-6 shadow-sm'} ${hover && !isNeo ? 'transition-all hover:shadow-md hover:border-oasis-primary/30' : ''} ${className}`}>
      {children}
    </div>;
};
