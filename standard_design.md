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

| Breakpoint | Bento Columns | Neobrutalism |
|------------|--------------|--------------|
| `default` | 1 col | 1 col (stacked cards) |
| `sm (640px)` | 2 cols | 2 cols |
| `md (768px)` | 3 cols | 3 cols |
| `lg (1024px)` | 4 cols (bento) | 4 cols (grid) |

---

## 7. Accessibility Note

- ทุก bento cell ต้องมี `role="region"` + `aria-label`
- Badge stickers ใช้ `role="status"` + `aria-live="polite"`
- Theme toggle ใช้ `<button aria-label="เปลี่ยนธีม">`