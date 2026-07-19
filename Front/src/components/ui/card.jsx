export function Card({ children, class: className = '', hover = true }) {
  return (
    <div class={`bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm ${hover ? 'transition-all hover:shadow-md hover:border-zinc-300' : ''} ${className}`}>
      {children}
    </div>
  );
}
