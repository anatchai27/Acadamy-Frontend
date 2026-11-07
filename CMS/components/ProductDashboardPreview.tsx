"use client";

import { useState } from "react";
import type { Locale } from "../lib/i18n";

type ViewKey = "overview" | "students" | "finance" | "courses";

const demoMessages = {
  th: {
    views: { overview: "ภาพรวม", students: "นักเรียน", finance: "การเงิน", courses: "คอร์สและครู" },
    menuLabel: "เมนูตัวอย่าง",
    sample: "ตัวอย่างหน้าระบบ · ข้อมูลจำลอง",
    centerManagement: "จัดการสถาบัน",
    sampleCenter: "สถาบันตัวอย่าง",
    administrator: "ผู้ดูแลระบบ",
    notification: "การแจ้งเตือน",
    liveToday: "ข้อมูลตัวอย่าง",
    date: "วันจันทร์ · 12 ตุลาคม",
    overviewTitle: "ภาพรวมสถาบัน",
    today: "วันนี้⌄",
    studentCount: "นักเรียน",
    inSystem: "ข้อมูลในระบบ",
    attendingToday: "มาเรียนวันนี้",
    checkedIn: "เช็กชื่อแล้ว",
    attendancePercent: "มาเรียน 85%",
    paymentReview: "รอตรวจการชำระ",
    newSlips: "มีสลิปใหม่",
    todaySchedule: "ตารางสอนวันนี้",
    seeAll: "ดูทั้งหมด →",
    mathCourse: "คณิตคิดเป็น · ป.5",
    englishCourse: "ภาษาอังกฤษพื้นฐาน",
    teacherMeena: "ครูมีนา · ห้อง 2",
    teacherTon: "ครูต้น · ห้อง 1",
    needsAttention: "เรื่องที่ต้องดู",
    slipsToReview: "สลิปรอการตรวจสอบ",
    requestsToReview: "คำร้องรอพิจารณา",
    manage: "จัดการ",
    room201: "ครูมีนา · ห้อง 201",
    room104: "ครูดิน · ห้อง 104",
    studentFamilyInfo: "ข้อมูลนักเรียนและครอบครัว",
    addStudent: "＋ เพิ่มนักเรียน",
    searchStudents: "ค้นหาชื่อนักเรียนหรือผู้ปกครอง",
    studentTable: "ตัวอย่างรายชื่อนักเรียน",
    student: "นักเรียน",
    grade: "ระดับชั้น",
    parent: "ผู้ปกครอง",
    enrolledCourses: "คอร์สที่เรียน",
    studentNames: ["น้องนับดาว", "น้องภูผา", "น้องพิมพ์ใจ"],
    parentNames: ["คุณแม่อร", "คุณพ่อภพ", "คุณแม่ฝน"],
    coursesCount: ["2 คอร์ส", "1 คอร์ส", "3 คอร์ส"],
    studentFootnote: "ตัวอย่างข้อมูลจำลอง · เพิ่มข้อมูลผู้ปกครองและผู้รับนักเรียนได้ในโปรไฟล์",
    financeSubtitle: "บันทึกรับชำระและตรวจหลักฐาน",
    financeTitle: "การเงิน",
    recordPayment: "＋ บันทึกรับเงิน",
    incomeToday: "รายรับวันนี้",
    pendingReview: "รายการรอตรวจ",
    items: "รายการ",
    transferToday: "โอนเงิน · วันนี้ 09:42",
    slipToday: "แนบสลิป · วันนี้ 09:18",
    cashYesterday: "เงินสด · เมื่อวาน",
    received: "รับชำระแล้ว",
    slipReview: "รอตรวจสลิป",
    financeFootnote: "ข้อมูลตัวอย่างจำลอง · บันทึกเงินสด/โอน และตรวจสลิปที่ผู้ปกครองส่งมา",
    coursesSubtitle: "คอร์ส ผู้สอน และตารางเรียน",
    coursesTitle: "คอร์สและครูผู้สอน",
    addCourse: "＋ เพิ่มคอร์ส",
    group: "กลุ่ม",
    course1: "คณิตคิดเป็น",
    course2: "ภาษาอังกฤษพื้นฐาน",
    course3: "วิทยาศาสตร์ทดลอง",
    courseInfo1: "ครูมีนา · จันทร์ 10:00 · ห้อง 2",
    courseInfo2: "ครูต้น · จันทร์ 13:30 · ห้อง 1",
    courseInfo3: "ครูแพร · อังคาร 15:00 · ห้องทดลอง",
    people: "คน",
    coursesFootnote: "ข้อมูลตัวอย่างจำลอง · จัดคอร์ส ผู้สอน รอบเรียน และห้องเรียนไว้ด้วยกัน",
  },
  en: {
    views: { overview: "Overview", students: "Students", finance: "Payments", courses: "Courses & teachers" },
    sample: "System preview · Sample data",
    centerManagement: "CENTER",
    menuLabel: "Center menu",
    sampleCenter: "Sample center",
    administrator: "Administrator",
    notification: "Notifications",
    liveToday: "Sample data",
    date: "Monday · October 12",
    overviewTitle: "Center overview",
    today: "Today⌄",
    studentCount: "Students",
    inSystem: "In the system",
    attendingToday: "Attending today",
    checkedIn: "Checked in",
    attendancePercent: "85% attendance",
    paymentReview: "Payments to review",
    newSlips: "New slips received",
    todaySchedule: "Today’s schedule",
    seeAll: "View all →",
    mathCourse: "Math in Practice · Grade 5",
    englishCourse: "English Foundations",
    teacherMeena: "Teacher Meena · Room 2",
    teacherTon: "Teacher Ton · Room 1",
    needsAttention: "Needs your attention",
    slipsToReview: "Payment slips to review",
    requestsToReview: "Requests awaiting review",
    manage: "Manage",
    room201: "Teacher Meena · Room 201",
    room104: "Teacher Din · Room 104",
    studentFamilyInfo: "Student and family records",
    addStudent: "＋ Add student",
    searchStudents: "Search students or parents",
    studentTable: "Sample student list",
    student: "Student",
    grade: "Grade",
    parent: "Parent",
    enrolledCourses: "Courses",
    studentNames: ["Nubdao", "Phupha", "Pimjai"],
    parentNames: ["Orn’s mother", "Phop’s father", "Fon’s mother"],
    coursesCount: ["2 courses", "1 course", "3 courses"],
    studentFootnote: "Sample records · Add parent and authorized pickup details to each profile",
    financeSubtitle: "Record payments and review receipts",
    financeTitle: "Payments",
    recordPayment: "＋ Record payment",
    incomeToday: "Income today",
    pendingReview: "Awaiting review",
    items: "items",
    transferToday: "Bank transfer · Today 09:42",
    slipToday: "Slip attached · Today 09:18",
    cashYesterday: "Cash · Yesterday",
    received: "Paid",
    slipReview: "Review slip",
    financeFootnote: "Sample records · Log cash or transfers and review slips sent by parents",
    coursesSubtitle: "Courses, teachers, and schedules",
    coursesTitle: "Courses and teachers",
    addCourse: "＋ Add course",
    group: "Group",
    course1: "Math in Practice",
    course2: "English Foundations",
    course3: "Science Lab",
    courseInfo1: "Teacher Meena · Mon 10:00 · Room 2",
    courseInfo2: "Teacher Ton · Mon 13:30 · Room 1",
    courseInfo3: "Teacher Prae · Tue 15:00 · Lab",
    people: "students",
    coursesFootnote: "Sample records · Keep courses, teachers, class times, and rooms together",
  },
} as const;

