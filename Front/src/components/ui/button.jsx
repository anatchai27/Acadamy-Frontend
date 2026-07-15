export function Button({ children, variant = 'primary', size = 'md', onClick, type = 'button', class: className = '', disabled = false, loading = false }) {
  const baseClasses = 'font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-sm';
  
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-white',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-900',
    outline: 'bg-transparent border border-slate-300 text-slate-900 hover:bg-slate-50',
    link: 'bg-transparent border-none text-blue-800 font-medium hover:underline p-0 rounded-none',
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
