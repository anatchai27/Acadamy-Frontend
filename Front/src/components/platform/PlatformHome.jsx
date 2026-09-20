import { useMemo, useState } from 'preact/hooks';
import { platformContent } from '../../config/content';
import { CoursePlatformCard } from './CoursePlatformCard';
import { InstituteCard } from './InstituteCard';
import './platform.css';

export function PlatformHome() {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('ทั้งหมด');
  const [compare, setCompare] = useState([]);
  const courses = useMemo(
    () =>
      platformContent.courses.filter(
        (course) =>
          (subject === 'ทั้งหมด' || course.subject === subject) &&
          `${course.name} ${course.subject} ${course.institute}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, subject],
  );
  const addCompare = (course) =>
    setCompare((items) => (items.some((item) => item.name === course.name) ? items : [...items, course]));
  return (
    <div class="marketplace">
      <nav class="market-nav">
        <a class="market-brand" href="/">
          <span>+</span>
          {platformContent.brand.name}
        </a>
        <div class="market-nav-links">
          <a href="#institutes">สถาบันทั้งหมด</a>
          <a href="#courses">คอร์สเรียน</a>
          <a href="#how-it-works">วิธีใช้งาน</a>
        </div>
        <a class="market-partner-link" href="#for-institutes">
          เปิดคอร์สกับเรา <span>↗</span>
        </a>
      </nav>
      <main>
        <section class="market-hero">
          <span class="market-eyebrow">{platformContent.hero.eyebrow}</span>
          <h1>
            {platformContent.hero.title}
            <br />
            <em>{platformContent.hero.highlight}</em>
          </h1>
          <p>{platformContent.hero.description}</p>
          <div class="market-search">
            <span>⌕</span>
            <input
              value={query}
              onInput={(event) => setQuery(event.currentTarget.value)}
              placeholder="ค้นหาวิชา ชื่อสถาบัน หรือทำเล..."
              aria-label="ค้นหาสถาบันและคอร์ส"
            />
            <button onClick={() => document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth' })}>
              ค้นหา
            </button>
          </div>
          <div class="market-suggestions">
            <span>กำลังเป็นที่นิยม:</span>
            <button onClick={() => setQuery('Coding')}>Coding</button>
            <button onClick={() => setQuery('ภาษาอังกฤษ')}>ภาษาอังกฤษ</button>
            <button onClick={() => setQuery('ลาดพร้าว')}>ลาดพร้าว</button>
          </div>
        </section>
        <section class="market-trust">
          <div>
            <strong>2,400+</strong>
            <span>สถาบันที่คัดสรร</span>
          </div>
          <div>
            <strong>18,000+</strong>
            <span>คอร์สเรียน</span>
          </div>
          <div>
            <strong>4.8/5</strong>
            <span>คะแนนจากผู้ปกครอง</span>
          </div>
          <p>
            ข้อมูลโปร่งใส
            <br />
            ตัดสินใจได้ด้วยตัวเอง
          </p>
        </section>
        <section class="market-section" id="how-it-works">
          <div class="market-heading">
            <div>
              <span class="market-eyebrow">START WITH A NEED</span>
              <h2>ลูกกำลังมองหาอะไรอยู่?</h2>
            </div>
            <span>เลือกหัวข้อเพื่อค้นหาสถาบันที่เข้าใจโจทย์นี้</span>
          </div>
          <div class="market-need-grid">
            {platformContent.problems.map((problem) => (
              <a href="#institutes" class={`market-need-card need-${problem.tone}`} key={problem.id}>
                <span>{problem.eyebrow}</span>
                <h3>
                  {problem.title.split('\n').map((line, index) => (
                    <span key={line}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </h3>
                <b>
                  {problem.cta} <i>↗</i>
                </b>
              </a>
            ))}
          </div>
        </section>
        <section class="market-section" id="institutes">
          <div class="market-heading">
            <div>
              <span class="market-eyebrow">TRUSTED BY PARENTS</span>
              <h2>สถาบันแนะนำประจำเดือน</h2>
            </div>
            <a href="#courses">ดูสถาบันทั้งหมด ↗</a>
          </div>
          <div class="market-institute-grid">
            {platformContent.institutes.map((institute) => (
              <InstituteCard key={institute.name} institute={institute} />
            ))}
          </div>
        </section>
        <section class="market-section" id="courses">
          <div class="market-heading">
            <div>
              <span class="market-eyebrow">COMPARE & CHOOSE</span>
              <h2>คอร์สเรียนยอดฮิตจากหลายสถาบัน</h2>
            </div>
            <div class="market-tabs">
              {['ทั้งหมด', 'ภาษาอังกฤษ', 'Coding', 'คณิตศาสตร์'].map((item) => (
                <button class={subject === item ? 'active' : ''} onClick={() => setSubject(item)} key={item}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div class="market-course-grid">
            {courses.map((course) => (
              <CoursePlatformCard key={course.name} course={course} onCompare={addCompare} />
            ))}
          </div>
          {!courses.length && <p class="market-empty">ไม่พบคอร์สที่ตรงกับคำค้น ลองค้นหาวิชาอื่น</p>}
        </section>
        <section class="market-compare">
          <div>
            <span class="market-eyebrow">MAKE A CONFIDENT CHOICE</span>
            <h2>เปรียบเทียบก่อนตัดสินใจ</h2>
            <p>บันทึกคอร์สที่สนใจ แล้วดูราคา รูปแบบการเรียน และรีวิวเทียบกันได้ในมุมมองเดียว</p>
          </div>
          <div class="market-compare-list">
            {compare.length ? (
              compare.map((course) => (
                <span key={course.name}>
                  {course.institute} · ฿{course.price.toLocaleString()}
                </span>
              ))
            ) : (
              <span>ยังไม่มีคอร์สที่เลือกเปรียบเทียบ</span>
            )}
          </div>
          <button disabled={!compare.length}>
            เปรียบเทียบ {compare.length || 'คอร์ส'} <span>→</span>
          </button>
        </section>
        <section class="market-partner" id="for-institutes">
          <div>
            <span class="market-eyebrow">FOR EDUCATION PARTNERS</span>
            <h2>
              มีคอร์สที่อยากให้
              <br />
              <em>เด็ก ๆ ได้ค้นพบ?</em>
            </h2>
            <p>
              เข้าร่วม Acadamy เพื่อให้ผู้ปกครองค้นพบสถาบันของคุณได้ง่ายขึ้น จัดการคอร์สจากที่เดียว
              และเติบโตไปพร้อมกับครอบครัวที่ใช่
            </p>
            <a href="mailto:partners@acadamy.co?subject=เปิดคอร์สกับ Acadamy">
              สมัครเป็นพาร์ทเนอร์ <span>→</span>
            </a>
          </div>
          <div class="market-benefits">
            <div>
              <b>01</b>
              <strong>เข้าถึงผู้ปกครองที่กำลังค้นหา</strong>
              <span>แสดงสถาบันในผลค้นหาและหมวดวิชาที่ตรงกลุ่ม</span>
            </div>
            <div>
              <b>02</b>
              <strong>โปรไฟล์และคอร์สที่เป็นของคุณ</strong>
              <span>เล่าเรื่องจุดเด่น ราคา รูปแบบการสอน และผลงานได้ชัดเจน</span>
            </div>
            <div>
              <b>03</b>
              <strong>ข้อมูลช่วยให้เติบโต</strong>
              <span>ดูความสนใจและ lead เพื่อวางแผนคอร์สได้ดีขึ้น</span>
            </div>
          </div>
        </section>
      </main>
      <footer class="market-footer">
        <b>
          <span>+</span>acadamy
        </b>
        <span>{platformContent.brand.tagline}</span>
        <span>© 2026 Acadamy Platform</span>
      </footer>
    </div>
  );
}
