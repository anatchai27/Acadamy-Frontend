import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, Checkbox, Textarea, showToast } from '../../components/ui';
import { studentService } from '../../services';

export function StudentAddPage({ path }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parents, setParents] = useState([
    { fullName: '', phone: '', relationship: 'แม่' },
  ]);
  const [consent, setConsent] = useState(false);

  const [form, setForm] = useState({
    fullName: '', nickname: '', grade: '', school: '', photoUrl: '', medicalInfo: '',
  });

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateParent = (index, field) => (e) => {
    setParents((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: e.target.value } : p))
    );
  };

  const addParent = () => {
    setParents((prev) => [...prev, { fullName: '', phone: '', relationship: 'พ่อ' }]);
  };

  const removeParent = (index) => {
    if (parents.length <= 1) return;
    setParents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      showToast('กรุณากรอกชื่อ-นามสกุลนักเรียน', 'error');
      return;
    }
    const invalidPhone = parents.find((p) => !p.phone.trim() || !/^\d{10}$/.test(p.phone.replace(/[-\s]/g, '')));
    if (invalidPhone) {
      showToast('กรุณาระบุเบอร์โทรศัพท์ผู้ปกครองให้ครบถ้วน (10 หลัก)', 'error');
      return;
    }
    if (!consent) {
      showToast('กรุณายอมรับข้อตกลง PDPA', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        student: {
          fullName: form.fullName.trim(),
          nickname: form.nickname.trim() || undefined,
          grade: form.grade.trim() || undefined,
          school: form.school.trim() || undefined,
          photoUrl: form.photoUrl.trim() || undefined,
          medicalInfo: form.medicalInfo.trim() || undefined,
        },
        parents: parents
          .filter((p) => p.fullName.trim())
          .map((p) => ({
            fullName: p.fullName.trim(),
            phone: p.phone.trim(),
            relationship: p.relationship,
          })),
        pdpa: {
          isAccepted: consent,
          consentVersion: consent ? 'v1.0' : '',
        },
      };

      await studentService.createStudent(payload);
      showToast('เพิ่มนักเรียนสำเร็จ', 'success');
      route('/admin/students');
    } catch (error) {
      const message = error?.data?.message || 'เพิ่มนักเรียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout path={path}>
      <div class="mb-8">
        <button
          type="button"
          onClick={() => route('/admin/students')}
          class="text-sm text-tiwhub-muted hover:text-tiwhub-heading dark:hover:text-white transition-colors flex items-center gap-1 mb-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          กลับไปหน้านักเรียน
        </button>
        <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">เพิ่มนักเรียนใหม่</h2>
        <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">กรอกข้อมูลนักเรียนให้ครบถ้วน</p>
      </div>

      <form onSubmit={handleSubmit} class="max-w-3xl">
        {/* Section 1: Student Info */}
        <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-6 mb-6">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">ข้อมูลส่วนตัวนักเรียน</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SolidInput
              label="ชื่อ-นามสกุล"
              placeholder="ชื่อจริง นามสกุล"
              required
              value={form.fullName}
              onInput={updateField('fullName')}
            />
            <SolidInput
              label="ชื่อเล่น"
              placeholder="ชื่อเล่น"
              value={form.nickname}
              onInput={updateField('nickname')}
            />
            <SolidInput
              label="ระดับชั้น"
              placeholder="เช่น ป.4, ม.2"
              value={form.grade}
              onInput={updateField('grade')}
            />
            <SolidInput
              label="โรงเรียน"
              placeholder="ชื่อโรงเรียน"
              value={form.school}
              onInput={updateField('school')}
            />
            <SolidInput
              label="ลิงก์รูปภาพ"
              placeholder="URL รูปภาพ (ถ้ามี)"
              value={form.photoUrl}
              onInput={updateField('photoUrl')}
            />
          </div>
          <div class="mt-4">
            <label class="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5 block">
              ข้อมูลทางการแพทย์ (ถ้ามี)
            </label>
            <Textarea
              placeholder="โรคประจำตัว, ยาที่แพ้, ข้อควรระวัง"
              rows={3}
              value={form.medicalInfo}
              onInput={updateField('medicalInfo')}
            />
          </div>
        </div>

        {/* Section 2: Parents */}
        <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">ข้อมูลผู้ปกครอง</h3>
            <button
              type="button"
              onClick={addParent}
              class="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              + เพิ่มผู้ปกครอง
            </button>
          </div>
          <div class="space-y-6">
            {parents.map((parent, i) => (
              <div key={i} class="border border-slate-200 dark:border-slate-600 rounded-sm p-4 relative">
                {parents.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParent(i)}
                    class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                  ผู้ปกครองคนที่ {i + 1}
                </p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SolidInput
                    label="ชื่อ-นามสกุล"
                    placeholder="ชื่อผู้ปกครอง"
                    value={parent.fullName}
                    onInput={updateParent(i, 'fullName')}
                  />
                  <SolidInput
                    label="เบอร์โทรศัพท์"
                    placeholder="08XXXXXXXX"
                    required
                    value={parent.phone}
                    onInput={updateParent(i, 'phone')}
                  />
                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-slate-900 dark:text-slate-200">
                      ความสัมพันธ์
                    </label>
                    <select
                      value={parent.relationship}
                      onChange={updateParent(i, 'relationship')}
                      class="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                    >
                      <option value="แม่">แม่</option>
                      <option value="พ่อ">พ่อ</option>
                      <option value="ผู้ปกครอง">ผู้ปกครอง</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: PDPA */}
        <div class="bg-white dark:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-700 p-6 mb-6">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">การยินยอม PDPA</h3>
          <Checkbox
            id="consent"
            label="ฉันยอมรับข้อตกลงและเงื่อนไขการใช้งานข้อมูลส่วนบุคคล (PDPA)"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
        </div>

        <div class="flex gap-3 mb-8">
          <Button variant="primary" size="md" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            บันทึกข้อมูลนักเรียน
          </Button>
          <Button variant="outline" size="md" onClick={() => route('/admin/students')}>
            ยกเลิก
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
