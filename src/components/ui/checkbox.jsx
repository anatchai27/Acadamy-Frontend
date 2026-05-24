export function Checkbox({ id, checked, onChange, onBlur, label, required = false, error = '', name, inputRef }) {
  return (
    <div class="flex flex-col gap-1">
      <label for={id} class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          ref={inputRef}
          class="w-4 h-4 rounded-sm border-slate-300 text-blue-800 focus:ring-blue-800 focus:ring-2"
        />
        {label && <span class="text-sm text-slate-600">{label}</span>}
      </label>
      {error && <span class="text-xs text-red-500">{error}</span>}
    </div>
  );
}
