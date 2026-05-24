import { AdminLayout } from '../../layouts/admin-layout';

export function SettingsPage({ path }) {
  const settingsSections = [
    {
      title: 'ข้อมูลทั่วไป',
      items: [
        { label: 'ชื่อสถาบัน', value: 'TiwHub Academy', type: 'text' },
        { label: 'อีเมลติดต่อ', value: 'admin@tiwhub.com', type: 'email' },
        { label: 'เบอร์โทรศัพท์', value: '02-123-4567', type: 'tel' },
      ],
    },
    {
      title: 'การแจ้งเตือน',
      items: [
        { label: 'แจ้งเตือนทางอีเมล', value: true, type: 'toggle' },
        { label: 'แจ้งเตือนทาง LINE', value: false, type: 'toggle' },
        { label: 'แจ้งเตือนทาง SMS', value: false, type: 'toggle' },
      ],
    },
  ];

  return (
    <AdminLayout path={path}>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">ตั้งค่าระบบ</h1>

      <div class="space-y-6">
        {settingsSections.map((section) => (
          <div key={section.title} class="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{section.title}</h2>
            <div class="space-y-4">
              {section.items.map((item) => (
                <div key={item.label} class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label class="text-sm text-gray-700 dark:text-gray-300">{item.label}</label>
                  {item.type === 'toggle' ? (
                    <button
                      class={`relative w-12 h-6 rounded-full transition-colors ${
                        item.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        class={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          item.value ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  ) : (
                    <input
                      type={item.type}
                      value={item.value}
                      class="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
          บันทึกการตั้งค่า
        </button>
      </div>
    </AdminLayout>
  );
}
