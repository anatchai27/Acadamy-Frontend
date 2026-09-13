import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { getChildHomework, createHomeworkSubmission, uploadHomeworkSubmission } from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';

const unwrap = response => response?.data?.data || response?.data || [];
const formatDate = value => value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(value)) : '-';

export const HomeworkPage = ({ childId }) => {
  const { state } = useLiffContext();
  const selectedChildId = Number(childId || state.activeChildId);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setBusyId(homework.id);
    setError('');
    setSuccess('');
    try {
      const submissionResponse = await createHomeworkSubmission(selectedChildId, homework.id);
      const submission = unwrap(submissionResponse);
      await uploadHomeworkSubmission(submission.submissionId, file);
      setSuccess(`ส่งงาน "${homework.title}" สำเร็จ`);
    } catch (apiError) {
      setError(apiError.message || 'ส่งการบ้านไม่สำเร็จ');
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
        {loading && <div class="space-y-3" aria-label="กำลังโหลด"><div class="h-32 animate-pulse rounded-2xl bg-sage-100" /><div class="h-32 animate-pulse rounded-2xl bg-sage-100" /></div>}
        {!loading && !homeworks.length && <div class="rounded-2xl border border-dashed border-sage-200 bg-white px-4 py-10 text-center text-sm text-ink-500">ยังไม่มีการบ้าน</div>}
        {!loading && homeworks.map(homework => (
          <article class="rounded-2xl border border-sage-100 bg-white p-4 shadow-soft" key={homework.id}>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-bold text-ink-900">{homework.title}</p>
                <p class="mt-1 text-sm text-ink-500">{homework.courseName || 'คอร์สเรียน'}</p>
              </div>
              <span class="rounded-full bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-600">ส่งภายใน {formatDate(homework.dueAt)}</span>
            </div>
            {homework.description && <p class="mt-3 text-sm leading-6 text-ink-700">{homework.description}</p>}
            <label class="mt-4 flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-sage-600 px-3 text-sm font-bold text-white hover:bg-sage-700">
              {busyId === homework.id ? 'กำลังส่ง...' : 'เลือกรูปเพื่อส่งงาน'}
              <input class="sr-only" type="file" accept="image/*" disabled={busyId === homework.id} onChange={event => upload(homework, event)} />
            </label>
          </article>
        ))}
      </div>
    </LiffLayout>
  );
};
