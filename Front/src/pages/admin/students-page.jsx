import { useState, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { studentService } from '../../services';
import { useAbortController } from '../../hooks';
import { HiOutlinePlus, HiOutlineEye, HiOutlinePencil, HiOutlineUserGroup, HiOutlineTag, HiOutlinePhone, HiOutlineUser, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

export const getStudentEmptyMessage = (loadError, search) => loadError
  ? { title: loadError, description: 'ตรวจการเชื่อมต่อ API แล้วลองใหม่' }
  : { title: 'ไม่พบข้อมูลนักเรียน', description: search ? 'ลองเปลี่ยนคำค้นหา' : 'ยังไม่มีนักเรียนในสถาบัน' };

export function StudentsPage({ path }) {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0, totalItems: 0, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const pageSize = 20;
  const debounceRef = useRef(null);
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const fetchStudents = async (page = 1, query = '') => {
    setLoading(true);
    setLoadError('');
    try {
      const params = { page, limit: pageSize };
      if (query.trim()) params.search = query.trim();
      const res = await studentService.getStudents(params, { signal: getSignal() });
      const payload = res.data?.data || res.data || {};
      setStudents(payload.students || []);
      setPagination(payload.pagination || { currentPage: 1, totalPages: 0, totalItems: 0, hasNext: false });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setLoadError('ไม่สามารถโหลดข้อมูลนักเรียนได้');
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob } = await studentService.downloadStudentCsv();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast('ส่งออก CSV สำเร็จ', 'success');
    } catch (error) {
      showToast(error.message || 'ส่งออก CSV ไม่สำเร็จ', 'error');
    } finally {
      setExporting(false);
    }
  };

  const noDataComponent = (
    <div class="py-10 text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
        <HiOutlineUserGroup class="h-8 w-8 text-zinc-300" />
      </div>
      <h3 class="mb-1 text-sm font-semibold text-zinc-700">{getStudentEmptyMessage(loadError, search).title}</h3>
      <p class="mb-4 text-xs text-zinc-400">{getStudentEmptyMessage(loadError, search).description}</p>
      {loadError ? (
        <Button variant="outline" size="md" onClick={() => fetchStudents(1, search)}>ลองโหลดใหม่</Button>
      ) : !search && (
        <Button variant="primary" size="md" onClick={() => route('/admin/students/add')}>
          + เพิ่มนักเรียนคนแรก
        </Button>
      )}
    </div>
  );

  const loadingComponent = (
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="กำลังโหลดรายชื่อนักเรียน">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-zinc-200 bg-white'} animate-pulse p-4`}>
          <div class="flex items-center gap-3">
            <div class="h-16 w-16 rounded-2xl bg-zinc-100" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-3/4 rounded bg-zinc-100" />
              <div class="h-3 w-1/2 rounded bg-zinc-100" />
            </div>
          </div>
          <div class="mt-5 h-10 rounded-xl bg-zinc-100" />
          <div class="mt-4 h-8 rounded-lg bg-zinc-100" />
        </div>
      ))}
    </div>
  );
  const firstVisibleItem = pagination.totalItems ? (pagination.currentPage - 1) * pageSize + 1 : 0;
  const lastVisibleItem = Math.min(pagination.currentPage * pageSize, pagination.totalItems || 0);

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
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" size="md" onClick={handleExport} loading={exporting} disabled={exporting}>ส่งออก CSV</Button>
          <Button variant="primary" size="md" onClick={() => route('/admin/students/add')}>
            <span class="flex items-center gap-1.5"><HiOutlinePlus class="h-4 w-4" />เพิ่มนักเรียน</span>
          </Button>
        </div>
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

      {loading ? loadingComponent : students.length === 0 ? noDataComponent : (
        <>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {students.map((student) => (
              <article
                key={student.id}
                class={`${isNeo
                  ? 'neo-card bg-white'
                  : 'rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:border-oasis-primary/30 hover:shadow-lg'} group flex min-h-[220px] flex-col p-4 transition-all duration-200`}
              >
                <div class="flex items-center gap-3">
                  <div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-oasis-primary/10">
                    <div class="flex h-full w-full items-center justify-center text-xl font-bold text-oasis-primary">
                      {student.nickname?.[0] || student.fullName?.[0] || '?'}
                    </div>
                    {student.photoUrl && (
                      <img
                        src={student.photoUrl}
                        alt={`รูปของ ${student.fullName || 'นักเรียน'}`}
                        loading="lazy"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                        class="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="line-clamp-2 text-base font-bold leading-snug text-zinc-900">{student.fullName || 'ไม่ระบุชื่อ'}</h3>
                    {student.nickname ? (
                      <p class="mt-1 flex items-center gap-1 text-xs text-zinc-500"><HiOutlineTag class="h-3.5 w-3.5 shrink-0" />ชื่อเล่น {student.nickname}</p>
                    ) : (
                      <p class="mt-1 text-xs text-zinc-400">ไม่มีชื่อเล่น</p>
                    )}
                  </div>
                  {student.grade && (
                    <span class="shrink-0 rounded-full bg-oasis-primary/10 px-2.5 py-1 text-xs font-semibold text-oasis-primary">{student.grade}</span>
                  )}
                </div>

                <div class="mt-4 flex-1 border-t border-zinc-100 pt-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">ผู้ปกครอง</p>
                  {student.primaryParentName ? (
                    <p class="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-medium text-zinc-700">
                      <HiOutlineUser class="h-4 w-4 shrink-0 text-zinc-400" />
                      <span class="truncate">{student.primaryParentName}</span>
                    </p>
                  ) : (
                    <p class="mt-1 text-sm text-zinc-400">ยังไม่มีข้อมูลผู้ปกครอง</p>
                  )}
                  {student.primaryParentPhone && (
                    <a
                      href={`tel:${student.primaryParentPhone}`}
                      onClick={(event) => event.stopPropagation()}
                      class="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-oasis-primary hover:underline"
                    >
                      <HiOutlinePhone class="h-4 w-4" />{student.primaryParentPhone}
                    </a>
                  )}
                </div>

                <div class="mt-3 border-t border-zinc-100 pt-3">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">คนที่มีสิทธิ์มารับ</p>
                    {student.authorizedPickups?.length > 0 && (
                      <span class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {student.authorizedPickups.length} คน
                      </span>
                    )}
                  </div>
                  {student.authorizedPickups?.length > 0 ? (
                    <div class="mt-1.5 space-y-1.5">
                      {student.authorizedPickups.slice(0, 2).map((person) => (
                        <div key={person.id} class="flex min-w-0 items-center gap-2 text-sm">
                          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                            {person.fullName?.[0] || '?'}
                          </span>
                          <span class="min-w-0 flex-1 truncate font-medium text-zinc-700">
                            {person.fullName}
                            {person.relationship && <span class="ml-1 text-xs font-normal text-zinc-400">({person.relationship})</span>}
                          </span>
                          {person.phone && (
                            <a href={`tel:${person.phone}`} class="shrink-0 text-xs font-medium text-oasis-primary hover:underline">
                              {person.phone}
                            </a>
                          )}
                        </div>
                      ))}
                      {student.authorizedPickups.length > 2 && (
                        <p class="pl-9 text-xs text-zinc-400">และอีก {student.authorizedPickups.length - 2} คน</p>
                      )}
                    </div>
                  ) : (
                    <p class="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">ยังไม่มีรายชื่อผู้รับที่ active</p>
                  )}
                </div>

                <div class="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() => route(`/admin/students/${student.id}`)}
                    class="inline-flex items-center gap-1 text-sm font-semibold text-oasis-primary hover:underline"
                  >
                    <HiOutlineEye class="h-4 w-4" />ดูโปรไฟล์
                  </button>
                  <button
                    type="button"
                    aria-label={`แก้ไขข้อมูล ${student.fullName || 'นักเรียน'}`}
                    title="แก้ไขข้อมูลนักเรียน"
                    onClick={(event) => {
                      event.stopPropagation();
                      route(`/admin/students/${student.id}/edit`);
                    }}
                    class="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-oasis-primary"
                  >
                    <HiOutlinePencil class="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div class={`mt-5 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between ${isNeo ? 'text-zinc-700' : 'text-zinc-500'}`}>
            <p class="text-sm">แสดง {firstVisibleItem}–{lastVisibleItem} จาก {pagination.totalItems} คน</p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                aria-label="หน้าก่อนหน้า"
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                class="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HiOutlineChevronLeft class="h-4 w-4" />ก่อนหน้า
              </button>
              <span class="min-w-16 text-center text-sm font-semibold text-zinc-700">{pagination.currentPage}/{pagination.totalPages || 1}</span>
              <button
                type="button"
                aria-label="หน้าถัดไป"
                disabled={!pagination.hasNext || loading}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                class="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ถัดไป<HiOutlineChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
