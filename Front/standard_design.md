# TiwHub Academy Design System — standard_design.md

> มาตรฐาน UI/UX สำหรับ TiwHub Academy v2
> Bento Grid Playful + Gamified Neobrutalism

---

## 1. Design Tokens (อยู่แล้วใน index.css)

| Token | Tailwind Class | Bento Default | Neobrutalism Override |
|-------|---------------|---------------|----------------------|
| Primary | `bg-oasis-primary` | `#2563eb` | `#ff4500` (ใช้ data-theme) |
| Surface | `bg-white` | `rounded-2xl shadow-sm` | `border-3 border-black shadow-[4px_4px_0px_#000]` |
| Font | `font-sans` | Sarabun 400 | Sarabun 700 (หัวข้อ) |

---

## 2. Bento Grid Playful Layout

### 2.1 Grid Structure

```css
/* Grid 4 คอลัมน์ หกเหลี่ยมผืนผ้า = Bento Box */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

/* Cell ขนาดต่างกัน */
.bento-cell--1x1  { grid-column: span 1; grid-row: span 1; }
.bento-cell--2x1  { grid-column: span 2; grid-row: span 1; }
.bento-cell--1x2  { grid-column: span 1; grid-row: span 2; }
.bento-cell--2x2  { grid-column: span 2; grid-row: span 2; }
.bento-cell--full { grid-column: 1 / -1; }
```

### 2.2 Micro-animations

| Element | Hover Effect | Tailwind Classes |
|---------|-------------|-----------------|
| Bento Cell | ยืด + bounce | `hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-bounce` |
| Stat Card | เอียงเล็กน้อย | `hover:rotate-1 transition-transform duration-200` |
| Button | หดกด | `active:scale-90 transition-transform` |

### 2.3 Playful Copy (Admin Greeting)

Array ข้อความต้อนรับเปลี่ยนทุกครั้งที่โหลดหน้า:

```js
const greetings = [
  "ยินดีต้อนรับกลับมา! วันนี้คุณดูเหนื่อยนะ แอบอู้งานไปกินกาแฟหน่อยไหม?",
  "อ้าว! กลับมาแล้วเหรอ? Admin คนเก่งของเรา",
  "ระบบพร้อมแล้ว! คุณก็คงพร้อมแล้วใช่ไหม? 😎",
  "วันนี้อากาศดี เหมาะแก่การจัดการนักเรียนเป็นอย่างยิ่ง",
  "สวัสดีตอนเช้า/บ่าย/เย็น! TiwHub ดีใจที่ได้เห็นคุณอีกครั้ง",
  "Admin คนนี้ทำอะไรเก่งไปหมดเลยนะครับ/คะ!",
  "TIP: ถ้าเหนื่อย ให้กด 'สแกน QR' แล้วยืดเส้นยืดสาย",
  "วันนี้มีอะไรให้ช่วยจัดการบ้าง? บอก TiwHub มาได้เลย!",
]
```

---

## 3. Gamified Neobrutalism Admin

### 3.1 Visual Signature

```
┌────────────────────────────────────────┐
│  [border-3 border-black]               │
│  [shadow-[4px_4px_0px_#000]]           │
│  [bg-white หรือ bg-[#FFEAA7]]          │
│                                        │
│  ปุ่ม: [border-3 border-black]         │
│        [shadow-[3px_3px_0px_#000]]     │
│        [active:translate-x-[2px]]      │
│        [active:translate-y-[2px]]      │
└────────────────────────────────────────┘
```

### 3.2 Arcade Button Effects

```css
.neobrutalism-btn {
  border: 3px solid #000;
  box-shadow: 4px 4px 0px #000;
  transition: all 0.05s linear;
}
.neobrutalism-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #000;
}
```

### 3.3 Badge / Sticker System

เก็บ achievements ใน localStorage key `th_badges`

| Badge | Trigger | Emoji / Icon |
|-------|---------|-------------|
| `first_login` | เข้าสู่ระบบครั้งแรก | 🏅 |
| `approve_10` | อนุมัติออเดอร์/คำขอ 10 รายการ | 🐶 |
| `attendance_50` | เช็คชื่อครบ 50 คน | 📋 |
| `create_course` | สร้างคอร์สแรก | 📚 |
| `all_pages` | เปิดครบทุก admin page | 🗺️ |

Badge จะแสดงเป็น sticker ที่มุมขวาล่างของหน้าจอ มี animation slide-in + bounce.

