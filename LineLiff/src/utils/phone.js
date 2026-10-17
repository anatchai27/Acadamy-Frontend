export const formatPhoneNumber = (value) => {
  if (value === null || value === undefined || value === '') return value || '';

  const digits = String(value).replace(/\D/g, '');
  return digits.length === 10
    ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    : String(value);
};
