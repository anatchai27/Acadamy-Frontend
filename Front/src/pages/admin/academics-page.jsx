import { useState, useEffect, useRef } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast } from '../../components/ui';
import { courseService, homeworkService, skillScoreService, studentService, uploadService } from '../../services';
import { useAbortController } from '../../hooks';
import { BentoGrid } from '../../components/ui/bento-grid';
import { FoxSticker } from '../../components/ui/fox-sticker';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlinePlus, HiOutlineChevronDown, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark } from 'react-icons/hi2';

export function AcademicsPage({ path }) {
  const [tab, setTab] = useState('homework');
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const getSignal = useAbortController();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  useEffect(() => {
    courseService
      .getCourses({}, { signal: getSignal() })
      .then((res) => {
        const payload = res.data?.data || res.data || {};
        const list = payload.courses || (Array.isArray(payload) ? payload : []);
        setCourses(list);
        if (list.length > 0) setSelectedCourseId(String(list[0].id));
      })
      .catch(() => {});
  }, []);

  return (
    <AdminLayout path={path}>
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-slate-900 tracking-tight">ระบบวิชาการ</h2>
        <p class="text-sm text-slate-500 mt-1">จัดการการบ้านและการประเมินทักษะ</p>
      </div>

      <div class={`${isNeo ? 'neo-tab-group p-0 mb-6' : 'inline-flex rounded-xl bg-slate-100 p-1 mb-6'}`}>
        <button
          type="button"
          onClick={() => setTab('homework')}
          class={`px-5 py-2 text-sm font-medium transition-all ${
            isNeo
              ? tab === 'homework'
                ? 'neo-tab-active'
                : 'neo-tab-inactive'
              : `rounded-lg ${tab === 'homework' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`
          }`}
        >
          การบ้าน
        </button>
        <button
          type="button"
          onClick={() => setTab('skills')}
          class={`px-5 py-2 text-sm font-medium transition-all ${
            isNeo
              ? tab === 'skills'
                ? 'neo-tab-active'
                : 'neo-tab-inactive'
              : `rounded-lg ${tab === 'skills' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`
          }`}
        >
          ประเมินทักษะ
        </button>
      </div>

      {courses.length > 0 && (
        <div class="mb-6 max-w-xs">
          <label class={`text-sm font-medium mb-1.5 block ${isNeo ? 'text-black' : 'text-slate-700'}`}>
            เลือกคอร์สเรียน
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-slate-900 ${isNeo ? 'neo-select' : 'border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'}`}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === 'homework' ? (
        <HomeworkTab courseId={selectedCourseId} courses={courses} onCourseChange={setSelectedCourseId} />
      ) : (
        <SkillScoresTab courseId={selectedCourseId} />
      )}
    </AdminLayout>
  );
}

/* ─── HOMEWORK TAB ─── */

function HomeworkTab({ courseId, courses, onCourseChange }) {
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const createControllerRef = useRef(null);
  const [expandedHw, setExpandedHw] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [submissionsLoading, setSubmissionsLoading] = useState({});
  const [submissionsErrors, setSubmissionsErrors] = useState({});
  const [submissionRosters, setSubmissionRosters] = useState({});
  const [rosterLoading, setRosterLoading] = useState({});
  const [rosterErrors, setRosterErrors] = useState({});
  const [selectedStudents, setSelectedStudents] = useState({});
  const [uploadingFor, setUploadingFor] = useState(null);
  const [skillTopics, setSkillTopics] = useState([]);
  const [skillTopicsLoading, setSkillTopicsLoading] = useState(true);
  const [homeworkMappings, setHomeworkMappings] = useState({});
  const [homeworkMappingsLoading, setHomeworkMappingsLoading] = useState({});
  const [homeworkMappingsErrors, setHomeworkMappingsErrors] = useState({});
  const [mappingSaving, setMappingSaving] = useState(null);
  const [quickTopicHomeworkId, setQuickTopicHomeworkId] = useState(null);
  const [quickTopicName, setQuickTopicName] = useState('');
  const [quickTopicSaving, setQuickTopicSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    dueDate: '',
    dueTime: '',
    fileUrl: '',
  });

  useEffect(() => () => {
    const controller = createControllerRef.current;
    createControllerRef.current = null;
    controller?.abort();
  }, []);

  const fetchHomeworks = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await homeworkService.getHomeworks(courseId);
      const payload = res.data?.data || res.data || {};
      setHomeworks(payload.homeworks || (Array.isArray(payload) ? payload : []));
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลการบ้านได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;
    setSkillTopics([]);
    setSkillTopicsLoading(true);
    skillScoreService
      .getSkillTopics(courseId)
      .then((res) => {
        const payload = res.data?.data || res.data || {};
        setSkillTopics(payload.topics || []);
      })
      .catch(() => setSkillTopics([]))
      .finally(() => setSkillTopicsLoading(false));
  }, [courseId]);

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const openCreate = () => {
    setForm({ title: '', titleEn: '', description: '', descriptionEn: '', dueDate: '', dueTime: '', fileUrl: '' });
    setShowForm(true);
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('กรุณากรอกชื่อการบ้าน', 'error');
      return;
    }
    if (!courseId || !form.dueDate || !form.dueTime) {
      showToast('กรุณาระบุคอร์สและกำหนดส่งให้ครบถ้วน', 'error');
      return;
    }

    setSubmitting(true);
    const controller = new AbortController();
    createControllerRef.current?.abort();
    createControllerRef.current = controller;
    try {
      const payload = {
        courseId: Number(courseId),
        title: form.title.trim(),
        titleEn: form.titleEn.trim(),
        description: form.description.trim() || undefined,
        descriptionEn: form.descriptionEn.trim(),
        dueAt: new Date(`${form.dueDate}T${form.dueTime}`).toISOString(),
        fileUrl: form.fileUrl.trim() || undefined,
      };

      await homeworkService.createHomework(payload, { signal: controller.signal });
      showToast('สั่งการบ้านสำเร็จ', 'success');
      setShowForm(false);
      fetchHomeworks();
    } catch (err) {
      if (err?.name === 'AbortError') return;
      const msg = err?.data?.message || err?.data?.error || 'บันทึกไม่สำเร็จ';
      showToast(msg, 'error');
    } finally {
      if (createControllerRef.current === controller) {
        createControllerRef.current = null;
        setSubmitting(false);
      }
    }
  };

  const cancelHomeworkCreation = () => {
    createControllerRef.current?.abort();
    createControllerRef.current = null;
    setSubmitting(false);
    setShowForm(false);
  };

  const loadSubmissions = async (hwId) => {
    setSubmissionsLoading((prev) => ({ ...prev, [hwId]: true }));
    setSubmissionsErrors((prev) => ({ ...prev, [hwId]: false }));
    try {
      const res = await homeworkService.getSubmissions(hwId);
      const payload = res.data?.data || res.data || {};
      setSubmissions((prev) => ({
        ...prev,
        [hwId]: payload.submissions || (Array.isArray(payload) ? payload : []),
      }));
    } catch {
      setSubmissionsErrors((prev) => ({ ...prev, [hwId]: true }));
    } finally {
      setSubmissionsLoading((prev) => ({ ...prev, [hwId]: false }));
    }
  };

  const loadSubmissionRoster = async (hwId) => {
    setRosterLoading(previous => ({ ...previous, [hwId]: true }));
    setRosterErrors(previous => ({ ...previous, [hwId]: false }));
    try {
      const response = await homeworkService.getSubmissionRoster(hwId);
      const payload = response.data?.data || response.data || {};
      setSubmissionRosters(previous => ({ ...previous, [hwId]: payload.students || [] }));
    } catch (error) {
      setRosterErrors(previous => ({ ...previous, [hwId]: true }));
      showToast(error?.data?.error || 'โหลดรายชื่อนักเรียนไม่สำเร็จ', 'error');
    } finally {
      setRosterLoading(previous => ({ ...previous, [hwId]: false }));
    }
  };

  const handleTeacherSubmission = async (homework, event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const studentId = selectedStudents[homework.id];
    if (!file || !studentId) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension)) {
      showToast('รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ PDF', 'error');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('ไฟล์ต้องมีขนาดไม่เกิน 10 MB', 'error');
      input.value = '';
      return;
    }

    const uploadKey = `${homework.id}:${studentId}`;
    setUploadingFor(uploadKey);
    try {
      const response = await homeworkService.createStudentSubmission(homework.id, studentId);
      const payload = response.data?.data || response.data || {};
      await uploadService.uploadHomeworkSubmission(file, payload.submissionId);
      showToast('ส่งงานแทนนักเรียนสำเร็จ', 'success');
      await Promise.all([loadSubmissions(homework.id), loadSubmissionRoster(homework.id)]);
      setSelectedStudents(previous => ({ ...previous, [homework.id]: '' }));
    } catch (error) {
      showToast(error?.data?.error || error?.data?.message || error.message || 'ส่งงานไม่สำเร็จ', 'error');
    } finally {
      setUploadingFor(null);
      input.value = '';
    }
  };

  const loadSkillMapping = async (hwId) => {
    setHomeworkMappingsLoading(previous => ({ ...previous, [hwId]: true }));
    setHomeworkMappingsErrors(previous => ({ ...previous, [hwId]: false }));
    try {
      const mappingRes = await homeworkService.getSkillMapping(hwId);
      const mappingPayload = mappingRes.data?.data || mappingRes.data || {};
      setHomeworkMappings(previous => ({ ...previous, [hwId]: mappingPayload.topicIds || [] }));
    } catch {
      setHomeworkMappingsErrors(previous => ({ ...previous, [hwId]: true }));
      showToast('โหลดทักษะที่ผูกไว้ไม่สำเร็จ', 'error');
    } finally {
      setHomeworkMappingsLoading(previous => ({ ...previous, [hwId]: false }));
    }
  };

  const toggleSubmissions = async (hwId) => {
    if (expandedHw === hwId) {
      setExpandedHw(null);
      return;
    }
    setExpandedHw(hwId);
    const mappingRequest = homeworkMappings[hwId] ? Promise.resolve() : loadSkillMapping(hwId);
    await Promise.all([mappingRequest, loadSubmissions(hwId), loadSubmissionRoster(hwId)]);
  };

  const saveSkillMapping = async (homeworkId) => {
    setMappingSaving(homeworkId);
    try {
      await homeworkService.setSkillMapping(homeworkId, homeworkMappings[homeworkId] || []);
      showToast('บันทึก skill mapping สำเร็จ', 'success');
    } catch (err) {
      showToast(err?.data?.message || 'บันทึก skill mapping ไม่สำเร็จ', 'error');
    } finally {
      setMappingSaving(null);
    }
  };

  const addAndLinkSkillTopic = async (homeworkId) => {
    const name = quickTopicName.trim();
    if (!name || !courseId) return;

    setQuickTopicSaving(true);
    let topicCreated = false;
    try {
      await skillScoreService.createSkillTopic({
        courseId: Number(courseId),
        name,
        nameEn: '',
        orderIndex: skillTopics.length + 1,
      });
      topicCreated = true;

      const response = await skillScoreService.getSkillTopics(courseId);
      const payload = response.data?.data || response.data || {};
      const updatedTopics = payload.topics || (Array.isArray(payload) ? payload : []);
      setSkillTopics(updatedTopics);

      const previousTopicIds = new Set(skillTopics.map(topic => topic.id));
      const createdTopic = updatedTopics.find(topic => topic.name === name && !previousTopicIds.has(topic.id));
      if (!createdTopic) throw new Error('สร้างหัวข้อแล้ว แต่โหลดหัวข้อใหม่ไม่สำเร็จ');

      const topicIds = [...new Set([...(homeworkMappings[homeworkId] || []), createdTopic.id])];
      await homeworkService.setSkillMapping(homeworkId, topicIds);
      setHomeworkMappings(previous => ({ ...previous, [homeworkId]: topicIds }));
      setQuickTopicName('');
      setQuickTopicHomeworkId(null);
      showToast('เพิ่มและผูกทักษะกับการบ้านแล้ว', 'success');
    } catch (error) {
      const message = topicCreated
        ? 'เพิ่มหัวข้อแล้ว แต่ผูกกับการบ้านไม่สำเร็จ เลือกหัวข้อแล้วกดบันทึกอีกครั้งได้เลย'
        : error?.data?.message || error?.data?.Message || 'เพิ่มหัวข้อทักษะไม่สำเร็จ';
      showToast(message, 'error');
    } finally {
      setQuickTopicSaving(false);
    }
  };

  const handleGrade = async (submissionId, score, feedback) => {
    try {
      await homeworkService.gradeSubmission(submissionId, { score, feedback: feedback || undefined });
      showToast('บันทึกคะแนนสำเร็จ', 'success');
    } catch {
      showToast('บันทึกไม่สำเร็จ', 'error');
    }
  };

  if (!courseId) {
    return <p class="text-sm text-slate-400 text-center py-16">กรุณาเลือกคอร์สเรียน</p>;
  }

  return (
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900">รายการการบ้าน</h3>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <span class="flex items-center gap-1.5">
            <HiOutlinePlus class="h-4 w-4" />
            สั่งการบ้านใหม่
          </span>
        </Button>
      </div>

      {showForm && (
        <div
          class={`${isNeo ? 'neo-card bg-white p-6' : 'bg-white rounded-2xl border border-slate-200 p-6'} mb-6 shadow-sm`}
        >
          <h4 class="text-base font-semibold text-slate-900 mb-4">สั่งการบ้านใหม่</h4>
          <form onSubmit={handleSubmitHomework}>
            <BentoGrid>
              <div class="md:col-span-2">
                <label class={`text-sm font-medium mb-1.5 block ${isNeo ? 'text-black' : 'text-slate-700'}`}>
                  คอร์สเรียนที่สั่งการบ้าน *
                </label>
                <select
                  required
                  value={courseId}
                  onChange={(event) => onCourseChange(event.target.value)}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-slate-900 ${isNeo ? 'neo-select' : 'border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'}`}
                >
                  <option value="">เลือกคอร์สเรียน</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div class="md:col-span-2">
                <SolidInput
                  label="ชื่อการบ้าน (ไทย) *"
                  placeholder="เช่น แบบฝึกหัดบทที่ 1"
                  required
                  value={form.title}
                  onInput={updateField('title')}
                />
              </div>
              <div class="md:col-span-2">
                <SolidInput
                  label="ชื่อการบ้าน (English)"
                  placeholder="e.g. Chapter 1 Exercises"
                  value={form.titleEn}
                  onInput={updateField('titleEn')}
                />
              </div>
              <div class="md:col-span-2">
                <label class={`text-sm font-medium mb-1.5 block ${isNeo ? 'text-black' : 'text-slate-700'}`}>
                  รายละเอียด (ไทย)
                </label>
                <textarea
                  value={form.description}
                  onInput={updateField('description')}
                  placeholder="คำอธิบายการบ้าน"
                  rows={3}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-slate-900 placeholder-slate-400 resize-none transition-colors ${isNeo ? 'neo-input' : 'border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'}`}
                />
              </div>
              <div class="md:col-span-2">
                <label class={`text-sm font-medium mb-1.5 block ${isNeo ? 'text-black' : 'text-slate-700'}`}>
                  รายละเอียด (English)
                </label>
                <textarea
                  value={form.descriptionEn}
                  onInput={updateField('descriptionEn')}
                  placeholder="Homework instructions"
                  rows={3}
                  class={`w-full px-4 py-2.5 bg-white text-sm focus:outline-none text-slate-900 placeholder-slate-400 resize-none transition-colors ${isNeo ? 'neo-input' : 'border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'}`}
                />
              </div>
              <SolidInput
                label="ส่งภายในวันที่ *"
                type="date"
                value={form.dueDate}
                onInput={updateField('dueDate')}
                required
              />
              <SolidInput label="เวลา *" type="time" value={form.dueTime} onInput={updateField('dueTime')} required />
              <SolidInput
                label="ลิงก์ไฟล์แนบ"
                placeholder="URL ไฟล์ (ถ้ามี)"
                value={form.fileUrl}
                onInput={updateField('fileUrl')}
              />
            </BentoGrid>
            <div class={`flex gap-3 mt-4 pt-4 border-t ${isNeo ? 'border-black' : 'border-slate-100'}`}>
              <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>
                สั่งการบ้าน
              </Button>
              <Button variant="outline" size="md" type="button" onClick={cancelHomeworkCreation}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div class="text-center py-12">
          <div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p class="text-sm text-slate-400">กำลังโหลด...</p>
        </div>
      )}

      {!loading && homeworks.length === 0 && (
        <div class="flex flex-col items-center py-8 text-center">
          <FoxSticker action="reading" message="ยังไม่มีการบ้านในคอร์สนี้" />
          <p class="mt-2 text-sm text-slate-500">พร้อมแล้วกด “สั่งการบ้านใหม่” ด้านบนได้เลย</p>
        </div>
      )}

      {homeworks.map((hw) => (
        <div
          key={hw.id}
          class={`${isNeo ? 'neo-card bg-white' : 'bg-white rounded-2xl border border-slate-200'} mb-3 overflow-hidden shadow-sm`}
        >
          <button
            type="button"
            onClick={() => toggleSubmissions(hw.id)}
            class={`w-full p-5 text-left flex items-center justify-between gap-4 transition-colors ${isNeo ? 'neo-accordion-header' : 'hover:bg-slate-50'}`}
          >
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-slate-900">{hw.title}</h4>
              {hw.dueAt && (
                <p class="text-xs text-slate-500 mt-1">
                  ส่งภายใน{' '}
                  {new Date(hw.dueAt).toLocaleString('th-TH', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              )}
            </div>
            <span class="text-xs text-slate-400 shrink-0 flex items-center gap-1">
              {hw.submissionCount != null && `${hw.submissionCount} คนส่ง`}
              <HiOutlineChevronDown
                class={`h-4 w-4 transition-transform ${expandedHw === hw.id ? 'rotate-180' : ''}`}
              />
            </span>
          </button>

          {expandedHw === hw.id && (
            <div class={`border-t p-5 ${isNeo ? 'neo-accordion-content' : 'border-slate-100'}`}>
              <section class="mb-5 border-b border-slate-200 pb-5" aria-labelledby={`homework-skills-${hw.id}`}>
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h5 id={`homework-skills-${hw.id}`} class="text-sm font-semibold text-slate-800">ทักษะที่การบ้านนี้วัด</h5>
                    <p class="mt-1 text-xs text-slate-500">เลือกได้หลายข้อ · คะแนนตรวจงานจะอัปเดตให้ทักษะที่เลือก</p>
                  </div>
                  <div class="flex items-center gap-3">
                    {skillTopics.length > 0 && !homeworkMappingsLoading[hw.id] && !homeworkMappingsErrors[hw.id] && (
                      <span class="text-xs text-slate-500">เลือก {(homeworkMappings[hw.id] || []).length} ข้อ</span>
                    )}
                    {skillTopics.length > 0 && !homeworkMappingsLoading[hw.id] && !homeworkMappingsErrors[hw.id] && (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={mappingSaving === hw.id}
                        disabled={mappingSaving === hw.id || quickTopicSaving}
                        onClick={() => saveSkillMapping(hw.id)}
                      >
                        บันทึกทักษะ
                      </Button>
                    )}
                  </div>
                </div>
                {skillTopicsLoading ? (
                  <p class="mt-3 text-sm text-slate-500" role="status">กำลังโหลดทักษะของคอร์ส...</p>
                ) : homeworkMappingsLoading[hw.id] ? (
                  <p class="mt-3 text-sm text-slate-500" role="status">กำลังโหลดทักษะที่ผูกกับการบ้าน...</p>
                ) : homeworkMappingsErrors[hw.id] ? (
                  <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span class="text-red-700" role="alert">โหลดทักษะที่ผูกไว้ไม่สำเร็จ</span>
                    <button type="button" class="font-semibold text-oasis-primary hover:underline" onClick={() => loadSkillMapping(hw.id)}>ลองอีกครั้ง</button>
                  </div>
                ) : skillTopics.length > 0 && (
                  <div class="mt-3 grid gap-2 sm:grid-cols-2">
                    {skillTopics.map((topic) => (
                      <label key={topic.id} class="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-slate-700 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={(homeworkMappings[hw.id] || []).includes(topic.id)}
                          onChange={(event) =>
                            setHomeworkMappings((previous) => ({
                              ...previous,
                              [hw.id]: event.target.checked
                                ? [...new Set([...(previous[hw.id] || []), topic.id])]
                                : (previous[hw.id] || []).filter((id) => id !== topic.id),
                            }))
                          }
                        />
                        <span>
                          {topic.name}
                          {topic.nameEn && <span class="ml-1 text-xs text-slate-500">({topic.nameEn})</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {!skillTopicsLoading && !homeworkMappingsLoading[hw.id] && !homeworkMappingsErrors[hw.id] && quickTopicHomeworkId === hw.id ? (
                  <form
                    class="mt-3 flex flex-col gap-2 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addAndLinkSkillTopic(hw.id);
                    }}
                  >
                    <input
                      autoFocus
                      aria-label="ชื่อทักษะใหม่"
                      class="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-oasis-primary focus:outline-none focus:ring-2 focus:ring-oasis-primary/20"
                      placeholder="เช่น การคิดวิเคราะห์"
                      value={quickTopicName}
                      onInput={event => setQuickTopicName(event.currentTarget.value)}
                      disabled={quickTopicSaving}
                    />
                    <div class="flex gap-2">
                      <Button type="submit" variant="primary" size="sm" loading={quickTopicSaving} disabled={quickTopicSaving || !quickTopicName.trim()}>
                        เพิ่มและผูก
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={quickTopicSaving}
                        onClick={() => {
                          setQuickTopicName('');
                          setQuickTopicHomeworkId(null);
                        }}
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  </form>
                ) : !skillTopicsLoading && !homeworkMappingsLoading[hw.id] && !homeworkMappingsErrors[hw.id] && (
                  <button
                    type="button"
                    class="mt-3 min-h-10 text-sm font-semibold text-oasis-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary"
                    onClick={() => {
                      setQuickTopicName('');
                      setQuickTopicHomeworkId(hw.id);
                    }}
                  >
                    + เพิ่มทักษะใหม่
                  </button>
                )}
              </section>
              <section class="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="ส่งงานแทนนักเรียน">
                <h4 class="text-sm font-semibold text-slate-900">ส่งงานแทนนักเรียน</h4>
                <p class="mt-1 text-xs text-slate-600">เลือกนักเรียนที่ยังไม่ส่ง แล้วแนบไฟล์ JPG, PNG, WEBP หรือ PDF (ไม่เกิน 10 MB)</p>
                {rosterLoading[hw.id] ? (
                  <p class="mt-3 text-sm text-slate-500" role="status">กำลังโหลดรายชื่อนักเรียน...</p>
                ) : rosterErrors[hw.id] ? (
                  <div class="mt-3 flex items-center gap-3 text-sm text-red-700" role="alert">
                    <span>โหลดรายชื่อไม่สำเร็จ</span>
                    <button type="button" class="font-semibold underline" onClick={() => loadSubmissionRoster(hw.id)}>ลองอีกครั้ง</button>
                  </div>
                ) : (submissionRosters[hw.id] || []).length === 0 ? (
                  <p class="mt-3 text-sm text-slate-500">ไม่มีนักเรียนที่ลงทะเบียนในคอร์สนี้</p>
                ) : (submissionRosters[hw.id] || []).filter(student => !student.submittedAt && !student.fileUrl).length === 0 ? (
                  <p class="mt-3 text-sm text-slate-500">นักเรียนที่ลงทะเบียนในคอร์สนี้ส่งงานครบแล้ว</p>
                ) : (
                  <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label class="min-w-0 flex-1 text-sm font-medium text-slate-700">
                      นักเรียน
                      <select
                        class="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-oasis-primary focus:outline-none focus:ring-2 focus:ring-oasis-primary/20"
                        value={selectedStudents[hw.id] || ''}
                        onChange={event => setSelectedStudents(previous => ({ ...previous, [hw.id]: event.currentTarget.value }))}
                        disabled={uploadingFor?.startsWith(`${hw.id}:`)}
                      >
                        <option value="">เลือกนักเรียน...</option>
                        {(submissionRosters[hw.id] || []).filter(student => !student.submittedAt && !student.fileUrl).map(student => (
                          <option key={student.studentId} value={student.studentId}>{student.studentName}</option>
                        ))}
                      </select>
                    </label>
                    <label class="flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                      {uploadingFor?.startsWith(`${hw.id}:`) ? 'กำลังอัปโหลด...' : 'เลือกไฟล์และส่ง'}
                      <input
                        class="sr-only"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        disabled={!selectedStudents[hw.id] || uploadingFor?.startsWith(`${hw.id}:`)}
                        onChange={event => handleTeacherSubmission(hw, event)}
                      />
                    </label>
                  </div>
                )}
              </section>
              {submissionsLoading[hw.id] ? (
                <p class="py-4 text-center text-sm text-slate-500">กำลังโหลดรายการส่งงาน...</p>
              ) : submissionsErrors[hw.id] ? (
                <div class="py-4 text-center">
                  <p class="text-sm text-red-600">โหลดรายการส่งงานไม่สำเร็จ</p>
                  <button type="button" class="mt-2 text-sm font-medium text-blue-600 hover:underline" onClick={() => loadSubmissions(hw.id)}>ลองอีกครั้ง</button>
                </div>
              ) : (
                <SubmissionsList submissions={submissions[hw.id] || []} onGrade={handleGrade} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SubmissionsList({ submissions, onGrade }) {
  const [gradeInputs, setGradeInputs] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});

  if (!submissions || submissions.length === 0) {
    return <p class="text-sm text-slate-400 text-center py-4">ยังไม่มีนักเรียนส่งงาน</p>;
  }

  return (
    <div class="space-y-2">
      <p class="text-xs font-medium text-slate-500 mb-2">นักเรียนที่ส่งงาน ({submissions.length} คน)</p>
      {submissions.map((sub) => (
        <div
          key={sub.id}
          class="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-t border-slate-50 first:border-0"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-700">{sub.studentName || `นักเรียน #${sub.studentId}`}</p>
            {sub.submittedAt && (
              <p class="text-xs text-slate-500">ส่งเมื่อ {new Date(sub.submittedAt).toLocaleDateString('th-TH')}</p>
            )}
            {sub.submittedByRole && sub.submittedByRole !== 'student' && (
              <p class="text-xs text-slate-500">ส่งแทนโดย{sub.submittedByRole === 'teacher' ? 'ครู' : sub.submittedByRole === 'parent' ? 'ผู้ปกครอง' : 'ผู้ดูแลระบบ'} (บัญชี #{sub.submittedByUserId})</p>
            )}
            {sub.fileUrl && (
              <a class="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline" href={sub.fileUrl} target="_blank" rel="noopener noreferrer">เปิดไฟล์งานที่ส่ง</a>
            )}
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            {sub.score != null ? (
              <span class="text-sm font-bold text-amber-600">{sub.score}</span>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="ความเห็น"
                  value={feedbackInputs[sub.id] ?? ''}
                  onInput={(e) => setFeedbackInputs((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                  class="w-28 px-2 py-1.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-600 placeholder-slate-400"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="คะแนน"
                  value={gradeInputs[sub.id] ?? ''}
                  onInput={(e) => setGradeInputs((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                  class="w-20 px-2 py-1.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => onGrade(sub.id, Number(gradeInputs[sub.id]), feedbackInputs[sub.id])}
                  disabled={!gradeInputs[sub.id]}
                  class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-40 transition-colors"
                >
                  บันทึก
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── SKILL SCORES TAB ─── */

function SkillScoresTab({ courseId }) {
  const [topics, setTopics] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topicSaving, setTopicSaving] = useState(false);
  const [topicDeleting, setTopicDeleting] = useState(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [topicForm, setTopicForm] = useState({ name: '', nameEn: '', orderIndex: '1' });
  const [scoreValues, setScoreValues] = useState({});
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const fetchTopicsAndStudents = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [topicsRes, studentsRes] = await Promise.all([
        skillScoreService.getSkillTopics(courseId),
        studentService.getStudents({ limit: 200 }),
      ]);
      const topicsPayload = topicsRes.data?.data || topicsRes.data || {};
      const studentsPayload = studentsRes.data?.data || studentsRes.data || {};
      setTopics(topicsPayload.topics || (Array.isArray(topicsPayload) ? topicsPayload : []));
      setStudents(studentsPayload.students || []);
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลทักษะได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicsAndStudents();
  }, [courseId]);

  const updateTopicField = (field) => (event) => {
    setTopicForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const openCreateTopic = () => {
    setEditingTopicId(null);
    setTopicForm({ name: '', nameEn: '', orderIndex: String(topics.length + 1) });
    setShowTopicForm(true);
  };

  const openEditTopic = (topic) => {
    setEditingTopicId(topic.id);
    setTopicForm({
      name: topic.name || '',
      nameEn: topic.nameEn || '',
      orderIndex: String(topic.orderIndex ?? 0),
    });
    setShowTopicForm(true);
  };

  const closeTopicForm = () => {
    setShowTopicForm(false);
    setEditingTopicId(null);
    setTopicForm({ name: '', nameEn: '', orderIndex: String(topics.length + 1) });
  };

  const handleTopicSubmit = async (event) => {
    event.preventDefault();
    if (!topicForm.name.trim()) {
      showToast('กรุณากรอกชื่อหัวข้อทักษะภาษาไทย', 'error');
      return;
    }

    setTopicSaving(true);
    try {
      const payload = {
        courseId: Number(courseId),
        name: topicForm.name.trim(),
        nameEn: topicForm.nameEn.trim(),
        orderIndex: Number(topicForm.orderIndex) || 0,
      };
      if (editingTopicId) {
        await skillScoreService.updateSkillTopic(editingTopicId, payload);
        showToast('แก้ไขหัวข้อทักษะสำเร็จ', 'success');
      } else {
        await skillScoreService.createSkillTopic(payload);
        showToast('เพิ่มหัวข้อทักษะสำเร็จ', 'success');
      }
      closeTopicForm();
      await fetchTopicsAndStudents();
    } catch (err) {
      showToast(err?.data?.message || err?.data?.Message || 'บันทึกหัวข้อทักษะไม่สำเร็จ', 'error');
    } finally {
      setTopicSaving(false);
    }
  };

  const handleDeleteTopic = async (topic) => {
    if (!window.confirm(`ลบหัวข้อทักษะ "${topic.name}" หรือไม่?`)) return;
    setTopicDeleting(topic.id);
    try {
      await skillScoreService.deleteSkillTopic(topic.id);
      setScoreValues((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([key]) => !key.endsWith(`_${topic.id}`))),
      );
      await fetchTopicsAndStudents();
      showToast('ลบหัวข้อทักษะสำเร็จ', 'success');
    } catch (err) {
      showToast(err?.data?.message || err?.data?.Message || 'ลบหัวข้อทักษะไม่สำเร็จ', 'error');
    } finally {
      setTopicDeleting(null);
    }
  };

  const handleScoreChange = (studentId, topicId, value) => {
    setScoreValues((prev) => ({ ...prev, [`${studentId}_${topicId}`]: value }));
  };

  const handleBatchSave = async () => {
    const byStudent = {};
    Object.entries(scoreValues).forEach(([key, score]) => {
      const [studentId, topicId] = key.split('_');
      if (!byStudent[studentId]) byStudent[studentId] = [];
      byStudent[studentId].push({ topicId: Number(topicId), score: Number(score) });
    });

    const allBatches = Object.entries(byStudent).map(([studentId, scores]) => ({
      studentId: Number(studentId),
      scores,
    }));

    if (allBatches.length === 0) {
      showToast('ไม่มีการเปลี่ยนแปลงคะแนน', 'info');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(allBatches.map((batch) => skillScoreService.batchUpdateSkillScores(batch)));
      showToast('บันทึกคะแนนสำเร็จ', 'success');
      setScoreValues({});
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'บันทึกไม่สำเร็จ';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!courseId) {
    return <p class="text-sm text-slate-400 text-center py-16">กรุณาเลือกคอร์สเรียน</p>;
  }

  if (loading) {
    return (
      <div class="text-center py-12">
        <div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p class="text-sm text-slate-400">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div>
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="text-lg font-semibold text-slate-900">ประเมินทักษะ</h3>
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={openCreateTopic}>
            <span class="flex items-center gap-1.5">
              <HiOutlinePlus class="h-4 w-4" />
              เพิ่มหัวข้อทักษะ
            </span>
          </Button>
          {topics.length > 0 && (
            <Button variant="primary" size="sm" onClick={handleBatchSave} loading={saving} disabled={saving}>
              บันทึกคะแนนทั้งหมด
            </Button>
          )}
        </div>
      </div>

      {showTopicForm && (
        <form
          onSubmit={handleTopicSubmit}
          class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-slate-200 bg-white'} mb-5 p-5 shadow-sm`}
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <h4 class="font-semibold text-slate-900">{editingTopicId ? 'แก้ไขหัวข้อทักษะ' : 'เพิ่มหัวข้อทักษะ'}</h4>
            <button
              type="button"
              onClick={closeTopicForm}
              class="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              aria-label="ปิดฟอร์มหัวข้อทักษะ"
            >
              <HiOutlineXMark class="h-5 w-5" />
            </button>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <SolidInput label="ชื่อหัวข้อ (ไทย) *" value={topicForm.name} onInput={updateTopicField('name')} required />
            <SolidInput
              label="ชื่อหัวข้อ (English)"
              value={topicForm.nameEn}
              onInput={updateTopicField('nameEn')}
              placeholder="e.g. Communication"
            />
            <SolidInput
              label="ลำดับ"
              type="number"
              min="0"
              value={topicForm.orderIndex}
              onInput={updateTopicField('orderIndex')}
            />
          </div>
          <div class="mt-4 flex gap-2">
            <Button variant="primary" type="submit" loading={topicSaving} disabled={topicSaving}>
              {editingTopicId ? 'บันทึกการแก้ไข' : 'เพิ่มหัวข้อ'}
            </Button>
            <Button variant="outline" type="button" onClick={closeTopicForm}>
              ยกเลิก
            </Button>
          </div>
        </form>
      )}

      {topics.length === 0 ? (
        <p class="py-12 text-center text-sm text-slate-400">ยังไม่มีหัวข้อทักษะในคอร์สนี้</p>
      ) : (
        <div
          class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-slate-200 bg-white'} overflow-x-auto shadow-sm`}
        >
          <table class="w-full text-sm">
            <thead>
              <tr class={`${isNeo ? 'bg-black text-white' : 'bg-slate-50'}`}>
                <th
                  class={`text-left px-4 py-3 text-xs font-semibold uppercase ${isNeo ? 'text-white' : 'text-slate-500'}`}
                >
                  นักเรียน
                </th>
                {topics.map((t) => (
                  <th
                    key={t.id}
                    class={`text-center px-3 py-3 text-xs font-semibold uppercase min-w-[100px] ${isNeo ? 'text-white' : 'text-slate-500'}`}
                  >
                    <div class="flex min-w-[100px] flex-col items-center gap-1">
                      <span>{t.name}</span>
                      {t.nameEn && <span class="font-normal normal-case opacity-70">{t.nameEn}</span>}
                      <span class="flex gap-1">
                        <button
                          type="button"
                          aria-label={`แก้ไขหัวข้อ ${t.name}`}
                          onClick={() => openEditTopic(t)}
                          class="rounded p-1 opacity-75 hover:bg-white/20 hover:opacity-100"
                        >
                          <HiOutlinePencil class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`ลบหัวข้อ ${t.name}`}
                          onClick={() => handleDeleteTopic(t)}
                          disabled={topicDeleting === t.id}
                          class="rounded p-1 text-red-500 opacity-75 hover:bg-white/20 hover:opacity-100 disabled:opacity-40"
                        >
                          <HiOutlineTrash class="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colspan={topics.length + 1} class="text-center py-8 text-sm text-slate-400">
                    ยังไม่มีนักเรียนในคอร์สนี้
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} class="border-t border-slate-100">
                    <td class="px-4 py-3 text-sm font-medium text-slate-700">{student.fullName || '-'}</td>
                    {topics.map((topic) => {
                      const key = `${student.id}_${topic.id}`;
                      return (
                        <td key={topic.id} class="px-3 py-3 text-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={scoreValues[key] ?? ''}
                            onInput={(e) => handleScoreChange(student.id, topic.id, e.target.value)}
                            class="w-20 px-2 py-1.5 text-sm text-center border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-600"
                            placeholder="-"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
