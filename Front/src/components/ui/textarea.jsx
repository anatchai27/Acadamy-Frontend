import { useDesignTheme } from '../../hooks/useDesignTheme';
export const Textarea = ({
  label,
  placeholder,
  id,
  rows = 4,
  class: className = '',
  error = '',
  neo,
  ...rest
}) => {
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = neo !== undefined ? neo : designTheme === 'neobrutalism';
  return <div class="flex flex-col gap-1.5">
      {label ? <label for={id} class="text-sm font-semibold text-oasis-navy">
          {label}
        </label> : null}
      <textarea id={id} placeholder={placeholder} rows={rows} aria-invalid={error ? 'true' : undefined} class={`w-full px-4 py-3 bg-white text-sm transition-all focus:outline-none text-oasis-navy placeholder:text-oasis-muted resize-y ${isNeo ? 'neo-input' : 'border rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'} ${error ? 'border-red-400' : 'border-oasis-border'} ${className}`} {...rest} />
      {error ? <span class="text-xs text-red-500">{error}</span> : null}
    </div>;
};