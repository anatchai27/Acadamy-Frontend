import { useState, useEffect } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { SolidInput, Button, showToast, DatePickerInput } from '../../components/ui';
import { courseService, homeworkService, skillScoreService, studentService } from '../../services';
import { useAbortController } from '../../hooks';

export function AcademicsPage({ path }) {
  const [tab, setTab] = useState('homework');
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const getSignal = useAbortController();

  useEffect(() => {
    courseService.getCourses({}, { signal: getSignal() })
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
        <h2 class="text-2xl font-bold text-zinc-900">ระบบวิชาการ</h2>
        <p class="text-sm text-zinc-500 mt-1">จัดการการบ้านและการประเมินทักษะ</p>
      </div>

      <div class="inline-flex rounded-xl border border-zinc-200 overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setTab('homework')}
          class={`px-5 py-2.5 text-sm font-medium transition-colors ${
            tab === 'homework'
              ? 'bg-oasis-primary text-white'
              : 'bg-white text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          การบ้าน
        </button>
        <button
          type="button"
          onClick={() => setTab('skills')}
          class={`px-5 py-2.5 text-sm font-medium transition-colors ${
            tab === 'skills'
              ? 'bg-oasis-primary text-white'
              : 'bg-white text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          ประเมินทักษะ
        </button>
      </div>

      {courses.length > 0 && (
        <div class="mb-6 max-w-xs">
          <label class="text-sm font-medium text-zinc-800 mb-1.5 block">
            เลือกคอร์สเรียน
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            class="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/20 text-zinc-900"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {tab === 'homework' ? (
        <HomeworkTab courseId={selectedCourseId} />
      ) : (
        <SkillScoresTab courseId={selectedCourseId} />
      )}
    </AdminLayout>
  );
}

/* ─── HOMEWORK TAB ─── */

function HomeworkTab({ courseId }) {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedHw, setExpandedHw] = useState(null);
  const [submissions, setSubmissions] = useState({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    fileUrl: '',
  });

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

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const openCreate = () => {
    setForm({ title: '', description: '', dueDate: '', fileUrl: '' });
    setShowForm(true);
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('กรุณากรอกชื่อการบ้าน', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        courseId: Number(courseId),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueAt: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        fileUrl: form.fileUrl.trim() || undefined,
      };

      await homeworkService.createHomework(payload);
      showToast('สั่งการบ้านสำเร็จ', 'success');
      setShowForm(false);
      fetchHomeworks();
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'บันทึกไม่สำเร็จ';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSubmissions = async (hwId) => {
    if (expandedHw === hwId) {
      setExpandedHw(null);
      return;
    }
    setExpandedHw(hwId);
    if (!submissions[hwId]) {
      try {
        const res = await homeworkService.getSubmissions(hwId);
        const payload = res.data?.data || res.data || {};
        setSubmissions((prev) => ({
          ...prev,
          [hwId]: payload.submissions || (Array.isArray(payload) ? payload : []),
        }));
      } catch { /* silent */ }
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
    return <p class="text-sm text-zinc-400 text-center py-16">กรุณาเลือกคอร์สเรียน</p>;
  }

  return (
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-zinc-900">รายการการบ้าน</h3>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <span class="flex items-center gap-1.5">
            <PlusIcon class="h-4 w-4" />
            สั่งการบ้านใหม่
          </span>
        </Button>
      </div>

      {showForm && (
        <div class="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          <h4 class="text-base font-semibold text-zinc-900 mb-4">สั่งการบ้านใหม่</h4>
          <form onSubmit={handleSubmitHomework}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <SolidInput
                  label="ชื่อการบ้าน *"
                  placeholder="เช่น แบบฝึกหัดบทที่ 1"
                  required
                  value={form.title}
                  onInput={updateField('title')}
                />
              </div>
              <div class="md:col-span-2">
                <label class="text-sm font-medium text-zinc-800 mb-1.5 block">รายละเอียด</label>
                <textarea
                  value={form.description}
                  onInput={updateField('description')}
                  placeholder="คำอธิบายการบ้าน"
                  rows={3}
                  class="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/20 text-zinc-900 placeholder-zinc-400 resize-none transition-colors"
                />
              </div>
              <DatePickerInput
                label="กำหนดส่ง"
                showTime
                value={form.dueDate ? new Date(form.dueDate) : null}
                onChange={(date) => setForm((prev) => ({ ...prev, dueDate: date ? date.toISOString() : '' }))}
                placeholder="เลือกวันที่และเวลา"
              />
              <SolidInput
                label="ลิงก์ไฟล์แนบ"
                placeholder="URL ไฟล์ (ถ้ามี)"
                value={form.fileUrl}
                onInput={updateField('fileUrl')}
              />
            </div>
            <div class="flex gap-3 mt-4 pt-4 border-t border-zinc-100">
              <Button variant="primary" size="md" type="submit" loading={submitting} disabled={submitting}>
                สั่งการบ้าน
              </Button>
              <Button variant="outline" size="md" type="button" onClick={() => setShowForm(false)}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div class="text-center py-12">
          <div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
          <p class="text-sm text-zinc-400">กำลังโหลด...</p>
        </div>
      )}

      {!loading && homeworks.length === 0 && (
        <p class="text-sm text-zinc-400 text-center py-12">ยังไม่มีการบ้านในคอร์สนี้</p>
      )}

      {homeworks.map((hw) => (
        <div key={hw.id} class="bg-white rounded-xl border border-zinc-200 mb-3 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSubmissions(hw.id)}
            class="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-zinc-50 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-zinc-900">{hw.title}</h4>
              {hw.dueAt && (
                <p class="text-xs text-zinc-500 mt-1">
                  ส่งภายใน {new Date(hw.dueAt).toLocaleDateString('th-TH')}
                </p>
              )}
            </div>
            <span class="text-xs text-zinc-400 shrink-0">
              {hw.submissionCount != null && `${hw.submissionCount} คนส่ง`}
              <ChevronDownIcon class={`h-4 w-4 ml-1 inline transition-transform ${expandedHw === hw.id ? 'rotate-180' : ''}`} />
            </span>
          </button>

          {expandedHw === hw.id && (
            <div class="border-t border-zinc-100 p-5">
              <SubmissionsList
                submissions={submissions[hw.id] || []}
                onGrade={handleGrade}
              />
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
    return <p class="text-sm text-zinc-400 text-center py-4">ยังไม่มีนักเรียนส่งงาน</p>;
  }

  return (
    <div class="space-y-2">
      <p class="text-xs font-medium text-zinc-500 mb-2">นักเรียนที่ส่งงาน ({submissions.length} คน)</p>
      {submissions.map((sub) => (
        <div key={sub.id} class="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-t border-zinc-50 first:border-0">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-zinc-800">
              {sub.studentName || `นักเรียน #${sub.studentId}`}
            </p>
            {sub.submittedAt && (
              <p class="text-xs text-zinc-500">
                ส่งเมื่อ {new Date(sub.submittedAt).toLocaleDateString('th-TH')}
              </p>
            )}
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            {sub.score != null ? (
              <span class="text-sm font-bold text-oasis-warning">{sub.score}</span>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="ความเห็น"
                  value={feedbackInputs[sub.id] ?? ''}
                  onInput={(e) => setFeedbackInputs((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                  class="w-28 px-2 py-1.5 text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:border-oasis-primary placeholder-zinc-400"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="คะแนน"
                  value={gradeInputs[sub.id] ?? ''}
                  onInput={(e) => setGradeInputs((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                  class="w-20 px-2 py-1.5 text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:border-oasis-primary"
                />
                <button
                  type="button"
                  onClick={() => onGrade(sub.id, Number(gradeInputs[sub.id]), feedbackInputs[sub.id])}
                  disabled={!gradeInputs[sub.id]}
                  class="px-3 py-1.5 text-xs font-medium text-white bg-oasis-primary hover:bg-oasis-primary-dark rounded-xl disabled:opacity-40 transition-colors"
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
  const [scoreValues, setScoreValues] = useState({});

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
    return <p class="text-sm text-zinc-400 text-center py-16">กรุณาเลือกคอร์สเรียน</p>;
  }

  if (loading) {
    return (
      <div class="text-center py-12">
        <div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-oasis-primary border-t-transparent animate-spin" />
        <p class="text-sm text-zinc-400">กำลังโหลด...</p>
      </div>
    );
  }

  if (topics.length === 0) {
    return <p class="text-sm text-zinc-400 text-center py-12">ยังไม่มีหัวข้อทักษะในคอร์สนี้</p>;
  }

  return (
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-zinc-900">ประเมินทักษะ</h3>
        <Button variant="primary" size="sm" onClick={handleBatchSave} loading={saving} disabled={saving}>
          บันทึกคะแนนทั้งหมด
        </Button>
      </div>

      <div class="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-zinc-50">
              <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">นักเรียน</th>
              {topics.map((t) => (
                <th key={t.id} class="text-center px-3 py-3 text-xs font-semibold text-zinc-500 uppercase min-w-[100px]">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colspan={topics.length + 1} class="text-center py-8 text-sm text-zinc-400">ยังไม่มีนักเรียนในคอร์สนี้</td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} class="border-t border-zinc-100">
                  <td class="px-4 py-3 text-sm font-medium text-zinc-800">
                    {student.fullName || '-'}
                  </td>
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
                          class="w-20 px-2 py-1.5 text-sm text-center border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:border-oasis-primary"
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
    </div>
  );
}

/* ─── Shared Icons ─── */

function PlusIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ChevronDownIcon({ class: className }) {
  return (
    <svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}