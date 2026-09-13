import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { getChildScores } from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';

const unwrap = response => response?.data?.data || response?.data || [];

export const ScoresPage = ({ childId }) => {
  const { state } = useLiffContext();
  const selectedChildId = Number(childId || state.activeChildId);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getChildScores(selectedChildId)
      .then(response => active && setScores(unwrap(response)))
      .catch(apiError => active && setError(apiError.message || 'โหลดคะแนนไม่สำเร็จ'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedChildId]);

  return (
    <LiffLayout showBack>
      <div class="space-y-4">
        <header>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Skill scores</p>
          <h1 class="mt-1 text-2xl font-bold text-ink-900">พัฒนาการของน้อง</h1>
        </header>
        {error && <div role="alert" class="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {loading && <div class="h-64 animate-pulse rounded-2xl bg-indigo-50" aria-label="กำลังโหลด" />}
        {!loading && !scores.length && <div class="rounded-2xl border border-dashed border-indigo-200 bg-white px-4 py-10 text-center text-sm text-ink-500">ยังไม่มีคะแนนทักษะ</div>}
        {!loading && scores.length > 0 && (
          <section class="rounded-2xl border border-indigo-100 bg-white p-5 shadow-soft">
            <h2 class="mb-5 font-bold text-ink-900">คะแนนรายหัวข้อ</h2>
            <div class="space-y-4">
              {scores.map((score, index) => {
                const value = Math.max(0, Math.min(5, Number(score.score) || 0));
                return <div key={`${score.topicName}-${index}`}>
                  <div class="mb-1 flex justify-between gap-3 text-sm"><span class="font-semibold text-ink-800">{score.topicName}</span><span class="font-bold text-indigo-600">{value}/5</span></div>
                  <div class="h-3 overflow-hidden rounded-full bg-indigo-50"><div class="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${value * 20}%` }} /></div>
                  {score.note && <p class="mt-1 text-xs text-ink-500">{score.note}</p>}
                </div>;
              })}
            </div>
          </section>
        )}
      </div>
    </LiffLayout>
  );
};
