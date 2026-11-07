import { useDesignTheme } from '../../hooks/useDesignTheme';
export const Checkbox = ({
  id,
  checked,
  onChange,
  onBlur,
  label,
  required = false,
  error = '',
  name,
  inputRef,
  neo
}) => {
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = neo !== undefined ? neo : designTheme === 'neobrutalism';
  return <div class="flex flex-col gap-1">
      <label for={id} class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" id={id} name={name} checked={checked} onChange={onChange} onBlur={onBlur} required={required} ref={inputRef} class={`h-4 w-4 ${isNeo ? 'border-2 border-black' : 'rounded border-oasis-border text-oasis-primary focus:ring-2 focus:ring-oasis-primary/30'}`} />
        {label ? <span class={`text-sm ${isNeo ? 'text-black' : 'text-oasis-body'}`}>{label}</span> : null}
      </label>
      {error ? <span class="text-xs text-red-500">{error}</span> : null}
    </div>;
};