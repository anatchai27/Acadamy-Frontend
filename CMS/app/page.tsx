"use client";

import { useMemo, useState } from "react";

const institutes = [
  {
    name: "BrightMind Academy",
    initials: "BM",
    location: "ลาดพร้าว",
    description: "ห้องเรียนกลุ่มเล็กที่ช่วยให้เด็กคิดเป็นระบบและกล้าลองผิดลองถูก",
    rating: 4.9,
    reviews: 248,
    color: "#dbeafe",
    tags: ["ทดลองเรียนฟรี", "กลุ่มเล็ก"],
  },
  {
    name: "SpeakUp Kids",
    initials: "SK",
    location: "อโศก",
    description: "ภาษาอังกฤษและ Public Speaking ผ่านกิจกรรมที่เด็กสนุกและมีส่วนร่วม",
    rating: 4.8,
    reviews: 186,
    color: "#cffafe",
    tags: ["ครูเจ้าของภาษา", "เด็กชอบมาก"],
  },
  {
    name: "Little Makers Lab",
    initials: "LM",
    location: "บางนา",
    description: "Coding, Robotics และทักษะอนาคตสำหรับนักเรียนที่ชอบสร้างสรรค์",
    rating: 4.7,
    reviews: 129,
    color: "#eaf2fb",
    tags: ["ลงมือทำจริง", "มีอุปกรณ์ให้"],
  },
];

const courses = [
  {
    name: "Confident Speaker",
    subject: "ภาษาอังกฤษ",
    category: "english",
    level: "ป.4–ม.ต้น",
    institute: "SpeakUp Kids",
    initials: "SK",
    price: 2890,
    duration: "8 สัปดาห์",
    format: "เรียนสด",
    color: "#cffafe",
    rating: 4.9,
  },
  {
    name: "Young Coder: Game Lab",
    subject: "Coding",
    category: "coding",
    level: "7–12 ปี",
    institute: "Little Makers Lab",
    initials: "LM",
    price: 3490,
    duration: "10 ครั้ง",
    format: "สด + วิดีโอ",
    color: "#dbeafe",
    rating: 4.8,
  },
  {
    name: "Math Thinking",
    subject: "คณิตศาสตร์",
    category: "math",
    level: "ป.4–ป.6",
    institute: "BrightMind Academy",
    initials: "BM",
    price: 1990,
    duration: "12 ครั้ง",
    format: "เรียนสด",
    color: "#eaf2fb",
    rating: 4.7,
  },
];

const needs = [
  { number: "01", title: <>ไม่กล้าพูด<br />ไม่กล้าแสดงออก</>, label: "ทักษะการสื่อสาร" },
  { number: "02", title: <>พื้นฐานยังไม่แน่น<br />ตามเพื่อนไม่ทัน</>, label: "การเรียนรู้" },
  { number: "03", title: <>อยากลองสิ่งใหม่<br />ค้นหาความถนัด</>, label: "ทักษะแห่งอนาคต" },
];