function DemoNavIcon({ view }: { view: ViewKey }) {
  if (view === "overview") {
    return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="12" y="3" width="5" height="5" rx="1" /><rect x="3" y="12" width="5" height="5" rx="1" /><rect x="12" y="12" width="5" height="5" rx="1" /></svg>;
  }
  if (view === "students") {
    return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="7" cy="6" r="3" /><path d="M2.5 16v-1.2A4.3 4.3 0 0 1 6.8 10.5h.4a4.3 4.3 0 0 1 4.3 4.3V16H2.5Z" /><path d="M13 3.4a3 3 0 0 1 0 5.3m1 2a4.3 4.3 0 0 1 3.5 4.2V16h-3" /></svg>;
  }
  if (view === "finance") {
    return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2" /><path d="M2.5 8h15m-9 4h3" /><circle cx="14.5" cy="12" r="1" /></svg>;
  }
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 4.5c2.6-.9 5.1-.3 7 1.4v10c-1.9-1.7-4.4-2.3-7-1.4v-10Zm14 0c-2.6-.9-5.1-.3-7 1.4v10c1.9-1.7 4.4-2.3 7-1.4v-10Z" /></svg>;
}

function OverviewView({ locale }: { locale: Locale }) {
  const copy = demoMessages[locale];
  return (
    <div className="product-demo-content">
      <div className="demo-stat-grid template-stat-grid">
        <div className="demo-stat template-attendance-stat"><span>{copy.attendingToday}</span><strong>24 <i>/ 28 {locale === "th" ? "คน" : "students"}</i></strong><small><b className="status-dot green-dot" /> {copy.attendancePercent}</small></div>
        <div className="demo-stat template-payment-stat"><span>{copy.paymentReview}</span><strong>3 <i>{copy.items}</i></strong><small><b className="status-dot amber-dot" /> {copy.newSlips}</small></div>
      </div>
      <div className="demo-schedule template-schedule">
        <div className="demo-section-heading"><strong>{copy.todaySchedule}</strong><span>{copy.seeAll}</span></div>
        <div className="demo-schedule-row"><time>16:30–18:00</time><span className="schedule-color blue-schedule" /><div><b>{copy.mathCourse}</b><small>{copy.room201}</small></div></div>
        <div className="demo-schedule-row"><time>17:00–18:30</time><span className="schedule-color cyan-schedule" /><div><b>{copy.englishCourse}</b><small>{copy.room104}</small></div></div>
      </div>
      <div className="template-alert"><span><b aria-hidden="true">!</b>{copy.requestsToReview} · 2 {copy.items}</span><button type="button">{copy.manage}</button></div>
    </div>
  );
}

