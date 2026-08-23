import { useDesignTheme } from '../../hooks/useDesignTheme';
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  class: className = '',
  disabled = false,
  loading = false,
  neo
}) => {
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = neo !== undefined ? neo : designTheme === 'neobrutalism';
  const baseClasses = isNeo ? 'neo-btn font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed' : 'font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-xl';
  const variants = {
    primary: isNeo ? 'bg-oasis-primary hover:bg-oasis-primary-dark text-white' : 'bg-oasis-primary hover:bg-oasis-primary-dark text-white shadow-sm',
    secondary: isNeo ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    outline: isNeo ? 'bg-transparent text-slate-700 hover:bg-slate-50' : 'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    link: 'bg-transparent border-none text-oasis-primary font-medium hover:text-oasis-primary-dark p-0 rounded-none'
  };
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-8 py-4'
  };
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  return <button type={type} class={classes} onClick={onClick} disabled={disabled || loading}>
      {loading ? 'กำลังดำเนินการ...' : children}
    </button>;
};