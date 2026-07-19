import { useState, useRef, forwardRef } from 'preact/compat';
import DatePicker from 'react-datepicker';
import { th } from 'date-fns/locale/th';

const formatDisplay = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const formatDateTimeDisplay = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const CustomInput = forwardRef(({ value, onClick, placeholder, className, label, error, showTime }, ref) => (
  <div class="flex flex-col gap-1.5">
    {label && (
      <label class="text-sm font-medium text-slate-700">{label}</label>
    )}
    <div class="relative">
      <input
        ref={ref}
        type="text"
        value={value}
        onClick={onClick}
        readOnly
        placeholder={placeholder || (showTime ? 'เลือกวันที่และเวลา' : 'เลือกวันที่')}
        class={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-800 placeholder-slate-400 ${error ? 'border-red-400' : 'border-slate-200'} ${className}`}
      />
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
    {error && <span class="text-xs text-red-500">{error}</span>}
  </div>
));

export function DatePickerInput({
  label,
  value,
  onChange,
  placeholder,
  showTime = false,
  minDate,
  maxDate,
  error,
  disabled = false,
  class: className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const handleChange = (date) => {
    onChange(date);
    if (!showTime) setIsOpen(false);
  };

  const displayValue = value
    ? (showTime ? formatDateTimeDisplay(value) : formatDisplay(value))
    : '';

  return (
    <DatePicker
      selected={value}
      onChange={handleChange}
      locale={th}
      dateFormat={showTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'}
      showTimeSelect={showTime}
      timeFormat="HH:mm"
      timeIntervals={15}
      timeCaption="เวลา"
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      open={isOpen}
      onInputClick={() => !disabled && setIsOpen(!isOpen)}
      onClickOutside={() => setIsOpen(false)}
      shouldCloseOnSelect={false}
      customInput={
        <CustomInput
          value={displayValue}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder={placeholder}
          className={className}
          label={label}
          error={error}
          showTime={showTime}
        />
      }
      popperClassName="datepicker-popper"
      calendarClassName="datepicker-calendar"
      wrapperClassName="w-full"
      popperPlacement="bottom-start"
      popperModifiers={[
        { name: 'offset', options: { offset: [0, 6] } },
      ]}
    />
  );
}