function StudentsView({ locale }: { locale: Locale }) {
  const copy = demoMessages[locale];
  const grades = locale === "th" ? ["ป.5", "ป.6", "ม.1"] : ["Grade 5", "Grade 6", "Grade 7"];
  return (
    <div className="product-demo-content">
      <div className="demo-title-row"><div><p className="demo-overline">{copy.studentFamilyInfo}</p><h3>{copy.views.students}</h3></div><button className="demo-action-button" type="button">{copy.addStudent}</button></div>
      <div className="demo-search">⌕ <span>{copy.searchStudents}</span></div>
      <div className="demo-table" role="table" aria-label={copy.studentTable}>
        <div className="demo-table-row demo-table-head" role="row"><span>{copy.student}</span><span>{copy.grade}</span><span>{copy.parent}</span><span>{copy.enrolledCourses}</span></div>
        {copy.studentNames.map((name, index) => (
          <div className="demo-table-row" role="row" key={name}><span className="demo-person"><b className={`person-avatar ${["avatar-blue", "avatar-cyan", "avatar-lilac"][index]}`}>{name[0]}</b><b>{name}</b></span><span>{grades[index]}</span><span>{copy.parentNames[index]}</span><span>{copy.coursesCount[index]}</span></div>
        ))}
      </div>
      <p className="demo-footnote">{copy.studentFootnote}</p>
    </div>
  );
}

