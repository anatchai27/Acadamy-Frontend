const PARENT_LINK_CODE_PATTERN = /^[23456789A-HJ-NP-Z]{12}$/;

export const normalizeParentLinkCode = code =>
  String(code || '').replace(/[^a-z0-9]/gi, '').toUpperCase();

export const validateParentLinkCode = code => {
  if (code.length !== 12) {
    return 'กรุณากรอกรหัสเชื่อม 12 ตัวอักษรที่ได้รับจากโรงเรียน';
  }

  if (!PARENT_LINK_CODE_PATTERN.test(code)) {
    return 'รหัสไม่ถูกต้อง ตรวจสอบตัวอักษรอีกครั้ง (รหัสไม่ใช้ I, O, 0 หรือ 1)';
  }

  return '';
};
