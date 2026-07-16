export function Button({ children, variant = 'primary', size = 'md', onClick, type = 'button', class: className = '', disabled = false, loading = false }) {
  const baseClasses = 'font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-xl';
  
  const variants = {
    primary: 'bg-oasis-primary hover:bg-oasis-primary-dark text-white shadow-sm',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800',
    outline: 'bg-transparent border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300',
    link: 'bg-transparent border-none text-oasis-primary font-medium hover:text-oasis-primary-dark p-0 rounded-none',
  };
  
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-8 py-4',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button type={type} class={classes} onClick={onClick} disabled={disabled || loading}>
      {loading ? 'กำลังดำเนินการ...' : children}
    </button>
  );
}
