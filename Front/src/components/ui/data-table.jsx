import { useState, useEffect } from 'preact/hooks';

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

  useEffect(() => {
    setPage(1);
  }, [data.length]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const pagedData =
    pageSize > 0 ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize) : data;

  const alignClass = (align) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div class={`w-full ${className}`}>
      <div class="overflow-x-auto rounded-xl border border-zinc-200/80">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-zinc-50 border-b border-zinc-200/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  class={`px-4 py-3 font-semibold text-zinc-700 ${alignClass(col.align)} ${col.class || ''}`}
                >
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th class="px-4 py-3 text-right font-semibold text-zinc-700">
                  จัดการ
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions.length ? 1 : 0)} class="px-4 py-10 text-center text-zinc-400">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length ? 1 : 0)} class="px-4 py-10 text-center text-zinc-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedData.map((row) => (
                <tr
                  key={row[keyField]}
                  class="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      class={`px-4 py-3 text-zinc-700 ${alignClass(col.align)} ${col.class || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <div class="inline-flex gap-2">
                        {actions.map((action, i) => (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => action.onClick(row)}
                            class={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                              action.variant === 'primary'
                                ? 'bg-oasis-primary hover:bg-oasis-primary-dark text-white'
                                : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
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
          <span class="text-zinc-500">
            แสดง {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, data.length)} จาก {data.length} รายการ
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              class="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors"
            >
              ก่อนหน้า
            </button>
            <span class="px-3 py-1.5 text-zinc-600">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              class="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