---

## 4. Theme Toggle

ใน `admin-layout.jsx` Top Bar Desktop จะมีปุ่ม Toggle 3 สถานะ:

```
[🔲 Bento] [■ Neo] ← Toggle UI
```

เก็บค่าที่ user เลือกใน:
1. `localStorage.setItem('th_design_theme', 'bento' | 'neobrutalism')`
2. State `designTheme` ใน AppContext
3. Class บน `<div id="app">` → `data-theme="bento"` หรือ `data-theme="neobrutalism"`

---

## 5. File Structure

```
Front/src/
├── standard_design.md          ← ไฟล์นี้
├── index.css                   ← + @theme tokens, keyframes, utilities
├── components/
│   ├── ui/
│   │   ├── bento-grid.jsx      ← BentoGrid + BentoCell wrapper
│   │   ├── neobrutalism-card.jsx
│   │   └── badge-sticker.jsx   ← Achievement badge sticker
│   └── dashboard/
│       └── playful-greeting.jsx ← Random greeting + theme-aware
├── hooks/
│   └── useDesignTheme.js       ← Hook จัดการ design theme
├── layouts/
│   └── admin-layout.jsx        ← + theme toggle + badge system
└── pages/
    └── admin/
        ├── dashboard-page.jsx  ← Bento grid layout
        ├── students-page.jsx   ← Bento grid cards
        ├── courses-page.jsx    ← Bento grid cards
        └── ... (ค่อย ๆ ปรับ)
```

---

## 6. Responsive Behavior

### 6.1 Viewport Units

> **ห้ามใช้ `vh` ทุกกรณี — ให้ใช้ `dvh` (dynamic viewport height) เท่านั้น**
>
> `vh` ไม่นับ browser chrome (address bar, toolbar) บนมือถือ ทำให้เกิด layout shift และ content ถูกตัดท้าย
> `dvh` ปรับตามพื้นที่ที่ user มองเห็นจริง รองรับแสดง/ซ่อน browser chrome ได้อย่างถูกต้อง

```css
/* ✅ ถูกต้อง */
min-height: 100dvh;

/* ❌ ห้ามใช้ */
min-height: 100vh;
height: 100vh;
```

ใน `index.css` มี `@utility` ครอบไว้แล้ว:
```css
@utility min-h-screen {
  min-height: 100dvh;
}
@utility min-h-dvh {
  min-height: 100dvh;
}
```

ให้ใช้ `min-h-screen` หรือ `min-h-dvh` แทน `h-screen` หรือ `min-h-screen` (Tailwind default = 100vh) เสมอ

### 6.2 Breakpoints

| Breakpoint | Bento Columns | Neobrutalism |
|------------|--------------|--------------|
| `default` | 1 col | 1 col (stacked cards) |
| `sm (640px)` | 2 cols | 2 cols |
| `md (768px)` | 3 cols | 3 cols |
| `lg (1024px)` | 4 cols (bento) | 4 cols (grid) |

### 6.3 Mobile Bottom Navigation

- ใช้ `overflow-x-auto` + `no-scrollbar` แทน `justify-around` — รองรับ 11 items โดยไม่เบียด
- แต่ละ item: `min-w-[60px] shrink-0` — ป้องกัน label ถูกตัด
- Content container: `pb-20 md:pb-0` — ป้องกัน bottom nav ทับ content
- Safe area: `safe-area-bottom` class + `env(safe-area-inset-bottom)` สำหรับ iPhone notch

### 6.4 Form Layouts บน Mobile

- ห้ามใช้ `flex items-center justify-between` สำหรับ label + input โดยตรง
- ใช้ `flex flex-col sm:flex-row sm:items-center sm:justify-between` แทน
- Input width: `w-full sm:w-64` (ไม่ใช่ `w-64` ล้วน ที่พังบนจอ < 375px)
- ใช้ `gap-1 sm:gap-4` เพื่อ spacing ที่เหมาะสม

### 6.5 Tables

- ทุก `<table>` ต้องมี `overflow-x-auto` ห่อไว้
- Columns ที่ไม่จำเป็นบน mobile: `hidden sm:table-cell` / `hidden md:table-cell`
- หลีกเลี่ยง `min-w-[100px]` บน column ที่มีหลาย column — ใช้ขนาดพอดีหรือ responsive

### 6.6 Headers & Page Title

