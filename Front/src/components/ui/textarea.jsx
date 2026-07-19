/**
 * Textarea
 * Consistent กับ Input.jsx — ใช้ styling เดียวกัน
 *
 * Props:
 *   label       — label ด้านบน
 *   id          — html id (ผูกกับ label)
 *   placeholder — placeholder text
 *   rows        — จำนวนแถว (default: 4)
 *   error       — error message
 *   ...rest     — react-hook-form register props (onChange, onBlur, ref, name)
 */
export function Textarea({ label, placeholder, id, rows = 4, class: className = '', error = '', ...rest }) {
  return (
    <div class="flex flex-col gap-1.5">
      {label && (
        <label for={id} class="text-sm text-zinc-800 font-medium">
          {label}
        </label>
      )}
      <textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        class={`w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all focus:outline-none focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10 text-zinc-800 placeholder:text-zinc-400 resize-none ${error ? 'border-red-400' : 'border-zinc-200'} ${className}`}
        {...rest}
      />
      {error && <span class="text-xs text-red-500">{error}</span>}
    </div>
  );
}
