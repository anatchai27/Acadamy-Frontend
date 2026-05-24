import { AdminLayout } from '../../layouts/admin-layout';

export function UsersPage({ path }) {
  const users = [
    { id: 1, name: 'สมชาย ใจดี', email: 'somchai@email.com', role: 'ผู้สอน', status: 'active' },
    { id: 2, name: 'สมหญิง รักเรียน', email: 'somying@email.com', role: 'ผู้เรียน', status: 'active' },
    { id: 3, name: 'วิชัย เก่งกาจ', email: 'wichai@email.com', role: 'ผู้สอน', status: 'inactive' },
    { id: 4, name: 'นภา สว่างจิต', email: 'napa@email.com', role: 'ผู้เรียน', status: 'active' },
  ];

  return (
    <AdminLayout path={path}>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">จัดการผู้ใช้</h1>
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          เพิ่มผู้ใช้
        </button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ชื่อ</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">อีเมล</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">บทบาท</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} class="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <td class="px-4 py-3">
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 md:hidden">{user.email}</p>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">{user.email}</td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">{user.role}</td>
                  <td class="px-4 py-3">
                    <span class={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {user.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
