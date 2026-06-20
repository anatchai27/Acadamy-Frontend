import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, StatusBadge, showToast } from '../../components/ui';
import { studentService } from '../../services';

const mockStudent = {
  id: 1, firstname: 'สมชาย', lastname: 'ใจดี', nickname: 'ชาย',
  birthdate: '2015-03-15', school: 'โรงเรียนอนุบาลแห่งหนึ่ง', level: 'ป.4',
  email: 'parent@example.com', phone: '081-234-5678',
  lineId: '@parentline', emergencyPhone: '089-876-5432',
  status: 'active',
  parents: [
    { fullName: 'คุณแม่สมศรี', phone: '081-111-2222', email: 'mom@example.com', relation: 'mother' },
  ],
};

export function StudentProfilePage({ path, id }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    studentService.getStudentById(id)
      .then((res) => setStudent(res.data))
      .catch((err) => {
        if (err?.status === 404) {
          setError('ไม่พบข้อมูลนักเรียน');
        } else {
          setStudent(mockStudent);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleBack = () => route('/admin/students');

  if (loading) {
    return (
      <AdminLayout path={path}>
        <div class="flex items-center justify-center py-20">
          <span class="text-slate-400">กำลังโหลดข้อมูล...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout path={path}>
        <div class="text-center py-20">
          <p class="text-slate-500 mb-4">{error}</p>
          <Button variant="outline" size="md" onClick={handleBack}>กลับไปหน้านักเรียน</Button>
        </div>
      </AdminLayout>
    );
  }

  if (!student) return null;

  return (
    <AdminLayout path={path}>
      <div class="mb-8">
        <button
          type="button"
          onClick={handleBack}
          class="text-sm text-tiwhub-muted hover:text-tiwhub-heading dark:hover:text-white transition-colors flex items-center gap-1 mb-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          กลับไปหน้านักเรียน
        </button>
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">
            {student.firstname} {student.lastname}
          </h2>
          <StatusBadge status={student.status} />
        </div>
        <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">ข้อมูลโปรไฟล์นักเรียน</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Student Info */}
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-6">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">ข้อมูลส่วนตัว</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-slate-500 dark:text-slate-400">ชื่อเล่น</span>
                <p class="text-slate-900 dark:text-white font-medium">{student.nickname || '-'}</p>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">วันเกิด</span>
                <p class="text-slate-900 dark:text-white font-medium">{student.birthdate || '-'}</p>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">โรงเรียน</span>
                <p class="text-slate-900 dark:text-white font-medium">{student.school || '-'}</p>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">ระดับชั้น</span>
                <p class="text-slate-900 dark:text-white font-medium">{student.level || '-'}</p>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">อีเมล</span>
                <p class="text-slate-900 dark:text-white font-medium">{student.email || '-'}</p>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">เบอร์โทร</span>
                <p class="text-slate-900 dark:text-white font-medium">{student.phone || '-'}</p>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">Line ID</span>
                <p class="text-slate-900 dark:text-white font-medium">{student.lineId || '-'}</p>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">เบอร์ฉุกเฉิน</span>
                <p class="text-slate-900 dark:text-white font-medium">{student.emergencyPhone || '-'}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-6">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">ผู้ปกครอง</h3>
            {student.parents && student.parents.length > 0 ? (
              <div class="space-y-3">
                {student.parents.map((p, i) => (
                  <div key={i} class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-sm">
                    <div>
                      <p class="text-sm font-medium text-slate-900 dark:text-white">{p.fullName}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">
                        {p.relation === 'mother' ? 'มารดา' : p.relation === 'father' ? 'บิดา' : 'ผู้ปกครอง'}
                        {' '}&middot;{' '}{p.phone}
                      </p>
                    </div>
                    <span class="text-xs text-slate-400">{p.email}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p class="text-sm text-slate-400">ไม่มีข้อมูลผู้ปกครอง</p>
            )}
          </div>
        </div>

        {/* Right: QR Code */}
        <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-6 text-center">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">บัตร QR Code</h3>
          <div class="w-48 h-48 mx-auto bg-slate-100 dark:bg-slate-700 rounded-sm flex items-center justify-center mb-4">
            <div class="text-center">
              <svg class="h-16 w-16 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2m4 0h-2m4 0v-2m0 0h-2m2 0V9m0 4V5m0 2h-2M4 7h1m4 0h1m4 0h1M4 11h1m4 0h1m4 0h1M4 15h1m4 0h1m4 0h1M4 19h1m4 0h1m4 0h1" />
              </svg>
              <p class="text-xs text-slate-400 mt-2">QR Code</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => showToast('ระบบกำลังพัฒนา', 'info')}>
            ดาวน์โหลด/พิมพ์บัตร
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
