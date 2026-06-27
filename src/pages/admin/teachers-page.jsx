import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { DataTable, SolidInput, Button, StatusBadge, showToast } from '../../components/ui';
import { teacherService } from '../../services';

const formatCurrency = (n) =>
  n ? `฿${Number(n).toLocaleString()}` : '-';

const columns = [
  {
    key: 'fullName',
    label: 'ชื่อ-นามสกุล',
    render: (value) => <span class="font-medium text-slate-900 dark:text-white">{value || '-'}</span>,
  },
  {
    key: 'user',
    label: 'อีเมล',
    render: (value) => <span class="text-sm">{value?.email || '-'}</span>,
  },
  {
    key: 'specialization',
    label: 'ความเชี่ยวชาญ',
    render: (value) => value || '-',
  },
  {
    key: 'hourlyRate',
    label: 'ค่าสอน/ชม.',
    align: 'right',
    render: (value) => <span class="font-bold">{formatCurrency(value)}</span>,
  },
];

export function TeachersPage({ path }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  const fetchTeachers = async (query = '') => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      const res = await teacherService.getTeachers(params);
      setTeachers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลครูผู้สอนได้', 'error');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTeachers(value), 300);
  };

  return (
    <AdminLayout path={path}>
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">ครูผู้สอน</h2>
          <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">
            {teachers.length > 0 ? `ทั้งหมด ${teachers.length} คน` : 'จัดการข้อมูลครูผู้สอน'}
          </p>
        </div>
      </div>

      <div class="mb-6 max-w-sm ml-auto">
        <SolidInput
          type="text"
          placeholder="ค้นหาชื่อครู..."
          value={search}
          onInput={handleSearch}
        />
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        keyField="id"
        loading={loading}
        emptyMessage="ไม่พบข้อมูลครูผู้สอน"
        pageSize={0}
      />
    </AdminLayout>
  );
}
