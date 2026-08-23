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
      {label ? <label for={id} class="text-sm text-zinc-800 font-medium">
          {label}
        </label> : null}
      <textarea id={id} placeholder={placeholder} rows={rows} class={`w-full px-4 py-3 bg-white text-sm transition-all focus:outline-none text-zinc-800 placeholder:text-zinc-400 resize-none ${isNeo ? 'neo-input' : 'border rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'} ${error ? 'border-red-400' : isNeo ? '' : 'border-zinc-200'} ${className}`} {...rest} />
      {error ? <span class="text-xs text-red-500">{error}</span> : null}
    </div>;
};