- ใช้ pattern: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6`
- ปุ่ม action ต้องอยู่ใต้ title (stack) บน mobile, อยู่ข้างขวาบน desktop

---

## 7. Accessibility Note

- ทุก bento cell ต้องมี `role="region"` + `aria-label`
- Badge stickers ใช้ `role="status"` + `aria-live="polite"`
- Theme toggle ใช้ `<button aria-label="เปลี่ยนธีม">`

---

## 8. Student & Parent Portal Design

### 8.1 ปัญหาปัจจุบัน

ระบบปัจจุบันรองรับเฉพาะ **Admin / Teacher / Staff** login เท่านั้น
- นักเรียนถูกสร้างโดย admin → ไม่มี email/password
- ข้อมูล parent (ชื่อ, เบอร์, line_id) เก็บใน DB แต่ไม่มีการใช้เพื่อ login หรือ notification

### 8.2 Student Login Flow

**แนวคิด:** นักเรียนไม่จำเป็นต้องมี account — ใช้ **Student Portal Token** แทน

```
Admin สร้างนักเรียน → ระบบ generate Student Portal Token
     │
     ├── แสดง QR Code บน Student Profile
     ├── ส่ง SMS ไปยังเบอร์ผู้ปกครอง (พร้อมลิงก์ + token)
     └── ส่ง LINE Message ไปยัง Line ID ผู้ปกครอง
              │
              ▼
     ผู้ปกครองเปิดลิงก์ → หน้า Student Portal (ไม่ต้อง login)
     แสดง: ตารางเรียน, การเข้าเรียน, คะแนน, ค่าเรียน
```

**API ที่ต้องเพิ่ม:**
```
GET  /api/student-portal/:token    → ข้อมูลนักเรียน (public, no auth)
GET  /api/student-portal/:token/attendance
GET  /api/student-portal/:token/grades
GET  /api/student-portal/:token/payments
POST /api/student-portal/:token/notify   → Request notification
```

### 8.3 Parent Login (Optional — Future)

ถ้าต้องการให้ผู้ปกครองมี account จริง:

```
Register: ใช้เบอร์โทรศัพท์ → OTP → ผูกกับ studentId
Login:    เบอร์โทรศัพท์ + OTP (ไม่ต้องใช้ password)
           หรือ LINE Login (OpenID Connect)
```

**ข้อดี:** ลงชื่อเข้าใช้ครั้งเดียว ดูนักเรียนได้หลายคน
**ข้อเสีย:** ต้องพัฒนา OTP system + LINE Login integration

### 8.4 Notification Channels

| Channel | ข้อมูลที่เก็บ | ใช้กับ | Priority |
|---------|-------------|--------|----------|
| **LINE** | `lineUserId` (จาก register + parent) | เช็คชื่อ, ผลการเรียน, แจ้งเตือนค่าเรียน | สูง |
| **SMS** | `phone` (จาก parent) | กรณี LINE ไม่ตอบสนอง, ลิงก์ portal | กลาง |
| **In-app** | — | หน้า Portal / Dashboard | ต่ำ |

**LINE Integration Flow:**
```
1. Admin/Parent ผูก LINE ID → ระบบเก็บ lineUserId
2. เมื่อเกิด event (เช็คชื่อ, ได้คะแนน, ถึงกำหนดชำระ)
3. Backend ส่ง LINE Messaging API → Push Notification
4. LINE Message มีลิงก์กลับไปยัง Student Portal
```

### 8.5 Student Portal UI (Frontend)

**Path:** `/student-portal/:token`

```
┌────────────────────────────────┐
│  สวัสดีคุณพ่อ/แม่ของ [ชื่อเด็ก]  │
│  [Attendance] [Grades] [Pay]   │
├────────────────────────────────┤
│  📅 คาบเรียนล่าสุด              │
│  วิชา: คณิตศาสตร์               │
│  วันที่: 25 ก.ค. 69             │
│  สถานะ: ✅ มาเรียน              │
├────────────────────────────────┤
│  📊 คะแนนล่าสุด                 │
│  การบ้านที่ 1: 8/10            │
│  การบ้านที่ 2: 9/10            │
├────────────────────────────────┤
│  💰 ค่าเรียน                    │
│  ค้างชำระ: 2,500 บาท           │
│  [ชำระเงิน]                     │
└────────────────────────────────┘
```

**No authentication required** — token มีอายุและถูก generate โดย admin
**Security:** token ควรมี expiration + rate limit + ใช้ HTTPS เท่านั้น