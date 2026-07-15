export function Card({ children, class: className = '', hover = true }) {
  return (
    <div class={`bg-white/5 backdrop-blur-md border border-mist-blue/10 rounded-2xl p-8 ${hover ? 'transition-all hover:-translate-y-1 hover:border-sky-blue/30' : ''} ${className}`}>
      {children}
    </div>
  );
}
