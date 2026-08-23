import { useState } from 'preact/hooks';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { useDesignTheme } from '../../hooks/useDesignTheme';
export const Input = ({
  type = 'text',
  label,
  placeholder,
  id,
  class: className = '',
  error = '',
  inputRef,
  neo,
  ...rest
}) => {
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = neo !== undefined ? neo : designTheme === 'neobrutalism';
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  return <div class="flex flex-col gap-1.5">
      {label ? <label for={id} class="text-sm text-zinc-800 font-medium">
          {label}
        </label> : null}
      <div class="relative">
        <input ref={inputRef} type={inputType} id={id} placeholder={placeholder} class={`w-full px-4 py-3 bg-white text-sm transition-all focus:outline-none text-zinc-800 placeholder:text-zinc-400 ${isNeo ? 'neo-input' : 'border rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'} ${error ? 'border-red-400' : isNeo ? '' : 'border-zinc-200'} ${isPassword ? 'pr-12' : ''} ${className}`} {...rest} />
        {isPassword ? <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-transparent border-none cursor-pointer p-0" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <HiOutlineEyeSlash class="w-5 h-5" /> : <HiOutlineEye class="w-5 h-5" />}
          </button> : null}
      </div>
      {error ? <span class="text-xs text-red-500">{error}</span> : null}
    </div>;
};