import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { getChildProgress, getChildScores } from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';

const unwrap = response => response?.data?.data || response?.data || [];
export const getScoreValue = score => Math.max(0, Math.min(5, Number(score) || 0));

export const buildRadarPoints = (scores, radius = 78, center = 120) => scores.map((score, index) => {
  const angle = (Math.PI * 2 * index / scores.length) - (Math.PI / 2);
  const valueRadius = radius * (getScoreValue(score.score) / 5);
  return `${center + Math.cos(angle) * valueRadius},${center + Math.sin(angle) * valueRadius}`;
}).join(' ');

const buildAxisPoints = (count, radius, center = 120) => Array.from({ length: count }, (_, index) => {
  const angle = (Math.PI * 2 * index / count) - (Math.PI / 2);
  return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
}).join(' ');

const RadarChart = ({ scores }) => {
  const axisPoints = buildAxisPoints(scores.length, 78);
  const gridPoints = buildAxisPoints(scores.length, 39);
  return (
    <div class="overflow-x-auto">
      <svg class="mx-auto h-64 w-full min-w-[280px] max-w-sm" viewBox="0 0 240 240" role="img" aria-label="กราฟพัฒนาการรายหัวข้อ">
        <polygon points={axisPoints} fill="#eef2ff" stroke="#c7d2fe" stroke-width="1" />
        <polygon points={gridPoints} fill="none" stroke="#dbeafe" stroke-width="1" />
        {scores.map((score, index) => {
          const angle = (Math.PI * 2 * index / scores.length) - (Math.PI / 2);
          const x = 120 + Math.cos(angle) * 78;
          const y = 120 + Math.sin(angle) * 78;
          return <line key={`axis-${score.topicName}-${index}`} x1="120" y1="120" x2={x} y2={y} stroke="#dbeafe" stroke-width="1" />;
        })}
        <polygon points={buildRadarPoints(scores)} fill="#6366f1" fill-opacity="0.35" stroke="#4f46e5" stroke-width="2" />
        {scores.map((score, index) => {
          const angle = (Math.PI * 2 * index / scores.length) - (Math.PI / 2);
          const x = 120 + Math.cos(angle) * 94;
          const y = 120 + Math.sin(angle) * 94;
          return <text key={`label-${score.topicName}-${index}`} x={x} y={y} text-anchor="middle" dominant-baseline="middle" class="fill-ink-700 text-[8px] font-semibold">{score.topicName}</text>;
        })}
      </svg>
    </div>
  );
};

export const ScoresPage = ({ childId }) => {
  const { state } = useLiffContext();
  const selectedChildId = Number(childId || state.activeChildId);
  const [scores, setScores] = useState([]);
  const [progress, setProgress] = useState({ currentStreak: 0, longestStreak: 0, badges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    if (!Number.isFinite(selectedChildId) || selectedChildId <= 0) {
      setScores([]);
      setProgress({ currentStreak: 0, longestStreak: 0, badges: [] });
      setError('ไม่พบข้อมูลนักเรียนที่เลือก');
      setLoading(false);
      return () => { active = false; };
    }
    Promise.all([getChildScores(selectedChildId), getChildProgress(selectedChildId)])
      .then(([scoreResponse, progressResponse]) => {
        if (!active) return;
        setScores(unwrap(scoreResponse));
        setProgress(unwrap(progressResponse) || { currentStreak: 0, longestStreak: 0, badges: [] });
      })
      .catch(apiError => active && setError(apiError.message || 'โหลดข้อมูลพัฒนาการไม่สำเร็จ'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedChildId]);

  const feedback = scores.filter(score => score.note);

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
          <>
          <section class="rounded-2xl border border-indigo-100 bg-white p-5 shadow-soft">
            <h2 class="mb-2 font-bold text-ink-900">กราฟพัฒนาการ</h2>
            <p class="mb-2 text-xs text-ink-500">คะแนนจาก 0 ถึง 5 ตามหัวข้อทักษะ</p>
            <RadarChart scores={scores} />
            <h2 class="mb-5 mt-2 font-bold text-ink-900">คะแนนรายหัวข้อ</h2>
            <div class="space-y-4">
              {scores.map((score, index) => {
                const value = getScoreValue(score.score);
                return <div key={`${score.topicName}-${index}`}>
                  <div class="mb-1 flex justify-between gap-3 text-sm"><span class="font-semibold text-ink-800">{score.topicName}</span><span class="font-bold text-indigo-600">{value}/5</span></div>
                  <div class="h-3 overflow-hidden rounded-full bg-indigo-50"><div class="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${value * 20}%` }} /></div>
                  {score.note && <p class="mt-1 text-xs text-ink-500">{score.note}</p>}
                </div>;
              })}
            </div>
          </section>
          {feedback.length > 0 && (
            <section class="rounded-2xl border border-sage-100 bg-white p-5 shadow-soft">
              <h2 class="font-bold text-ink-900">Feedback จากครู</h2>
              <div class="mt-3 space-y-3">
                {feedback.map((score, index) => (
                  <article key={`${score.topicName}-feedback-${index}`} class="rounded-xl bg-sage-50 p-3">
                    <p class="text-sm font-bold text-sage-700">{score.topicName}</p>
                    <p class="mt-1 text-sm leading-6 text-ink-700">{score.note}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
          </>
        )}
        {!loading && (
          <section class="rounded-2xl border border-gold-100 bg-gold-50 p-5 shadow-soft">
            <div class="flex items-end justify-between gap-4">
              <div><p class="text-xs font-semibold uppercase tracking-[0.16em] text-gold-600">Streak</p><p class="mt-1 text-3xl font-bold text-ink-900">{progress.currentStreak || 0} วัน</p><p class="text-xs text-ink-500">ต่อเนื่องปัจจุบัน · สูงสุด {progress.longestStreak || 0} วัน</p></div>
              <span class="text-3xl" aria-hidden="true">★</span>
            </div>
            <div class="mt-4 border-t border-gold-200 pt-4"><p class="text-sm font-bold text-ink-900">Badge ที่ได้รับ</p>{progress.badges?.length ? <div class="mt-2 flex flex-wrap gap-2">{progress.badges.map(badge => <span key={`${badge.id}-${badge.badgeKey}`} class="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gold-700">{badge.name || badge.badgeKey}</span>)}</div> : <p class="mt-1 text-sm text-ink-500">ยังไม่มี Badge</p>}</div>
          </section>
        )}
      </div>
    </LiffLayout>
  );
};
