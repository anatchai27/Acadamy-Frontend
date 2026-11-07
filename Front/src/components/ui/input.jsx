import { useState } from 'preact/hooks';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { useTranslation } from '../../hooks';
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
  const { t } = useTranslation();
  const isNeo = neo !== undefined ? neo : designTheme === 'neobrutalism';
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  return <div class="flex flex-col gap-1.5">
      {label ? <label for={id} class="text-sm font-semibold text-oasis-navy">
          {label}
        </label> : null}
      <div class="relative">
        <input ref={inputRef} type={inputType} id={id} placeholder={placeholder} aria-invalid={error ? 'true' : undefined} class={`w-full px-4 py-3 bg-white text-sm transition-all focus:outline-none text-oasis-navy placeholder:text-oasis-muted ${isNeo ? 'neo-input' : 'border rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'} ${error ? 'border-red-400' : 'border-oasis-border'} ${isPassword ? 'pr-12' : ''} ${className}`} {...rest} />
        {isPassword ? <button type="button" aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')} class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-oasis-muted hover:bg-oasis-surface-hover hover:text-oasis-navy focus-visible:outline-2 focus-visible:outline-cyan-600" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <HiOutlineEyeSlash class="w-5 h-5" /> : <HiOutlineEye class="w-5 h-5" />}
          </button> : null}
      </div>
      {error ? <span class="text-xs text-red-500">{error}</span> : null}
    </div>;
};