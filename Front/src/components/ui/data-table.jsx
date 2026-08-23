import { useState, useEffect } from 'preact/hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  actions = [],
  pageSize = 10,
  emptyMessage = 'ไม่พบข้อมูล',
  loading = false,
  class: className = '',
  neo
}) => {
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = neo !== undefined ? neo : designTheme === 'neobrutalism';
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [data.length]);
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const pagedData = pageSize > 0 ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize) : data;
  const alignClass = align => align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return <div class={`w-full ${className}`}>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class={`${isNeo ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-700'} border-b ${isNeo ? 'border-black' : 'border-zinc-200/80'}`}>
              {columns.map(col => <th key={col.key} class={`px-4 py-3 font-semibold ${alignClass(col.align)} ${col.class || ''}`}>
                  {col.label}
                </th>)}
              {actions.length > 0 ? <th class={`px-4 py-3 text-right font-semibold`}>
                  จัดการ
                </th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr>
                <td colSpan={columns.length + (actions.length ? 1 : 0)} class="px-4 py-10 text-center text-zinc-400">
                  กำลังโหลดข้อมูล...
                </td>
              </tr> : pagedData.length === 0 ? <tr>
                <td colSpan={columns.length + (actions.length ? 1 : 0)} class="px-4 py-10 text-center text-zinc-400">
                  {emptyMessage}
                </td>
              </tr> : pagedData.map(row => <tr key={row[keyField]} class={`border-b ${isNeo ? 'border-black' : 'border-zinc-100'} hover:bg-zinc-50 transition-colors`}>
                  {columns.map(col => <td key={col.key} class={`px-4 py-3 text-zinc-700 ${alignClass(col.align)} ${col.class || ''}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>)}
                  {actions.length > 0 ? <td class="px-4 py-3 text-right whitespace-nowrap">
                      <div class="inline-flex gap-2">
                        {actions.map((action, i) => <button key={action.label} type="button" onClick={() => action.onClick(row)} class={`px-3 py-1.5 text-xs font-medium transition-colors ${action.variant === 'primary' ? isNeo ? 'neo-btn bg-oasis-primary text-white' : 'bg-oasis-primary hover:bg-oasis-primary-dark text-white rounded-xl' : isNeo ? 'neo-btn bg-white text-zinc-700' : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl'}`}>
                            {action.label}
                          </button>)}
                      </div>
                    </td> : null}
                </tr>)}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && data.length > pageSize ? <div class={`flex items-center justify-between mt-4 text-sm ${isNeo ? 'text-black' : 'text-zinc-500'}`}>
          <span class="">
            แสดง {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, data.length)} จาก {data.length} รายการ
          </span>
          <div class="flex items-center gap-1">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} class={`px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isNeo ? 'neo-btn bg-white text-black' : 'rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>
              ก่อนหน้า
            </button>
            <span class="px-3 py-1.5 text-zinc-600">
              {currentPage} / {totalPages}
            </span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} class={`px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isNeo ? 'neo-btn bg-white text-black' : 'rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>
              ถัดไป
            </button>
          </div>
        </div> : null}
    </div>;
};