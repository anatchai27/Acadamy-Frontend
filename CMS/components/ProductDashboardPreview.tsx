"use client";

import { useState } from "react";

type ViewKey = "overview" | "students" | "finance" | "courses";

const views: { id: ViewKey; label: string }[] = [
  { id: "overview", label: "ภาพรวม" },
  { id: "students", label: "นักเรียน" },
  { id: "finance", label: "การเงิน" },
  { id: "courses", label: "คอร์สและครู" },
];

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

function OverviewView() {
  return (
    <div className="product-demo-content">
      <div className="demo-title-row">
        <div><p className="demo-overline">วันจันทร์ · 12 ตุลาคม</p><h3>ภาพรวมสถาบัน</h3></div>
        <button className="demo-date-button" type="button">วันนี้⌄</button>
      </div>
      <div className="demo-stat-grid">
        <div className="demo-stat"><span>นักเรียน</span><strong>128</strong><small>ข้อมูลในระบบ</small></div>
        <div className="demo-stat"><span>มาเรียนวันนี้</span><strong>24 <i>/ 28</i></strong><small><b className="status-dot green-dot" /> เช็กชื่อแล้ว</small></div>
        <div className="demo-stat"><span>รอตรวจการชำระ</span><strong>3</strong><small><b className="status-dot amber-dot" /> มีสลิปใหม่</small></div>
      </div>
      <div className="demo-bottom-grid">
        <div className="demo-schedule">
          <div className="demo-section-heading"><strong>ตารางสอนวันนี้</strong><span>ดูทั้งหมด →</span></div>
          <div className="demo-schedule-row"><time>10:00</time><span className="schedule-color blue-schedule" /><div><b>คณิตคิดเป็น · ป.5</b><small>ครูมีนา · ห้อง 2</small></div></div>
          <div className="demo-schedule-row"><time>13:30</time><span className="schedule-color cyan-schedule" /><div><b>ภาษาอังกฤษพื้นฐาน</b><small>ครูต้น · ห้อง 1</small></div></div>
        </div>
        <div className="demo-todo"><div className="demo-section-heading"><strong>เรื่องที่ต้องดู</strong></div><p><span className="todo-count">3</span> สลิปรอการตรวจสอบ</p><p><span className="todo-count muted-count">2</span> คำร้องรอพิจารณา</p></div>
      </div>
    </div>
  );
}

function StudentsView() {
  return (
    <div className="product-demo-content">
      <div className="demo-title-row"><div><p className="demo-overline">ข้อมูลนักเรียนและครอบครัว</p><h3>นักเรียน</h3></div><button className="demo-action-button" type="button">＋ เพิ่มนักเรียน</button></div>
      <div className="demo-search">⌕ <span>ค้นหาชื่อนักเรียนหรือผู้ปกครอง</span></div>
      <div className="demo-table" role="table" aria-label="ตัวอย่างรายชื่อนักเรียน">
        <div className="demo-table-row demo-table-head" role="row"><span>นักเรียน</span><span>ระดับชั้น</span><span>ผู้ปกครอง</span><span>คอร์สที่เรียน</span></div>
        <div className="demo-table-row" role="row"><span className="demo-person"><b className="person-avatar avatar-blue">น</b><b>น้องนับดาว</b></span><span>ป.5</span><span>คุณแม่อร</span><span>2 คอร์ส</span></div>
        <div className="demo-table-row" role="row"><span className="demo-person"><b className="person-avatar avatar-cyan">ภ</b><b>น้องภูผา</b></span><span>ป.6</span><span>คุณพ่อภพ</span><span>1 คอร์ส</span></div>
        <div className="demo-table-row" role="row"><span className="demo-person"><b className="person-avatar avatar-lilac">พ</b><b>น้องพิมพ์ใจ</b></span><span>ม.1</span><span>คุณแม่ฝน</span><span>3 คอร์ส</span></div>
      </div>
      <p className="demo-footnote">ตัวอย่างข้อมูลจำลอง · เพิ่มข้อมูลผู้ปกครองและผู้รับนักเรียนได้ในโปรไฟล์</p>
    </div>
  );
}

