import { useState, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast, BentoGrid } from '../../components/ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { studentService } from '../../services';
import { useAbortController } from '../../hooks';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlineEye, HiOutlinePencil, HiOutlineAcademicCap, HiOutlineClipboardDocumentList, HiOutlineUsers, HiOutlineCog6Tooth, HiOutlineArrowRightOnRectangle, HiOutlineChevronDown, HiOutlineClipboardDocumentCheck, HiOutlineBanknotes, HiOutlineBookOpen, HiOutlineDocumentText, HiOutlineLightBulb, HiOutlineCube, HiOutlineHome, HiOutlineUserGroup, HiOutlineBell, HiOutlineQrCode, HiOutlineArrowLeft, HiOutlineTrash, HiOutlineXMark, HiOutlineCamera, HiOutlinePhoto, HiOutlineCalendarDays, HiOutlineClock, HiOutlineCheck, HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineChevronUp, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineEllipsisVertical, HiOutlineFunnel, HiOutlineAdjustmentsHorizontal, HiOutlineArrowUp, HiOutlineArrowDown, HiOutlineMinus, HiOutlineSparkles, HiOutlineTag, HiOutlinePhone, HiOutlineEnvelope, HiOutlineMapPin, HiOutlineGlobeAlt, HiOutlineLink, HiOutlinePaperClip, HiOutlinePaperAirplane, HiOutlineShieldCheck, HiOutlineExclamationTriangle, HiOutlineStar, HiOutlineHeart, HiOutlineHandThumbUp, HiOutlineHandThumbDown, HiOutlineChartBar, HiOutlineChartPie, HiOutlinePresentationChartBar, HiOutlineCalendar, HiOutlineArrowPath, HiOutlineArrowRight, HiOutlineBars3, HiOutlineRectangleGroup, HiOutlineSquares2X2, HiOutlineListBullet, HiOutlineUser } from 'react-icons/hi2';

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
            <HiOutlineUserGroup class="h-10 w-10 text-zinc-300" />
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
          <BentoGrid>
            {students.map((student) => (
              <div
                key={student.id}
                class={`group cursor-pointer ${
                  isNeo
                    ? 'neo-card bg-white p-0 overflow-hidden'
                    : 'bg-white rounded-xl border border-zinc-200/80 hover:border-oasis-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden'
                }`}
                onClick={() => route(`/admin/students/${student.id}`)}
              >
                {/* Card Top — Avatar + Identity */}
                <div class="p-5">
                  <div class="flex items-start gap-4">
<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-oasis-primary/5 text-oasis-primary text-xl font-semibold overflow-hidden">
                    {student.photoUrl ? (
                      <img src={student.photoUrl} alt={student.fullName} class="w-full h-full object-cover" />
                    ) : (
                      student.nickname?.[0] || student.fullName?.[0] || '?'
                    )}
                  </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-base font-semibold text-zinc-900 truncate group-hover:text-oasis-primary transition-colors">
                        {student.fullName || '-'}
                      </h3>
                      {student.nickname && (
                        <span class="inline-flex items-center gap-1 mt-1 text-xs text-zinc-500">
                          <HiOutlineTag class="h-3 w-3" />
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
                        <HiOutlineUser class="h-3.5 w-3.5 shrink-0" />
                        <span class="truncate">{student.primaryParentName}</span>
                      </div>
                    )}
                    {student.primaryParentPhone && (
                      <div class="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-400">
                        <HiOutlinePhone class="h-3.5 w-3.5 shrink-0" />
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
                      <HiOutlineEye class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); route(`/admin/students/${student.id}?edit=1`); }}
                      class="p-2 rounded-lg text-zinc-400 hover:text-oasis-primary hover:bg-oasis-primary/5 transition-colors"
                      title="แก้ไข"
                    >
                      <HiOutlinePencil class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </BentoGrid>

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
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors"
                >
                  <HiOutlineChevronLeft class="h-4 w-4" />
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
                          class={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
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
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors"
                >
                  ถัดไป
                  <HiOutlineChevronRight class="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
