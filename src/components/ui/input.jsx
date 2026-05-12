export function Input({ type = 'text', label, value, onInput, placeholder, id, class: className = '', error = '' }) {
  return (
    <div class="flex flex-col gap-1.5">
      {label && (
        <label for={id} class="text-sm text-mist-blue/70 font-medium">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onInput={onInput}
        placeholder={placeholder}
        class={`w-full px-4 py-3 bg-white/5 border rounded-lg text-sm transition-all focus:outline-none focus:border-sky-blue focus:bg-white/8 text-white placeholder:text-mist-blue/30 ${error ? 'border-red-400' : 'border-mist-blue/10'} ${className}`}
      />
      {error && <span class="text-xs text-red-400">{error}</span>}
    </div>
  );
}
