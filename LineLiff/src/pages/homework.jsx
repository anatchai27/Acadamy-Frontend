import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { getChildHomework, createHomeworkSubmission, uploadHomeworkSubmission } from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';
import { apiErrorMessage, validateHomeworkFile } from '../utils/validation';
import { compressImageFile } from '../utils/image-compression';

const unwrap = response => response?.data?.data || response?.data || [];
const formatDate = value => value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(value)) : '-';
export const filterHomeworkByTab = (homeworks, tab) => homeworks.filter(homework => (
  tab === 'submitted' ? Boolean(homework.submittedAt) : !homework.submittedAt
));

const tabs = [
  { id: 'pending', label: 'ค้างส่ง' },
  { id: 'submitted', label: 'ส่งแล้ว' },
];

export const HomeworkPage = ({ childId }) => {
  const { state } = useLiffContext();
  const selectedChildId = Number(childId || state.activeChildId);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getChildHomework(selectedChildId)
      .then(response => active && setHomeworks(unwrap(response)))
      .catch(apiError => active && setError(apiError.message || 'โหลดการบ้านไม่สำเร็จ'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedChildId]);

  const upload = async (homework, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateHomeworkFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }
    setBusyId(homework.id);
    setError('');
    setSuccess('');
    try {
       const compressedFile = await compressImageFile(file);
       const submissionResponse = await createHomeworkSubmission(selectedChildId, homework.id);
       const submission = unwrap(submissionResponse);
       await uploadHomeworkSubmission(submission.submissionId, compressedFile);
       setHomeworks(previous => previous.map(item => item.id === homework.id
         ? { ...item, submissionId: submission.submissionId, submittedAt: new Date().toISOString() }
         : item));
      setSuccess(`ส่งงาน "${homework.title}" สำเร็จ`);
    } catch (apiError) {
      setError(apiErrorMessage(apiError, 'ส่งการบ้านไม่สำเร็จ'));
    } finally {
      setBusyId(null);
      event.target.value = '';
    }
  };

  return (
    <LiffLayout showBack>
      <div class="space-y-4">
        <header>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-sage-600">Homework</p>
          <h1 class="mt-1 text-2xl font-bold text-ink-900">การบ้านของน้อง</h1>
        </header>
        {error && <div role="alert" class="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {success && <div role="status" class="rounded-2xl bg-sage-50 px-4 py-3 text-sm font-semibold text-sage-700">{success}</div>}
        <div class="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-soft" role="tablist" aria-label="รายการการบ้าน">
          {tabs.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              class={`min-h-11 rounded-xl px-3 text-sm font-bold transition ${tab === item.id ? 'bg-sage-600 text-white' : 'text-ink-500 hover:bg-sage-50'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {loading && <div class="space-y-3" aria-label="กำลังโหลด"><div class="h-32 animate-pulse rounded-2xl bg-sage-100" /><div class="h-32 animate-pulse rounded-2xl bg-sage-100" /></div>}
        {!loading && !filterHomeworkByTab(homeworks, tab).length && <div class="rounded-2xl border border-dashed border-sage-200 bg-white px-4 py-10 text-center text-sm text-ink-500">{tab === 'submitted' ? 'ยังไม่มีการบ้านที่ส่งแล้ว' : 'ไม่มีการบ้านค้างส่ง'}</div>}
        {!loading && filterHomeworkByTab(homeworks, tab).map(homework => (
          <article class="rounded-2xl border border-sage-100 bg-white p-4 shadow-soft" key={homework.id}>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-bold text-ink-900">{homework.title}</p>
                <p class="mt-1 text-sm text-ink-500">{homework.courseName || 'คอร์สเรียน'}</p>
              </div>
              <span class="rounded-full bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-600">ส่งภายใน {formatDate(homework.dueAt)}</span>
            </div>
            {homework.description && <p class="mt-3 text-sm leading-6 text-ink-700">{homework.description}</p>}
            <div class="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-ink-600">
              <span class={`font-bold ${homework.submittedAt ? 'text-sage-700' : 'text-red-700'}`}>สถานะ: {homework.submittedAt ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}</span>
              {homework.score !== null && homework.score !== undefined && <span> · คะแนน {homework.score}</span>}
              {homework.feedback && <p class="mt-1">Feedback: {homework.feedback}</p>}
            </div>
            <label class="mt-4 flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-sage-600 px-3 text-sm font-bold text-white hover:bg-sage-700">
              {busyId === homework.id ? 'กำลังส่ง...' : homework.submittedAt ? 'ส่งงานใหม่อีกครั้ง' : 'เลือกรูปเพื่อส่งงาน'}
              <input class="sr-only" aria-label={`ถ่ายรูปหรือเลือกรูปส่งงาน ${homework.title}`} type="file" accept="image/*" capture="environment" disabled={busyId === homework.id} onChange={event => upload(homework, event)} />
            </label>
            <p class="mt-2 text-center text-xs text-ink-500">รูปจะถูกบีบอัดให้ไม่เกิน 2MB ก่อนส่ง</p>
          </article>
        ))}
      </div>
    </LiffLayout>
  );
};