function FinanceView() {
  return (
    <div className="product-demo-content">
      <div className="demo-title-row"><div><p className="demo-overline">บันทึกรับชำระและตรวจหลักฐาน</p><h3>การเงิน</h3></div><button className="demo-action-button" type="button">＋ บันทึกรับเงิน</button></div>
      <div className="finance-summary"><div><span>รายรับวันนี้</span><strong>฿8,500</strong></div><div><span>รายการรอตรวจ</span><strong className="amber-text">3 รายการ</strong></div></div>
      <div className="demo-payment-list">
        <div className="payment-row"><span className="payment-icon cash-icon">฿</span><div><b>น้องนับดาว · คณิตคิดเป็น</b><small>โอนเงิน · วันนี้ 09:42</small></div><strong>฿2,500</strong><span className="payment-status paid-status">รับชำระแล้ว</span></div>
        <div className="payment-row"><span className="payment-icon transfer-icon">↗</span><div><b>น้องภูผา · ภาษาอังกฤษ</b><small>แนบสลิป · วันนี้ 09:18</small></div><strong>฿3,000</strong><span className="payment-status review-status">รอตรวจสลิป</span></div>
        <div className="payment-row"><span className="payment-icon cash-icon">฿</span><div><b>น้องพิมพ์ใจ · วิทยาศาสตร์</b><small>เงินสด · เมื่อวาน</small></div><strong>฿3,000</strong><span className="payment-status paid-status">รับชำระแล้ว</span></div>
      </div>
      <p className="demo-footnote">ข้อมูลตัวอย่างจำลอง · บันทึกเงินสด/โอน และตรวจสลิปที่ผู้ปกครองส่งมา</p>
    </div>
  );
}

function CoursesView() {
  return (
    <div className="product-demo-content">
      <div className="demo-title-row"><div><p className="demo-overline">คอร์ส ผู้สอน และตารางเรียน</p><h3>คอร์สและครูผู้สอน</h3></div><button className="demo-action-button" type="button">＋ เพิ่มคอร์ส</button></div>
      <div className="demo-course-list">
        <div className="demo-course-row"><span className="course-mark math-mark">∠</span><div><b>คณิตคิดเป็น · กลุ่ม</b><small>ครูมีนา · จันทร์ 10:00 · ห้อง 2</small></div><span className="course-student-count">8 คน</span></div>
        <div className="demo-course-row"><span className="course-mark language-mark">文</span><div><b>ภาษาอังกฤษพื้นฐาน · กลุ่ม</b><small>ครูต้น · จันทร์ 13:30 · ห้อง 1</small></div><span className="course-student-count">6 คน</span></div>
        <div className="demo-course-row"><span className="course-mark science-mark">⚗</span><div><b>วิทยาศาสตร์ทดลอง · กลุ่ม</b><small>ครูแพร · อังคาร 15:00 · ห้องทดลอง</small></div><span className="course-student-count">5 คน</span></div>
      </div>
      <p className="demo-footnote">ข้อมูลตัวอย่างจำลอง · จัดคอร์ส ผู้สอน รอบเรียน และห้องเรียนไว้ด้วยกัน</p>
    </div>
  );
}

export default function ProductDashboardPreview() {
  const [activeView, setActiveView] = useState<ViewKey>("overview");

  return (
    <div className="product-demo" id="product-preview">
      <div className="demo-window-bar"><span /><span /><span /><p>ตัวอย่างหน้าระบบ · ข้อมูลจำลอง</p></div>
      <div className="demo-app-shell">
        <aside className="demo-sidebar" aria-label="ตัวอย่างเมนูระบบ">
          <div className="demo-brand"><span className="demo-brand-mark">t</span><b>tiwhub</b></div>
          <small className="sidebar-group-label">จัดการสถาบัน</small>
          <nav className="demo-nav" aria-label="เมนูตัวอย่าง">
            {views.map((view) => (
              <button className={activeView === view.id ? "demo-nav-item active" : "demo-nav-item"} key={view.id} type="button" aria-pressed={activeView === view.id} onClick={() => setActiveView(view.id)}>
                <span className={`nav-glyph glyph-${view.id}`}><DemoNavIcon view={view.id} /></span>{view.label}
              </button>
            ))}
          </nav>
          <div className="demo-sidebar-bottom"><span className="mini-avatar">ส</span><span><b>สถาบันตัวอย่าง</b><small>ผู้ดูแลระบบ</small></span><span className="sidebar-more">···</span></div>
        </aside>
        <div className="demo-main">
          <div className="demo-topbar"><span className="demo-crumb">สถาบันตัวอย่าง <b>/</b> {views.find((view) => view.id === activeView)?.label}</span><div className="demo-top-actions"><span className="demo-bell" aria-label="การแจ้งเตือน">♧<i /></span><span className="mini-avatar">ส</span></div></div>
          {activeView === "overview" && <OverviewView />}
          {activeView === "students" && <StudentsView />}
          {activeView === "finance" && <FinanceView />}
          {activeView === "courses" && <CoursesView />}
        </div>
      </div>
    </div>
  );
}