function FinanceView({ locale }: { locale: Locale }) {
  const copy = demoMessages[locale];
  return (
    <div className="product-demo-content">
      <div className="demo-title-row"><div><p className="demo-overline">{copy.financeSubtitle}</p><h3>{copy.financeTitle}</h3></div><button className="demo-action-button" type="button">{copy.recordPayment}</button></div>
      <div className="finance-summary"><div><span>{copy.incomeToday}</span><strong>฿8,500</strong></div><div><span>{copy.pendingReview}</span><strong className="amber-text">3 {copy.items}</strong></div></div>
      <div className="demo-payment-list">
        <div className="payment-row"><span className="payment-icon cash-icon">฿</span><div><b>{copy.studentNames[0]} · {copy.course1}</b><small>{copy.transferToday}</small></div><strong>฿2,500</strong><span className="payment-status paid-status">{copy.received}</span></div>
        <div className="payment-row"><span className="payment-icon transfer-icon">↗</span><div><b>{copy.studentNames[1]} · {copy.course2}</b><small>{copy.slipToday}</small></div><strong>฿3,000</strong><span className="payment-status review-status">{copy.slipReview}</span></div>
        <div className="payment-row"><span className="payment-icon cash-icon">฿</span><div><b>{copy.studentNames[2]} · {copy.course3}</b><small>{copy.cashYesterday}</small></div><strong>฿3,000</strong><span className="payment-status paid-status">{copy.received}</span></div>
      </div>
      <p className="demo-footnote">{copy.financeFootnote}</p>
    </div>
  );
}

function CoursesView({ locale }: { locale: Locale }) {
  const copy = demoMessages[locale];
  return (
    <div className="product-demo-content">
      <div className="demo-title-row"><div><p className="demo-overline">{copy.coursesSubtitle}</p><h3>{copy.coursesTitle}</h3></div><button className="demo-action-button" type="button">{copy.addCourse}</button></div>
      <div className="demo-course-list">
        <div className="demo-course-row"><span className="course-mark math-mark">∠</span><div><b>{copy.course1} · {copy.group}</b><small>{copy.courseInfo1}</small></div><span className="course-student-count">8 {copy.people}</span></div>
        <div className="demo-course-row"><span className="course-mark language-mark">文</span><div><b>{copy.course2} · {copy.group}</b><small>{copy.courseInfo2}</small></div><span className="course-student-count">6 {copy.people}</span></div>
        <div className="demo-course-row"><span className="course-mark science-mark">⚗</span><div><b>{copy.course3} · {copy.group}</b><small>{copy.courseInfo3}</small></div><span className="course-student-count">5 {copy.people}</span></div>
      </div>
      <p className="demo-footnote">{copy.coursesFootnote}</p>
    </div>
  );
}

export default function ProductDashboardPreview({ locale }: { locale: Locale }) {
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const copy = demoMessages[locale];
  const views: { id: ViewKey; label: string }[] = Object.entries(copy.views).map(([id, label]) => ({ id: id as ViewKey, label }));

  return (
    <div className="product-demo template-demo" id="product-preview">
      <div className="template-preview-heading">
        <div><h2>{copy.overviewTitle}</h2><p>{copy.sample}</p></div>
        <span className="template-live-badge"><i aria-hidden="true" />{copy.liveToday}</span>
      </div>
      <section className="template-preview-card" aria-label={copy.centerManagement}>
        <div className="template-preview-topbar">
          <div><p>{copy.date}</p><h3>{copy.sampleCenter}</h3></div>
          <span className="template-today-label">{copy.today}</span>
        </div>
        <nav className="demo-tabs" aria-label={copy.menuLabel}>
          {views.map((view) => (
            <button className={activeView === view.id ? "demo-tab active" : "demo-tab"} key={view.id} type="button" aria-pressed={activeView === view.id} onClick={() => setActiveView(view.id)}>
              <span className={`nav-glyph glyph-${view.id}`}><DemoNavIcon view={view.id} /></span>{view.label}
            </button>
          ))}
        </nav>
        <div className="template-preview-content">
          {activeView === "overview" && <OverviewView locale={locale} />}
          {activeView === "students" && <StudentsView locale={locale} />}
          {activeView === "finance" && <FinanceView locale={locale} />}
          {activeView === "courses" && <CoursesView locale={locale} />}
        </div>
      </section>
    </div>
  );
}
