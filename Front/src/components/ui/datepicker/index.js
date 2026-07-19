import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { th } from 'date-fns/locale/th';

registerLocale('th', th);
setDefaultLocale('th');

export { default as DatePicker } from 'react-datepicker';
export { default as DatePickerInput } from './datepicker-input';