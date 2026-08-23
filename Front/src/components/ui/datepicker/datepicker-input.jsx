import { useState, useRef, forwardRef } from 'preact/compat';
import { HiOutlineCalendarDays } from 'react-icons/hi2';
import DatePicker from 'react-datepicker';
import { th } from 'date-fns/locale/th';
import { useDesignTheme } from '../../../hooks/useDesignTheme';
const formatDisplay = date => {
  return !date ? '' : date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
const formatDateTimeDisplay = date => {
  return !date ? '' : date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const CustomInput = forwardRef(({
  value,
  onClick,
  placeholder,
  className,
  label,
  error,
  showTime,
  isNeo
}, ref) => <div class="flex flex-col gap-1.5">
    {label ? <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-slate-700'}`}>{label}</label> : null}
    <div class="relative">
      <input ref={ref} type="text" value={value} onClick={onClick} readOnly placeholder={placeholder || (showTime ? 'เลือกวันที่และเวลา' : 'เลือกวันที่')} class={`w-full px-4 py-2.5 bg-white text-sm cursor-pointer transition-all focus:outline-none text-slate-800 placeholder-slate-400 ${isNeo ? 'neo-input' : 'border rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'} ${error ? 'border-red-400' : isNeo ? '' : 'border-slate-200'} ${className}`} />
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <HiOutlineCalendarDays class="h-4 w-4" />
      </div>
    </div>
    {error ? <span class="text-xs text-red-500">{error}</span> : null}
  </div>);
export const DatePickerInput = ({
  label,
  value,
  onChange,
  placeholder,
  showTime = false,
  minDate,
  maxDate,
  error,
  disabled = false,
  class: className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  const handleChange = date => {
    onChange(date);
    return !showTime ? (() => {
      setIsOpen(false);
    })() : undefined;
  };
  const displayValue = value ? showTime ? formatDateTimeDisplay(value) : formatDisplay(value) : '';
  return <DatePicker selected={value} onChange={handleChange} locale={th} dateFormat={showTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'} showTimeSelect={showTime} timeFormat="HH:mm" timeIntervals={15} timeCaption="เวลา" minDate={minDate} maxDate={maxDate} disabled={disabled} open={isOpen} onInputClick={() => !disabled && setIsOpen(!isOpen)} onClickOutside={() => setIsOpen(false)} shouldCloseOnSelect={false} customInput={<CustomInput value={displayValue} onClick={() => !disabled && setIsOpen(!isOpen)} placeholder={placeholder} className={className} label={label} error={error} showTime={showTime} isNeo={isNeo} />} popperClassName="datepicker-popper" calendarClassName="datepicker-calendar" wrapperClassName="w-full" popperPlacement="bottom-start" popperModifiers={[{
    name: 'offset',
    options: {
      offset: [0, 6]
    }
  }]} />;
};