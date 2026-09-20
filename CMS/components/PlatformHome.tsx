"use client";

import { useMemo, useState } from "react";
import { platformContent } from "@/config/content";
import { CourseCard } from "./CourseCard";
import { InstituteCard } from "./InstituteCard";

export function PlatformHome() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("ทั้งหมด");
  const [compare, setCompare] = useState<
    (typeof platformContent.courses)[number][]
  >([]);
  const courses = useMemo(
    () =>
      platformContent.courses.filter(
        (course) =>
          (subject === "ทั้งหมด" || course.subject === subject) &&
          `${course.name} ${course.subject} ${course.institute}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, subject],
  );
  const addCompare = (course: (typeof platformContent.courses)[number]) =>
    setCompare((items) =>
      items.some((item) => item.name === course.name)
        ? items
        : [...items, course],
    );
  return (
    <main className="platform">
      <nav>
        <a className="brand" href="/">
          <span>+</span>acadamy
        </a>
        <div className="nav-links">
          <a href="#institutes">สถาบันทั้งหมด</a>
          <a href="#courses">คอร์สเรียน</a>
          <a href="#how-it-works">วิธีใช้งาน</a>
        </div>
        <a className="partner-link" href="#for-institutes">
          เปิดคอร์สกับเรา ↗
        </a>
      </nav>
      <section className="hero">
        <span className="eyebrow">{platformContent.hero.eyebrow}</span>
        <h1>
          {platformContent.hero.title}
          <br />
          <em>{platformContent.hero.highlight}</em>
        </h1>
        <p>{platformContent.hero.description}</p>
        <div className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาวิชา ชื่อสถาบัน หรือทำเล..."
            aria-label="ค้นหาสถาบันและคอร์ส"
          />
          <button
            onClick={() =>
              document
                .getElementById("courses")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            ค้นหา
          </button>
        </div>
        <div className="suggestions">
          กำลังเป็นที่นิยม:{" "}
          <button onClick={() => setQuery("Coding")}>Coding</button>
          <button onClick={() => setQuery("ภาษาอังกฤษ")}>ภาษาอังกฤษ</button>
          <button onClick={() => setQuery("ลาดพร้าว")}>ลาดพร้าว</button>
        </div>
      </section>
      <section className="trust">
        <div>
          <b>2,400+</b>
          <span>สถาบันที่คัดสรร</span>
        </div>
        <div>
          <b>18,000+</b>
          <span>คอร์สเรียน</span>
        </div>
        <div>
          <b>4.8/5</b>
          <span>คะแนนจากผู้ปกครอง</span>
        </div>
        <p>
          ข้อมูลโปร่งใส
          <br />
          ตัดสินใจได้ด้วยตัวเอง
        </p>
      </section>
      <section className="section" id="how-it-works">
        <div className="heading">
          <div>
            <span className="eyebrow">START WITH A NEED</span>
            <h2>ลูกกำลังมองหาอะไรอยู่?</h2>
          </div>
          <span>เลือกหัวข้อเพื่อค้นหาสถาบันที่เข้าใจโจทย์นี้</span>
        </div>
        <div className="need-grid">
          {platformContent.problems.map((problem) => (
            <a
              className={`need ${problem.tone}`}
              href="#institutes"
              key={problem.id}
            >
              <span>{problem.eyebrow}</span>
              <h3>
                {problem.title.map((line) => (
                  <>
                    {line}
                    <br />
                  </>
                ))}
              </h3>
              <b>{problem.cta} ↗</b>
            </a>
          ))}
        </div>
      </section>
      <section className="section" id="institutes">
        <div className="heading">
          <div>
            <span className="eyebrow">TRUSTED BY PARENTS</span>
            <h2>สถาบันแนะนำประจำเดือน</h2>
          </div>
          <a href="#courses">ดูสถาบันทั้งหมด ↗</a>
        </div>
        <div className="grid">
          {platformContent.institutes.map((institute, index) => (
            <InstituteCard
              key={institute.name}
              institute={institute}
              index={index}
            />
          ))}
        </div>
      </section>
      <section className="section" id="courses">
        <div className="heading">
          <div>
            <span className="eyebrow">COMPARE & CHOOSE</span>
            <h2>คอร์สเรียนยอดฮิตจากหลายสถาบัน</h2>
          </div>
          <div className="tabs">
            {["ทั้งหมด", "ภาษาอังกฤษ", "Coding", "คณิตศาสตร์"].map((item) => (
              <button
                className={subject === item ? "active" : ""}
                onClick={() => setSubject(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="grid">
          {courses.map((course, index) => (
            <CourseCard
              key={course.name}
              course={course}
              index={index}
              onCompare={addCompare}
            />
          ))}
        </div>
      </section>
      <section className="compare">
        <div>
          <span className="eyebrow">MAKE A CONFIDENT CHOICE</span>
          <h2>เปรียบเทียบก่อนตัดสินใจ</h2>
          <p>
            บันทึกคอร์สที่สนใจ แล้วดูราคา รูปแบบการเรียน
            และรีวิวเทียบกันได้ในมุมมองเดียว
          </p>
        </div>
        <div>
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
          เปรียบเทียบ {compare.length || "คอร์ส"} →
        </button>
      </section>
      <section className="partner" id="for-institutes">
        <div>
          <span className="eyebrow">FOR EDUCATION PARTNERS</span>
          <h2>
            มีคอร์สที่อยากให้
            <br />
            <em>เด็ก ๆ ได้ค้นพบ?</em>
          </h2>
          <p>
            เข้าร่วม Acadamy เพื่อให้ผู้ปกครองค้นพบสถาบันของคุณได้ง่ายขึ้น
            จัดการคอร์สจากที่เดียว และเติบโตไปพร้อมกับครอบครัวที่ใช่
          </p>
          <a href="mailto:partners@acadamy.co?subject=เปิดคอร์สกับ Acadamy">
            สมัครเป็นพาร์ทเนอร์ →
          </a>
        </div>
        <div className="benefits">
          <div>
            <b>01</b>
            <strong>เข้าถึงผู้ปกครองที่กำลังค้นหา</strong>
            <span>แสดงสถาบันในผลค้นหาและหมวดวิชาที่ตรงกลุ่ม</span>
          </div>
          <div>
            <b>02</b>
            <strong>โปรไฟล์และคอร์สที่เป็นของคุณ</strong>
            <span>เล่าเรื่องจุดเด่น ราคา และรูปแบบการสอนได้ชัดเจน</span>
          </div>
          <div>
            <b>03</b>
            <strong>ข้อมูลช่วยให้เติบโต</strong>
            <span>ดูความสนใจและ lead เพื่อวางแผนคอร์สได้ดีขึ้น</span>
          </div>
        </div>
      </section>
      <footer>
        <b>
          <span>+</span>acadamy
        </b>
        <span>{platformContent.brand.tagline}</span>
        <span>© 2026 Acadamy Platform</span>
      </footer>
    </main>
  );
}
