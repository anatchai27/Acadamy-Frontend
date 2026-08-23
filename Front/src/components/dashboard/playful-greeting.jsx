import { useState } from 'preact/hooks';
import { useDesignTheme } from '../../hooks/useDesignTheme';
const greetings = ['ยินดีต้อนรับกลับมา! วันนี้คุณดูเหนื่อยนะ แอบอู้งานไปกินกาแฟหน่อยไหม? ☕', 'อ้าว! กลับมาแล้วเหรอ? Admin คนเก่งของเรา 😎', 'ระบบพร้อมแล้ว! คุณก็คงพร้อมแล้วใช่ไหม?', 'วันนี้อากาศดี เหมาะแก่การจัดการนักเรียนเป็นอย่างยิ่ง 🌤️', 'สวัสดี! TiwHub ดีใจที่ได้เห็นคุณอีกครั้ง 🙌', 'TIP: ถ้าเหนื่อย ให้กด \'สแกน QR\' แล้วยืดเส้นยืดสาย', 'Admin คนนี้ทำอะไรเก่งไปหมดเลย!', 'วันนี้มีอะไรให้ช่วยจัดการบ้าง? บอก TiwHub มาได้เลย!'];
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
  return <div class={isNeo ? 'neo-card bg-[#FFEAA7] p-5 mb-8' : 'bg-gradient-to-r from-oasis-primary/5 to-oasis-accent/5 border border-oasis-primary/10 rounded-2xl p-5 mb-8'}>
      <h2 class={'text-xl font-bold tracking-tight ' + (isNeo ? 'text-black' : 'text-oasis-heading')}>
        {timeGreeting}{userName ? `, ${userName}` : ''}! 👋
      </h2>
      <p class={'text-sm mt-1 ' + (isNeo ? 'text-black/70' : 'text-oasis-body')}>{greeting}</p>
    </div>;
};