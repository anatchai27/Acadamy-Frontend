import { useState, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { DataTable, SolidInput, Button, StatusBadge, showToast } from '../../components/ui';
import { studentService } from '../../services';

const columns = [
  {
    key: 'fullName',
    label: 'ชื่อ-นามสกุล',
    render: (value, row) => value || row.fullName || '-',
  },
  { key: 'email', label: 'อีเมล' },
  { key: 'phone', label: 'เบอร์โทร' },
  {
    key: 'status',
    label: 'สถานะ',
    align: 'center',
    render: (value) => <StatusBadge status={value} />,
  },
];

const actions = [
  {
    label: 'ดูโปรไฟล์',
    onClick: (row) => route(`/admin/students/${row.id}`),
  },
  {
    label: 'แก้ไข',
    variant: 'primary',
    onClick: (row) => route(`/admin/students/${row.id}?edit=1`),
  },
];

export function StudentsPage({ path }) {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  const fetchStudents = async (page = 1, query = '') => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (query.trim()) params.search = query.trim();
      const res = await studentService.getStudents(params);
      const body = res.data;
      if (body.data) {
        setStudents(body.data.students || []);
        setPagination(body.data.pagination || {});
      } else {
        setStudents([]);
      }
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลนักเรียนได้', 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchStudents(1, value), 300);
  };

  const handlePageChange = (page) => {
    fetchStudents(page, search);
  };

  return (
    <AdminLayout path={path}>
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">จัดการนักเรียน</h2>
          <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">
            {pagination.totalItems > 0 ? `ทั้งหมด ${pagination.totalItems} คน` : 'ดูและจัดการข้อมูลนักเรียนทั้งหมด'}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => route('/admin/students/add')}>
          + เพิ่มนักเรียน
        </Button>
      </div>

      <div class="mb-6 max-w-sm ml-auto">
        <SolidInput
          type="text"
          placeholder="ค้นหาชื่อนักเรียน..."
          value={search}
          onInput={handleSearch}
        />
      </div>

      <DataTable
        columns={columns}
        data={students}
        keyField="id"
        actions={actions}
        loading={loading}
        emptyMessage="ไม่พบข้อมูลนักเรียน"
        pageSize={0}
      />

      {pagination.totalPages > 1 && (
        <div class="flex items-center justify-between mt-4 text-sm">
          <span class="text-slate-500 dark:text-slate-400">
            หน้า {pagination.currentPage} จาก {pagination.totalPages} (ทั้งหมด {pagination.totalItems} รายการ)
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              class="px-3 py-1.5 rounded-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              ก่อนหน้า
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePageChange(p)}
                class={`px-3 py-1.5 rounded-sm border text-sm font-medium transition-colors ${
                  p === pagination.currentPage
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              class="px-3 py-1.5 rounded-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
