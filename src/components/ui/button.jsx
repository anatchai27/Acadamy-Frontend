export function Button({ children, variant = 'primary', size = 'md', onClick, type = 'button', class: className = '', disabled = false }) {
  const baseClasses = 'font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-sky-blue hover:bg-sky-blue/80 text-white',
    secondary: 'bg-white/5 backdrop-blur-md border border-mist-blue/20 text-mist-blue hover:border-mist-blue/40 hover:bg-white/10',
    ghost: 'bg-transparent text-mist-blue/70 hover:text-mist-blue hover:bg-white/5',
  };
  
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-8 py-4',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button type={type} class={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
