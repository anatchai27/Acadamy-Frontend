import { useState, useRef, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { HiOutlineArrowLeft, HiOutlineXMark, HiOutlineMagnifyingGlass, HiOutlineUserGroup, HiOutlineSparkles } from 'react-icons/hi2';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, Checkbox, Textarea, showToast, ImageUpload } from '../../components/ui';
import { studentService, uploadService } from '../../services';
import { useAbortController } from '../../hooks';
import { BentoGrid } from '../../components/ui/bento-grid';
import { useDesignTheme } from '../../hooks/useDesignTheme';

const PARENT_RELATIONS = ['แม่', 'พ่อ', 'ผู้ปกครอง', 'อื่นๆ'];
const emptyForm = {
  fullName: '', nickname: '', grade: '', school: '', medicalInfo: '',
};

export function StudentControll({ path, id }) {
  const isEdit = Boolean(id) && id !== 'add';
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const parentIdCounter = useRef(0);
  const [parents, setParents] = useState([
    { _key: ++parentIdCounter.current, fullName: '', phone: '', relationship: 'แม่' },
  ]);
  const [consent, setConsent] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [parentSearch, setParentSearch] = useState('');
  const [parentSearchResults, setParentSearchResults] = useState([]);
  const [parentSearching, setParentSearching] = useState(false);
  const parentSearchTimer = useRef(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    studentService.getStudentById(id, { signal: getSignal() })
      .then((res) => {
        const s = res.data?.data || res.data || {};
        setForm({
          fullName: s.fullName || '',
          nickname: s.nickname || '',
          grade: s.grade || '',
          school: s.school || '',
          medicalInfo: s.medicalInfo || '',
        });
        setPhotoPreview(s.photoUrl || null);
        if (s.parents && s.parents.length > 0) {
          parentIdCounter.current = s.parents.length;
          setParents(s.parents.map((p) => ({
            _key: ++parentIdCounter.current,
            fullName: p.fullName || '',
            phone: p.phone || '',
            relationship: p.relationship || 'ผู้ปกครอง',
          })));
        }
        setConsent(true);
      })
      .catch(() => showToast('ไม่สามารถโหลดข้อมูลนักเรียน', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateParent = (key, field) => (e) => {
    setParents((prev) =>
      prev.map((p) => (p._key === key ? { ...p, [field]: e.target.value } : p))
    );
  };

  const addParent = () => {
    setParents((prev) => [...prev, { _key: ++parentIdCounter.current, fullName: '', phone: '', relationship: 'พ่อ' }]);
  };

  const removeParent = (key) => {
    setParents((prev) => prev.filter((p) => p._key !== key));
  };

  const handleParentSearch = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setParentSearch(value);
    clearTimeout(parentSearchTimer.current);
    if (value.length < 8) { setParentSearchResults([]); return; }
    parentSearchTimer.current = setTimeout(async () => {
      setParentSearching(true);
      try {
        const res = await studentService.getStudents({ search: value, limit: 50 });
        const payload = res.data?.data || res.data || {};
        const students = payload.students || [];
        const matched = [];
        const seen = new Set();
        for (const s of students) {
          if (!s.parents) continue;
          for (const p of s.parents) {
            const phone = p.phone?.replace(/\D/g, '');
            if (phone && phone.includes(value) && !seen.has(phone)) {
              seen.add(phone);
              matched.push({ phone: p.phone, fullName: p.fullName, relationship: p.relationship, studentName: s.fullName });
            }
          }
        }
        setParentSearchResults(matched);
      } catch { setParentSearchResults([]); }
      finally { setParentSearching(false); }
    }, 400);
  };

  const applyParentData = (data) => {
    setParents((prev) => {
      const exists = prev.some((p) => p.phone.replace(/\D/g, '') === data.phone.replace(/\D/g, ''));
      if (exists) return prev;
      return prev.map((p, i) => i === 0 ? { ...p, fullName: data.fullName || p.fullName, phone: data.phone, relationship: data.relationship || p.relationship } : p);
    });
    setParentSearch('');
    setParentSearchResults([]);
    showToast('นำข้อมูลผู้ปกครองมาใช้แล้ว', 'success');
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
    if (!isEdit && !consent) {
      showToast('กรุณายอมรับข้อตกลง PDPA', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await studentService.updateStudent(id, {
          student: {
            fullName: form.fullName.trim(),
            nickname: form.nickname.trim() || undefined,
            grade: form.grade.trim() || undefined,
            school: form.school.trim() || undefined,
            photoUrl: undefined,
            medicalInfo: form.medicalInfo.trim() || undefined,
          },
          parents: parents
            .filter((p) => p.fullName.trim())
            .map((p) => ({
              id: p.id || 0,
              fullName: p.fullName.trim(),
              phone: p.phone.trim(),
              relationship: p.relationship,
            })),
        });

        if (photoFile) {
          await uploadService.uploadStudentPhoto(photoFile, id);
        }

        showToast('แก้ไขข้อมูลนักเรียนสำเร็จ', 'success');
        route(`/admin/students/${id}`);
      } else {
        const payload = {
          student: {
            fullName: form.fullName.trim(),
            nickname: form.nickname.trim() || undefined,
            grade: form.grade.trim() || undefined,
            school: form.school.trim() || undefined,
            photoUrl: undefined,
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
            consentVersion: '1.0',
          },
        };

        const res = await studentService.createStudent(payload);
        const studentId = res.data?.data?.studentId || res.data?.data?.id || res.data?.id;

        if (photoFile && studentId) {
          await uploadService.uploadStudentPhoto(photoFile, studentId);
        }

        showToast('เพิ่มนักเรียนสำเร็จ', 'success');
        route('/admin/students');
      }
    } catch (error) {
      const message = error?.data?.message || error?.data?.error || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (base64, file) => {
    setPhotoPreview(base64);
    setPhotoFile(file);
  };

  if (loading) {
    return (
      <AdminLayout path={path}>
        <div class="flex flex-col items-center justify-center py-20 gap-3">
          <div class="flex h-10 w-10 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
          <span class="text-zinc-400">กำลังโหลดข้อมูล...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout path={path}>
      <div class="mb-8">
        <button
          type="button"
          onClick={() => route(isEdit ? `/admin/students/${id}` : '/admin/students')}
          class="text-sm text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 mb-2"
        >
          <HiOutlineArrowLeft class="h-4 w-4" />
          {isEdit ? 'กลับไปโปรไฟล์นักเรียน' : 'กลับไปหน้านักเรียน'}
        </button>
        <h2 class="text-2xl font-semibold text-zinc-900 tracking-tight">
          {isEdit ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}
        </h2>
        <p class="text-sm text-zinc-500 mt-1">
          {isEdit ? 'แก้ไขข้อมูลนักเรียนให้ถูกต้อง' : 'กรอกข้อมูลนักเรียนให้ครบถ้วน'}
        </p>
      </div>

      <form onSubmit={handleSubmit} class="max-w-3xl">
        <div class={`${isNeo ? 'neo-card bg-white p-5' : 'bg-white rounded-2xl border border-zinc-200/80 p-5'} mb-6`}>
          <h3 class="text-base font-semibold text-zinc-900 mb-4">ข้อมูลส่วนตัวนักเรียน</h3>
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
            <ImageUpload
              label="รูปภาพนักเรียน"
              preview={photoPreview}
              onChange={handlePhotoChange}
            />
          </div>
          <div class="mt-4">
            <label class="text-sm font-medium text-zinc-800 mb-1.5 block">
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

        <div class={`${isNeo ? 'neo-card bg-white p-5' : 'bg-white rounded-2xl border border-zinc-200/80 p-5'} mb-6`}>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-zinc-900">ข้อมูลผู้ปกครอง</h3>
            <button
              type="button"
              onClick={addParent}
              class="text-sm font-medium text-oasis-primary hover:text-oasis-primary-dark transition-colors"
            >
              + เพิ่มผู้ปกครอง
            </button>
          </div>

          {/* Parent Search */}
          <div class="mb-4 p-3 bg-oasis-primary/5 rounded-xl border border-oasis-primary/10">
            <div class="flex items-center gap-2 mb-1.5">
              <HiOutlineMagnifyingGlass class="h-4 w-4 text-oasis-primary shrink-0" />
              <span class="text-xs font-medium text-oasis-primary">ค้นหาผู้ปกครองที่มีอยู่แล้ว</span>
            </div>
            <div class="relative">
              <input
                type="tel"
                placeholder="ค้นหาจากเบอร์โทรศัพท์ผู้ปกครอง"
                value={parentSearch}
                onInput={handleParentSearch}
                class={`w-full px-3 py-2 text-sm bg-white focus:outline-none text-zinc-800 placeholder:text-zinc-400 ${isNeo ? 'neo-input' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
              />
              {parentSearching && (
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <div class="h-4 w-4 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            {parentSearchResults.length > 0 && (
              <div class="mt-2 space-y-1">
                {parentSearchResults.map((result, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyParentData(result)}
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left bg-white rounded-lg border border-zinc-200 hover:border-oasis-primary hover:bg-oasis-primary/5 transition-colors"
                  >
                    <HiOutlineUserGroup class="h-4 w-4 text-oasis-primary shrink-0" />
                    <div class="flex-1 min-w-0">
                      <span class="font-medium text-zinc-800">{result.fullName}</span>
                      <span class="text-zinc-400 mx-1">·</span>
                      <span class="text-zinc-500">{result.phone}</span>
                      <span class="text-zinc-400 mx-1">·</span>
                      <span class="text-zinc-400 text-xs">นักเรียน: {result.studentName}</span>
                    </div>
                    <HiOutlineSparkles class="h-3.5 w-3.5 text-oasis-primary shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div class="space-y-6">
            {parents.map((parent) => (
              <div key={parent._key} class="border border-zinc-200 rounded-xl p-4 relative">
                {parents.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParent(parent._key)}
                    class="absolute top-2 right-2 text-zinc-400 hover:text-oasis-danger transition-colors"
                  >
                    <HiOutlineXMark class="h-4 w-4" />
                  </button>
                )}
                <p class="text-xs font-medium text-zinc-500 mb-3">
                  ผู้ปกครองคนที่ {parents.findIndex((p) => p._key === parent._key) + 1}
                </p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SolidInput
                    label="ชื่อ-นามสกุล"
                    placeholder="ชื่อผู้ปกครอง"
                    value={parent.fullName}
                    onInput={updateParent(parent._key, 'fullName')}
                  />
                  <SolidInput
                    label="เบอร์โทรศัพท์"
                    placeholder="08XXXXXXXX"
                    required
                    value={parent.phone}
                    onInput={updateParent(parent._key, 'phone')}
                  />
                  <div class="flex flex-col gap-1.5">
                    <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>ความสัมพันธ์</label>
                    <select
                      value={parent.relationship}
                      onChange={updateParent(parent._key, 'relationship')}
                      class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-zinc-800 ${isNeo ? 'neo-select' : 'border border-zinc-200 rounded-xl focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10'}`}
                    >
                      {PARENT_RELATIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isEdit && (
<div class={`${isNeo ? 'neo-card bg-white p-5' : 'bg-white rounded-2xl border border-zinc-200/80 p-5'} mb-6`}>
            <h3 class="text-base font-semibold text-zinc-900 mb-4">การยินยอม PDPA</h3>
            <Checkbox
              id="consent"
              label="ฉันยอมรับข้อตกลงและเงื่อนไขการใช้งานข้อมูลส่วนบุคคล (PDPA)"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
          </div>
        )}

        <div class="flex gap-3 mb-8">
          <Button variant="primary" size="md" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลนักเรียน'}
          </Button>
          <Button variant="outline" size="md" onClick={() => route(isEdit ? `/admin/students/${id}` : '/admin/students')}>
            ยกเลิก
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}