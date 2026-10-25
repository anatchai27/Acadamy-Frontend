import { useState } from 'preact/hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
const greetings = ['ตรวจสอบภาพรวมและรายการที่ต้องดำเนินการได้จากหน้านี้', 'ข้อมูลล่าสุดของสถาบันพร้อมให้คุณตรวจสอบแล้ว', 'เริ่มต้นจัดการการเรียนและข้อมูลนักเรียนได้จากเมนูด้านข้าง', 'ติดตามการเข้าเรียนและคำร้องที่รอพิจารณาได้ในที่เดียว', 'เลือกงานที่ต้องการทำ แล้วระบบจะแสดงข้อมูลที่เกี่ยวข้องให้', 'บันทึกข้อมูลให้เป็นปัจจุบัน เพื่อให้ทีมทำงานต่อได้สะดวก'];
const getGreetingForToday = () => {
  try {
    const day = new Date().toDateString();
    const stored = localStorage.getItem('th_greeting_day');
    const storedIdx = localStorage.getItem('th_greeting_idx');
    stored === day && storedIdx !== null ? (() => {
      return greetings[Number(storedIdx)];
    })() : () => {};
    const idx = Math.floor(Math.random() * greetings.length);
    localStorage.setItem('th_greeting_day', day);
    localStorage.setItem('th_greeting_idx', String(idx));
    return greetings[idx];
  } catch {
    return greetings[0];
  }
};
export const PlayfulGreeting = ({
  userName
}) => {
  const [greeting] = useState(getGreetingForToday);
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'สวัสดีตอนเช้า' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  return <div id="dashboard-greeting" class={isNeo ? 'neo-card bg-oasis-surface-hover p-5 mb-8' : 'border border-oasis-border rounded-2xl bg-oasis-surface-hover p-5 mb-8'}>
      <h2 class={'text-xl font-bold tracking-tight ' + (isNeo ? 'text-black' : 'text-oasis-heading')}>
        {timeGreeting}{userName ? `, ${userName}` : ''}! 👋
      </h2>
      <p class={'text-sm mt-1 ' + (isNeo ? 'text-black/70' : 'text-oasis-body')}>{greeting}</p>
    </div>;
};
