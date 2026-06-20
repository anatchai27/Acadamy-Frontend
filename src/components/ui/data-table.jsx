import { useState } from 'preact/hooks';

/**
 * DataTable
 * ตารางข้อมูลขอบคมกริบ รองรับ pagination, actions, empty state, responsive
 *
 * Props:
 *   columns: [{ key, label, class?, align?, render?(value,row) }]
 *   data: array of row objects
 *   keyField: unique key field name (default 'id')
 *   actions: [{ label, onClick(row), variant? }]  — ปุ่มท้ายแถว
 *   pageSize: number (default 10, 0 = no pagination)
 *   emptyMessage: string
 *   loading: boolean
 */
export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  actions = [],
  pageSize = 10,
  emptyMessage = 'ไม่พบข้อมูล',
  loading = false,
  class: className = '',
}) {
  const [page, setPage] = useState(1);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const pagedData =
    pageSize > 0 ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize) : data;

  const alignClass = (align) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div class={`w-full ${className}`}>
      <div class="overflow-x-auto rounded-sm border border-slate-300 dark:border-slate-700">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  class={`px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 ${alignClass(col.align)} ${col.class || ''}`}
                >
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th class="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                  จัดการ
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions.length ? 1 : 0)} class="px-4 py-10 text-center text-slate-400">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length ? 1 : 0)} class="px-4 py-10 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedData.map((row) => (
                <tr
                  key={row[keyField]}
                  class="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      class={`px-4 py-3 text-slate-700 dark:text-slate-300 ${alignClass(col.align)} ${col.class || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <div class="inline-flex gap-2">
                        {actions.map((action, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => action.onClick(row)}
                            class={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                              action.variant === 'primary'
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && data.length > pageSize && (
        <div class="flex items-center justify-between mt-4 text-sm">
          <span class="text-slate-500 dark:text-slate-400">
            แสดง {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, data.length)} จาก {data.length} รายการ
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              class="px-3 py-1.5 rounded-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              ก่อนหน้า
            </button>
            <span class="px-3 py-1.5 text-slate-600 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              class="px-3 py-1.5 rounded-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
