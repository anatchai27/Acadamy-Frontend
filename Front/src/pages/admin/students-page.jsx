import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import DataTable from 'react-data-table-component';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { studentService } from '../../services';
import { useAbortController } from '../../hooks';
import { HiOutlinePlus, HiOutlineEye, HiOutlinePencil, HiOutlineUserGroup, HiOutlineTag, HiOutlinePhone, HiOutlineUser } from 'react-icons/hi2';

export function StudentsPage({ path }) {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0, totalItems: 0, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const fetchStudents = async (page = 1, query = '') => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (query.trim()) params.search = query.trim();
      const res = await studentService.getStudents(params, { signal: getSignal() });
      const payload = res.data?.data || res.data || {};
      setStudents(payload.students || []);
      setPagination(payload.pagination || { currentPage: 1, totalPages: 0, totalItems: 0, hasNext: false });
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

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchStudents(1, value), 300);
  };

  const handlePageChange = (page) => {
    fetchStudents(page, search);
  };

  const columns = useMemo(() => ([
    {
      name: 'นักเรียน',
      grow: 2,
      cell: (student) => (
        <div class="flex items-center gap-3 py-2 min-w-0">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-oasis-primary/5 text-sm font-semibold text-oasis-primary">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.fullName || 'student'} class="h-full w-full object-cover" />
            ) : (
              student.nickname?.[0] || student.fullName?.[0] || '?'
            )}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-zinc-900">{student.fullName || '-'}</p>
            {student.nickname && (
              <span class="inline-flex items-center gap-1 text-xs text-zinc-500">
                <HiOutlineTag class="h-3 w-3" />
                {student.nickname}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      name: 'ชั้นเรียน',
      width: '130px',
      cell: (student) => (
        student.grade ? (
          <span class="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
            {student.grade}
          </span>
        ) : (
          <span class="text-xs text-zinc-400">-</span>
        )
      ),
    },
    {
      name: 'ผู้ปกครอง',
      grow: 2,
      cell: (student) => (
        <div class="min-w-0 py-2">
          {student.primaryParentName ? (
            <div class="flex items-center gap-1.5 text-xs text-zinc-500">
              <HiOutlineUser class="h-3.5 w-3.5 shrink-0" />
              <span class="truncate">{student.primaryParentName}</span>
            </div>
          ) : (
            <span class="text-xs text-zinc-400">ไม่มีข้อมูลผู้ปกครอง</span>
          )}
          {student.primaryParentPhone && (
            <div class="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
              <HiOutlinePhone class="h-3.5 w-3.5 shrink-0" />
              {student.primaryParentPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      name: 'จัดการ',
      right: true,
      width: '130px',
      cell: (student) => (
        <div class="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              route(`/admin/students/${student.id}`);
            }}
            class="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-oasis-primary/5 hover:text-oasis-primary"
            title="ดูโปรไฟล์"
          >
            <HiOutlineEye class="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              route(`/admin/students/${student.id}/edit`);
            }}
            class="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-oasis-primary/5 hover:text-oasis-primary"
            title="แก้ไข"
          >
            <HiOutlinePencil class="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]), []);

  const customStyles = useMemo(() => ({
    table: {
      style: {
        backgroundColor: 'transparent',
      },
    },
    headRow: {
      style: {
        minHeight: '48px',
        backgroundColor: isNeo ? '#111827' : '#f8fafc',
        borderBottom: isNeo ? '2px solid #000' : '1px solid #e4e4e7',
      },
    },
    headCells: {
      style: {
        color: isNeo ? '#ffffff' : '#52525b',
        fontSize: '12px',
        fontWeight: 700,
      },
    },
    rows: {
      style: {
        minHeight: '64px',
        backgroundColor: '#ffffff',
        borderBottom: isNeo ? '1px solid #000' : '1px solid #f4f4f5',
      },
      highlightOnHoverStyle: {
        backgroundColor: '#eff6ff',
        cursor: 'pointer',
      },
    },
    pagination: {
      style: {
        borderTop: isNeo ? '2px solid #000' : '1px solid #e4e4e7',
        backgroundColor: '#ffffff',
        minHeight: '60px',
      },
      pageButtonsStyle: {
        borderRadius: '10px',
      },
    },
  }), [isNeo]);

  const noDataComponent = (
    <div class="py-10 text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
        <HiOutlineUserGroup class="h-8 w-8 text-zinc-300" />
      </div>
      <h3 class="mb-1 text-sm font-semibold text-zinc-700">ไม่พบข้อมูลนักเรียน</h3>
      <p class="mb-4 text-xs text-zinc-400">{search ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีนักเรียนในสถาบัน'}</p>
      {!search && (
        <Button variant="primary" size="md" onClick={() => route('/admin/students/add')}>
          + เพิ่มนักเรียนคนแรก
        </Button>
      )}
    </div>
  );

  const loadingComponent = (
    <div class="py-12 text-center">
      <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-oasis-primary border-t-transparent" />
      <p class="text-sm text-zinc-400">กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <AdminLayout path={path}>
      {/* Header */}
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">จัดการนักเรียน</h2>
          <p class="text-sm text-zinc-500 mt-1">
            {pagination.totalItems > 0
              ? `ทั้งหมด ${pagination.totalItems} คน · หน้า ${pagination.currentPage}/${pagination.totalPages || 1}`
              : 'ดูและจัดการข้อมูลนักเรียนทั้งหมด'}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => route('/admin/students/add')}>
          <span class="flex items-center gap-1.5">
            <HiOutlinePlus class="h-4 w-4" />
            เพิ่มนักเรียน
          </span>
        </Button>
      </div>

      {/* Search */}
      <div class="mb-6">
        <SolidInput
          type="text"
          placeholder="ค้นหาชื่อ / ชื่อเล่น / เบอร์ผู้ปกครอง"
          value={search}
          onInput={handleSearch}
        />
      </div>

      <div class={`${isNeo ? 'neo-card bg-white p-0 overflow-hidden' : 'bg-white rounded-2xl border border-zinc-200/80 overflow-hidden'}`}>
        <DataTable
          columns={columns}
          data={students}
          keyField="id"
          customStyles={customStyles}
          progressPending={loading}
          progressComponent={loadingComponent}
          noDataComponent={noDataComponent}
          pointerOnHover
          onRowClicked={(student) => route(`/admin/students/${student.id}`)}
          pagination
          paginationServer
          paginationTotalRows={pagination.totalItems || 0}
          paginationPerPage={20}
          paginationDefaultPage={pagination.currentPage || 1}
          onChangePage={handlePageChange}
          paginationRowsPerPageOptions={[20]}
          paginationComponentOptions={{
            rowsPerPageText: 'จำนวนต่อหน้า',
            rangeSeparatorText: 'จาก',
            noRowsPerPage: false,
            selectAllRowsItem: false,
          }}
        />
      </div>
    </AdminLayout>
  );
}
