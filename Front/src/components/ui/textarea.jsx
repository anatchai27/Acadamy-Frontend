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
        <label for={id} class="text-sm text-slate-900 font-medium">
          {label}
        </label>
      )}
      <textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        class={`w-full px-4 py-3 bg-white border rounded-sm text-sm transition-all focus:outline-none focus:border-blue-800 text-slate-900 placeholder:text-slate-400 resize-none ${error ? 'border-red-500' : 'border-slate-300'} ${className}`}
        {...rest}
      />
      {error && <span class="text-xs text-red-500">{error}</span>}
    </div>
  );
}
