import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../../hooks';
import { FoxSticker } from '../ui/fox-sticker';
import { HiOutlineArrowRight } from 'react-icons/hi2';
const greetings = {
  th: ['ตรวจสอบภาพรวมและรายการที่ต้องดำเนินการได้จากหน้านี้', 'ข้อมูลล่าสุดของสถาบันพร้อมให้คุณตรวจสอบแล้ว', 'เริ่มต้นจัดการการเรียนและข้อมูลนักเรียนได้จากเมนูด้านข้าง', 'ติดตามการเข้าเรียนและคำร้องที่รอพิจารณาได้ในที่เดียว', 'เลือกงานที่ต้องการทำ แล้วระบบจะแสดงข้อมูลที่เกี่ยวข้องให้', 'บันทึกข้อมูลให้เป็นปัจจุบัน เพื่อให้ทีมทำงานต่อได้สะดวก'],
  en: ['Review today’s overview and the items that need attention here.', 'Your institute’s latest information is ready to review.', 'Start managing classes and student records from the menu.', 'Keep track of attendance and requests in one place.', 'Choose a task to open the information you need.', 'Keep records up to date so your team can continue smoothly.'],
};
const getGreetingForToday = language => {
  try {
    const day = new Date().toDateString();
    const storageKey = `th_greeting_${language}`;
    const stored = localStorage.getItem(`${storageKey}_day`);
    const storedIdx = Number(localStorage.getItem(`${storageKey}_idx`));
    if (stored === day && Number.isInteger(storedIdx) && storedIdx >= 0 && storedIdx < greetings[language].length) {
      return greetings[language][storedIdx];
    }
    const idx = Math.floor(Math.random() * greetings[language].length);
    localStorage.setItem(`${storageKey}_day`, day);
    localStorage.setItem(`${storageKey}_idx`, String(idx));
    return greetings[language][idx];
  } catch {
    return greetings[language][0];
  }
};
export const PlayfulGreeting = ({
  userName,
  showPriorityLink = false,
}) => {
  const { currentLanguage, t } = useTranslation();
  const [greeting, setGreeting] = useState(() => getGreetingForToday(currentLanguage));
  useEffect(() => setGreeting(getGreetingForToday(currentLanguage)), [currentLanguage]);
  const hour = new Date().getHours();
  const timeGreeting = currentLanguage === 'th'
    ? hour < 12 ? 'สวัสดีตอนเช้า' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'
    : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return <div id="dashboard-greeting" class="dashboard-greeting mb-6 rounded-2xl p-5 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="dashboard-greeting-kicker">{t('dashboard.overview.title')}</p>
          <h2 class="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            {timeGreeting}{userName ? `, ${userName}` : ''}!
          </h2>
          <p class="mt-1 text-sm">{greeting}</p>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          {showPriorityLink && <a class="dashboard-greeting-action inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600" href="#dashboard-pending-actions">{t('dashboard.operations.openPendingQueue')}<HiOutlineArrowRight class="h-4 w-4" aria-hidden="true" /></a>}
          <FoxSticker action="hello" compact className="dashboard-greeting-mascot" />
        </div>
      </div>
    </div>;
};
