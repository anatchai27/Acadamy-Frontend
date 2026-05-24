import { useState } from 'preact/hooks';

export function Input({ type = 'text', label, placeholder, id, class: className = '', error = '', inputRef, ...rest }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div class="flex flex-col gap-1.5">
      {label && (
        <label for={id} class="text-sm text-slate-900 font-medium">
          {label}
        </label>
      )}
      <div class="relative">
        <input
          ref={inputRef}
          type={inputType}
          id={id}
          placeholder={placeholder}
          class={`w-full px-4 py-3 bg-white border rounded-sm text-sm transition-all focus:outline-none focus:border-blue-800 text-slate-900 placeholder:text-slate-400 ${error ? 'border-red-500' : 'border-slate-300'} ${isPassword ? 'pr-12' : ''} ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        )}
      </div>
      {error && <span class="text-xs text-red-500">{error}</span>}
    </div>
  );
}
