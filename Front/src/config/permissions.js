export const PAGE_PERMISSIONS = {
  '/admin/dashboard': {
    label: 'หน้าหลัก',
    admin: { read: true, edit: true, delete: false },
    teacher: { read: true, edit: false, delete: false },
    staff: { read: true, edit: false, delete: false },
  },
  '/admin/students': {
    label: 'นักเรียน',
    admin: { read: true, edit: true, delete: true },
    teacher: { read: true, edit: false, delete: false },
    staff: { read: true, edit: true, delete: false },
  },
  '/admin/teachers': {
    label: 'ครูผู้สอน',
    admin: { read: true, edit: true, delete: true },
  },
  '/admin/courses': {
    label: 'คอร์สเรียน',
    admin: { read: true, edit: true, delete: true },
    teacher: { read: true, edit: true, delete: false },
  },
  '/admin/attendance': {
    label: 'เช็คชื่อ',
    admin: { read: true, edit: true, delete: false },
    teacher: { read: true, edit: true, delete: false },
  },
  '/admin/leads': {
    label: 'ผู้สนใจทดลองเรียน',
    admin: { read: true, edit: true, delete: true },
  },
  '/admin/makeup-slots': {
    label: 'เรียนชดเชย',
    admin: { read: true, edit: true, delete: true },
    teacher: { read: true, edit: true, delete: false },
  },
  '/admin/requests': {
    label: 'คำร้องขอ',
    admin: { read: true, edit: true, delete: false },
    teacher: { read: true, edit: true, delete: false },
  },
  '/admin/academics': {
    label: 'ระบบวิชาการ',
    admin: { read: true, edit: true, delete: true },
    teacher: { read: true, edit: true, delete: false },
  },
  '/admin/finance': {
    label: 'การเงิน',
    admin: { read: true, edit: true, delete: true },
    staff: { read: true, edit: true, delete: false },
  },
  '/admin/products': {
    label: 'สินค้า',
    admin: { read: true, edit: true, delete: true },
    staff: { read: true, edit: true, delete: false },
  },
  '/admin/users': {
    label: 'ผู้ใช้',
    admin: { read: true, edit: true, delete: true },
  },
  '/admin/settings': {
    label: 'ตั้งค่า',
    admin: { read: true, edit: true, delete: false },
  },
  '/admin/rooms': {
    label: 'ห้องเรียน',
    admin: { read: true, edit: true, delete: true },
  },
};

const ROLE_PERMISSIONS = {};

try {
  const storedPermissions = JSON.parse(localStorage.getItem('th_role_permissions') || '{}');
  Object.entries(storedPermissions).forEach(([role, pages]) => {
    ROLE_PERMISSIONS[String(role).trim().toLowerCase()] = pages;
  });
} catch {
  // Use the default policy when stored permissions are unavailable or invalid.
}

export const getPagePermission = (role, path) => {
  const page = PAGE_PERMISSIONS[path] ? path : Object.keys(PAGE_PERMISSIONS)
    .find((knownPath) => path?.startsWith(`${knownPath}/`));
  const normalizedRole = String(role || '').trim().toLowerCase();
  return ROLE_PERMISSIONS[normalizedRole]?.[page]
    || PAGE_PERMISSIONS[page]?.[normalizedRole]
    || {
    read: false,
    edit: false,
    delete: false,
  }
};

export const canReadPage = (role, path) => getPagePermission(role, path).read;

export const setRolePermissions = (role, permissions) => {
  const normalizedRole = String(role || '').trim().toLowerCase();
  ROLE_PERMISSIONS[normalizedRole] = permissions;
  try {
    localStorage.setItem('th_role_permissions', JSON.stringify({
      ...JSON.parse(localStorage.getItem('th_role_permissions') || '{}'),
      [normalizedRole]: permissions,
    }));
  } catch {
    // Keep the in-memory policy when storage is unavailable.
  }
};