const categories = [
  { id: "all", label: "ทั้งหมด" },
  { id: "english", label: "ภาษาอังกฤษ" },
  { id: "coding", label: "Coding" },
  { id: "math", label: "คณิตศาสตร์" },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [comparedCourses, setComparedCourses] = useState<string[]>([]);
  const [savedInstitutes, setSavedInstitutes] = useState<string[]>([]);

  const visibleCourses = useMemo(() => {
    const search = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesCategory = category === "all" || course.category === category;
      const matchesSearch = `${course.name} ${course.subject} ${course.institute}`
        .toLowerCase()
        .includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [category, query]);

  function toggleCourse(name: string) {
    setComparedCourses((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function searchCourses() {
    document.querySelector("#courses")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="marketplace oasis-marketplace">
      <header className="market-nav">
        <a className="market-brand" href="#top" aria-label="tiwhub หน้าหลัก">
          <img src="/tiwhub-mark.svg" alt="" />
          tiwhub
        </a>
        <nav className="market-nav-links" aria-label="เมนูหลัก">
          <a href="#institutes">สถาบันทั้งหมด</a>
          <a href="#courses">คอร์สเรียน</a>
          <a href="#how-it-works">วิธีใช้งาน</a>
        </nav>
        <a className="market-partner-link" href="#for-institutes">เปิดคอร์สกับเรา <span>↗</span></a>
      </header>

      <main id="top">
        <section className="market-hero">
          <div className="hero-copy">
            <span className="market-eyebrow">THE SMART WAY TO CHOOSE TUTORING</span>
            <h1>ค้นพบที่เรียนที่<br /><em>เหมาะกับลูก</em></h1>
            <p>เปรียบเทียบสถาบัน คอร์สเรียน และรีวิวจากผู้ปกครองจริงในที่เดียว เพื่อการตัดสินใจที่มั่นใจขึ้น</p>
            <form className="market-search" onSubmit={(event) => { event.preventDefault(); searchCourses(); }}>
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาวิชา ชื่อสถาบัน หรือทำเล..."
                aria-label="ค้นหาสถาบันและคอร์ส"
              />
              <button type="submit">ค้นหา</button>
            </form>
            <div className="market-suggestions">
              <span>กำลังเป็นที่นิยม:</span>
              {[
                ["Coding", "Young Coder"],
                ["ภาษาอังกฤษ", "ภาษาอังกฤษ"],
                ["ลาดพร้าว", "BrightMind"],
              ].map(([label, search]) => (
                <button key={label} type="button" onClick={() => setQuery(search)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <img src="/fox.svg" alt="" />
            <span>เริ่มจากสิ่งที่ลูกชอบ<br />แล้วค่อยเลือกที่เรียนที่ใช่</span>
          </div>
        </section>

        <section className="market-trust" aria-label="ข้อมูล tiwhub">
          <div><strong>2,400+</strong><span>สถาบันที่คัดสรร</span></div>
          <div><strong>18,000+</strong><span>คอร์สเรียน</span></div>
          <div><strong>4.8/5</strong><span>คะแนนจากผู้ปกครอง</span></div>
          <p>ข้อมูลโปร่งใส<br />ตัดสินใจได้ด้วยตัวเอง</p>
        </section>

        <section className="market-section" id="how-it-works">
          <div className="market-heading">
            <div><span className="market-eyebrow">START WITH A NEED</span><h2>ลูกกำลังมองหาอะไรอยู่?</h2></div>
            <span>เลือกหัวข้อเพื่อค้นหาสถาบันที่เข้าใจโจทย์นี้</span>
          </div>
          <div className="market-need-grid">
            {needs.map((need, index) => (
              <a className={`market-need-card need-${index + 1}`} href="#institutes" key={need.number}>
                <span>{need.number} / {need.label}</span>
                <h3>{need.title}</h3>
                <b>รวมสถาบันที่ช่วยเรื่องนี้ <i>↗</i></b>
              </a>
            ))}
          </div>
        </section>

        <section className="market-section" id="institutes">
          <div className="market-heading">
            <div><span className="market-eyebrow">TRUSTED BY PARENTS</span><h2>สถาบันแนะนำประจำเดือน</h2></div>
            <a href="#courses">ดูสถาบันทั้งหมด ↗</a>
          </div>
          <div className="market-institute-grid">
            {institutes.map((institute, index) => {
              const saved = savedInstitutes.includes(institute.name);
              return (
                <article className="market-institute-card" key={institute.name}>
                  <div className="market-card-top">
                    <div className="market-logo" style={{ background: institute.color }}>{institute.initials}</div>
                    <button
                      className={`market-save${saved ? " is-saved" : ""}`}
                      type="button"
                      aria-label={`${saved ? "เลิกบันทึก" : "บันทึก"} ${institute.name}`}
                      aria-pressed={saved}
                      onClick={() => setSavedInstitutes((current) => saved ? current.filter((name) => name !== institute.name) : [...current, institute.name])}
                    >{saved ? "♥" : "♡"}</button>
                  </div>
                  <span className="market-kicker">สถาบันแนะนำ</span>
                  <h3>{institute.name}</h3>
                  <p>{institute.description}</p>
                  <div className="market-tags">{institute.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="market-rating"><span>★ <b>{institute.rating.toFixed(1)}</b> <small>({institute.reviews} รีวิว)</small></span><small>⌖ {institute.location}</small></div>
                  <a className="market-card-link" href="#courses">ดูสถาบันและคอร์ส <span>↗</span></a>
                  <span className="card-index">0{index + 1}</span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="market-section" id="courses">
          <div className="market-heading">
            <div><span className="market-eyebrow">COMPARE & CHOOSE</span><h2>คอร์สเรียนยอดฮิตจากหลายสถาบัน</h2></div>
            <div className="market-tabs" aria-label="กรองวิชา">
              {categories.map((item) => <button className={category === item.id ? "active" : ""} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)} key={item.id}>{item.label}</button>)}
            </div>
          </div>
          <div className="market-course-grid">
            {visibleCourses.map((course) => {
              const compared = comparedCourses.includes(course.name);
              return (
                <article className="market-course-card" key={course.name}>
                  <div className="market-course-visual" style={{ background: course.color }}>
                    <span>{course.subject}</span><b>{course.initials}</b><i aria-hidden="true">✳</i>
                  </div>
                  <div className="market-course-content">
                    <div className="market-provider"><span>{course.initials}</span><strong>{course.institute}</strong><small>★ {course.rating.toFixed(1)}</small></div>
                    <h3>{course.name}</h3>
                    <p>{course.level} · {course.duration} · {course.format}</p>
                    <div className="market-price"><strong>฿{course.price.toLocaleString("th-TH")}</strong><span>ต่อคอร์ส</span></div>
                    <button className="market-compare-button" type="button" aria-pressed={compared} onClick={() => toggleCourse(course.name)}>{compared ? "✓ เพิ่มในรายการแล้ว" : "＋ เปรียบเทียบราคาคอร์ส"}</button>
                  </div>
                </article>
              );
            })}
          </div>
          {visibleCourses.length === 0 && <div className="market-empty">ไม่พบคอร์สที่ตรงกับคำค้น ลองเปลี่ยนคำค้นหรือเลือกหมวดวิชาอื่นดูนะ</div>}
        </section>

        <section className="market-compare" aria-live="polite">
          <div><span className="market-eyebrow">MAKE A CONFIDENT CHOICE</span><h2>เปรียบเทียบก่อนตัดสินใจ</h2><p>บันทึกคอร์สที่สนใจ แล้วดูราคา รูปแบบการเรียน และรีวิวเทียบกันได้ในมุมมองเดียว</p></div>
          <div className="market-compare-list">
            {comparedCourses.length ? comparedCourses.map((name) => {
              const course = courses.find((item) => item.name === name);
              return course ? <span key={name}>{course.institute} · ฿{course.price.toLocaleString("th-TH")}</span> : null;
            }) : <span>ยังไม่มีคอร์สที่เลือกเปรียบเทียบ</span>}
          </div>
          <a className={`market-compare-action${comparedCourses.length ? " ready" : ""}`} href="#courses">เปรียบเทียบ {comparedCourses.length} คอร์ส <span>→</span></a>
        </section>

        <section className="market-partner" id="for-institutes">
          <div className="partner-copy">
            <span className="market-eyebrow">FOR EDUCATION PARTNERS</span>
            <h2>มีคอร์สที่อยากให้<br /><em>เด็ก ๆ ได้ค้นพบ?</em></h2>
            <p>เข้าร่วม tiwhub เพื่อให้ผู้ปกครองค้นพบสถาบันของคุณได้ง่ายขึ้น จัดการคอร์สจากที่เดียว และเติบโตไปพร้อมกับครอบครัวที่ใช่</p>
            <a href="mailto:partners@acadamy.co?subject=สมัครเป็นพาร์ทเนอร์%20tiwhub">สมัครเป็นพาร์ทเนอร์ <span>→</span></a>
          </div>
          <div className="market-benefits">
            <div><b>01</b><strong>เข้าถึงผู้ปกครองที่กำลังค้นหา</strong><span>แสดงสถาบันในผลค้นหาและหมวดวิชาที่ตรงกลุ่ม</span></div>
            <div><b>02</b><strong>โปรไฟล์และคอร์สที่เป็นของคุณ</strong><span>เล่าจุดเด่น ราคา และรูปแบบการสอนได้ชัดเจน</span></div>
            <div><b>03</b><strong>ข้อมูลช่วยให้เติบโต</strong><span>ดูความสนใจและ lead เพื่อวางแผนคอร์สได้ดีขึ้น</span></div>
          </div>
        </section>
      </main>

      <footer className="market-footer">
        <a className="footer-brand" href="#top"><img src="/tiwhub-mark.svg" alt="" />tiwhub</a>
        <span>ศูนย์กลางค้นหาและเปรียบเทียบสถาบันเรียนพิเศษสำหรับเด็ก</span>
        <span>© 2026 tiwhub</span>
      </footer>
    </div>
  );
}
