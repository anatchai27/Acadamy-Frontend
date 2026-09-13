const formatSize = bytes => `${Math.round(bytes / (1024 * 1024))}MB`;

export const validateHomeworkFile = file => {
  if (!file) return 'กรุณาเลือกไฟล์ก่อนส่งงาน';
  if (!file.type?.startsWith('image/')) return 'ไฟล์การบ้านต้องเป็นรูปภาพเท่านั้น';
  if (file.size > 10 * 1024 * 1024) return `ไฟล์มีขนาด ${formatSize(file.size)} และต้องไม่เกิน 10MB`;
  return '';
};

export const validateLeaveAttachment = file => {
  if (!file) return '';
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) return 'หลักฐานการลาต้องเป็น PDF, JPG, PNG หรือ WEBP';
  if (file.size > 5 * 1024 * 1024) return `ไฟล์มีขนาด ${formatSize(file.size)} และต้องไม่เกิน 5MB`;
  return '';
};

export const apiErrorMessage = (error, fallback) => {
  if (error?.status === 403) return 'ไม่มีสิทธิ์เข้าถึงข้อมูลของน้องคนนี้';
  if (error?.status === 409) return error.message || 'รายการนี้เปลี่ยนแปลงแล้ว กรุณารีเฟรชข้อมูล';
  return error?.message || fallback;
};
