import { useState, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { studentService } from '../../services';
import { useAbortController } from '../../hooks';

export function StudentsPage({ path }) {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0, totalItems: 0, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);
  const getSignal = useAbortController();

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
            <PlusIcon class="h-4 w-4" />
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

      {/* Loading State */}
      {loading && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
          <p class="text-sm text-zinc-400">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && students.length === 0 && (
        <div class="text-center py-16">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
            <UserGroupIcon class="h-10 w-10 text-zinc-300" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-700 mb-1">ไม่พบข้อมูลนักเรียน</h3>
          <p class="text-sm text-zinc-400 mb-6">
            {search ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีนักเรียนในสถาบัน'}
          </p>
          {!search && (
            <Button variant="primary" size="md" onClick={() => route('/admin/students/add')}>
              + เพิ่มนักเรียนคนแรก
            </Button>
          )}
        </div>
      )}

      {/* Student Cards Grid */}
      {!loading && students.length > 0 && (
        <>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {students.map((student) => (
              <div
                key={student.id}
                class="group bg-white rounded-xl border border-zinc-200/80 hover:border-oasis-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                onClick={() => route(`/admin/students/${student.id}`)}
              >
                {/* Card Top — Avatar + Identity */}
                <div class="p-5">
                  <div class="flex items-start gap-4">
                    <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-oasis-primary/5 text-oasis-primary text-xl font-bold">
                      {student.nickname?.[0] || student.fullName?.[0] || '?'}
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-base font-semibold text-zinc-900 truncate group-hover:text-oasis-primary transition-colors">
                        {student.fullName || '-'}
                      </h3>
                      {student.nickname && (
                        <span class="inline-flex items-center gap-1 mt-1 text-xs text-zinc-500">
                          <TagIcon class="h-3 w-3" />
                          {student.nickname}
                        </span>
                      )}
                      {student.grade && (
                        <span class="mt-1.5 inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          {student.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div class="border-t border-zinc-100" />

                {/* Card Bottom — Parent Info + Actions */}
                <div class="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    {student.primaryParentName && (
                      <div class="flex items-center gap-1.5 text-xs text-zinc-500">
                        <UserIcon class="h-3.5 w-3.5 shrink-0" />
                        <span class="truncate">{student.primaryParentName}</span>
                      </div>
                    )}
                    {student.primaryParentPhone && (
                      <div class="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-400">
                        <PhoneIcon class="h-3.5 w-3.5 shrink-0" />
                        {student.primaryParentPhone}
                      </div>
                    )}
                    {!student.primaryParentName && !student.primaryParentPhone && (
                      <span class="text-xs text-zinc-400">ไม่มีข้อมูลผู้ปกครอง</span>
                    )}
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); route(`/admin/students/${student.id}`); }}
                      class="p-2 rounded-lg text-zinc-400 hover:text-oasis-primary hover:bg-oasis-primary/5 transition-colors"
                      title="ดูโปรไฟล์"
                    >
                      <EyeIcon class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); route(`/admin/students/${student.id}?edit=1`); }}
                      class="p-2 rounded-lg text-zinc-400 hover:text-oasis-primary hover:bg-oasis-primary/5 transition-colors"
                      title="แก้ไข"
                    >
                      <EditIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div class="flex items-center justify-between gap-4 text-sm pb-6">
              <span class="text-zinc-500">
                หน้า {pagination.currentPage} จาก {pagination.totalPages} ({pagination.totalItems} รายการ)
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors"
                >
                  <ChevronLeftIcon class="h-4 w-4" />
                  ก่อนหน้า
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (pagination.totalPages <= 7) return true;
                    if (p === 1 || p === pagination.totalPages) return true;
                    if (Math.abs(p - pagination.currentPage) <= 1) return true;
                    return false;
                  })
                  .map((p, i, arr) => {
                    const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                    return (
                      <span key={p} class="contents">
                        {showEllipsis && (
                          <span class="px-2 text-zinc-400">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePageChange(p)}
                          class={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                            p === pagination.currentPage
                              ? 'bg-oasis-primary text-white border-oasis-primary'
                              : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
                <button
                  type="button"
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors"
                >
                  ถัดไป
                  <ChevronRightIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

/* ─── SVG Icons ─── */

function PlusIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function UserIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PhoneIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function TagIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function EyeIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EditIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function ChevronLeftIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function UserGroupIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
