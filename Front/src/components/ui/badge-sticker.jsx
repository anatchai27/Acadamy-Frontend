import { useState, useEffect, useCallback } from 'preact/hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';

const BADGE_DATA = {
  first_login:    { emoji: '🏅', label: 'First Login', desc: 'เข้าสู่ระบบครั้งแรก' },
  approve_10:    { emoji: '🐶', label: 'Approval Master', desc: 'อนุมัติครบ 10 รายการ' },
  attendance_50: { emoji: '📋', label: 'Attendance Pro', desc: 'เช็คชื่อครบ 50 คน' },
  create_course: { emoji: '📚', label: 'Course Creator', desc: 'สร้างคอร์สแรก' },
  all_pages:     { emoji: '🗺️', label: 'Explorer', desc: 'เปิดครบทุกหน้า' },
};

const STORAGE_KEY = 'th_badges';

function getStoredBadges() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function storeBadges(badges) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(badges));
}

export function unlockBadge(id) {
  const badges = getStoredBadges();
  if (!badges.includes(id) && BADGE_DATA[id]) {
    badges.push(id);
    storeBadges(badges);
    window.dispatchEvent(new CustomEvent('th-badge-unlock', { detail: { id } }));
  }
}

export function useBadges() {
  const [badges, setBadges] = useState(getStoredBadges);
  const [justUnlocked, setJustUnlocked] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setBadges(getStoredBadges());
      setJustUnlocked(e.detail.id);
      setTimeout(() => setJustUnlocked(null), 3000);
    };
    window.addEventListener('th-badge-unlock', handler);
    return () => window.removeEventListener('th-badge-unlock', handler);
  }, []);

  return { badges, justUnlocked, allBadges: BADGE_DATA };
}

export function BadgeSticker() {
  const { badges, justUnlocked, allBadges } = useBadges();
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  if (!justUnlocked || !allBadges[justUnlocked]) return null;

  const badge = allBadges[justUnlocked];

  return (
    <div
      role="status"
      aria-live="polite"
      class={'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 ' + (isNeo ? 'bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_#000]' : 'bg-white rounded-2xl border border-zinc-200/80 shadow-lg') + ' animate-sticker-pop'}
    >
      <span class="text-2xl">{badge.emoji}</span>
      <div>
        <p class="text-sm font-bold text-black">{badge.label}</p>
        <p class="text-xs text-zinc-600">{badge.desc}</p>
      </div>
    </div>
  );
}