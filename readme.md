# TiwHub Academy — Frontend

> **Tech Stack:** Preact + Vite 6 + Tailwind CSS v4 + TypeScript  
> **Backend:** ASP.NET Core 9/10 (Multi-Tenant, Cookie Auth)  
> **Design System:** Minimalist Soft (Oasis Theme) — orange amber accent, dark navy heading, soft teal secondary, warm gray background  
> **Mood & Tone:** อบอุ่น, เข้าถึงง่าย, สบายตา, ลดความตึงเครียด  
> **Last Updated:** 2026-07-17

---

## สารบัญ

- [ภาพรวมโปรเจกต์](#ภาพรวมโปรเจกต์)
- [Project Structure](#project-structure)
- [Tech Stack & Rationale](#tech-stack--rationale)
- [มาตรฐานการเขียนโค้ด](#มาตรฐานการเขียนโค้ด)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Routing & Route Guards](#routing--route-guards)
- [UI Component System](#ui-component-system)
- [QR Code Attendance System](#qr-code-attendance-system)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## ภาพรวมโปรเจกต์

ระบบบริหารจัดการสถาบันกวดวิชา (Academy Management System) ประกอบด้วย:

- **Authentication** — Login / Register / Forgot Password (httpOnly Cookie-based)
- **Student Management** — CRUD, Profile with QR Code
- **Teacher Management** — CRUD
- **Course Management** — CRUD, Sessions nested under Course
- **Attendance System** — QR Code scan + Manual check-in
- **Finance** — Payment tracking, Invoice generation
- **Homework** — Create, Submissions, Grading
- **Skill Scores** — Per-student topic-based scoring, Batch upsert
- **Leave Requests** — Approve/Reject workflow
- **User Management** — Multi-role (Admin, Teacher, Staff)
- **Institute Settings** — Profile, Logo upload, Tax info
- **Products** — CRUD (scoped to institute)

---

## Project Structure

```
Front/
├── index.html                  # SPA entry point
├── vite.config.js              # Vite + Preact + Tailwind CSS v4
├── vitest.config.js            # Vitest (happy-dom, @testing-library/preact)
├── tsconfig.json               # JSX: preact, target: ES2020
├── package.json
│
├── src/
│   ├── main.jsx                # render(<AppProvider><App />, #app)
│   ├── app.jsx                 # Router + global containers (Toast, ConfirmDialog)
│   ├── app.css
│   ├── index.css               # Tailwind v4 + custom theme tokens + fonts
│   │
│   ├── assets/
│   │   └── preact.svg
│   │
│   ├── store/
│   │   ├── AppContext.jsx       # Context + useReducer Provider
│   │   └── AppReducer.js       # Actions: SET_THEME, SET_USER, SET_PROFILE, CLEAR_USER, etc.
│   │
│   ├── services/
│   │   ├── api.js              # HTTP client (fetch, credentials: 'include', AbortSignal)
│   │   ├── auth-service.js
│   │   ├── student-service.js
│   │   ├── teacher-service.js
│   │   ├── course-service.js
│   │   ├── session-service.js
│   │   ├── attendance-service.js
│   │   ├── enrollment-service.js
│   │   ├── finance-service.js
│   │   ├── homework-service.js
│   │   ├── leave-request-service.js
│   │   ├── skill-score-service.js
│   │   ├── user-service.js
│   │   ├── institute-service.js
│   │   └── index.js            # Barrel export
│   │
│   ├── hooks/
│   │   ├── use-abort-controller.js
│   │   ├── use-form.js
│   │   └── use-local-storage.js
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── index.js        # Barrel export
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── checkbox.jsx
│   │   │   ├── card.jsx
│   │   │   ├── status-badge.jsx
│   │   │   ├── solid-input.jsx
│   │   │   ├── data-table.jsx
│   │   │   ├── scanner-camera.jsx
│   │   │   ├── logo-upload.jsx
│   │   │   ├── toast.jsx + toast-container.jsx
│   │   │   ├── confirm-dialog.jsx + confirm-dialog-container.jsx
│   │   │   ├── auth-form-layout.jsx
│   │   │   ├── auth-page-shell.jsx
│   │   │   └── redirect.jsx
│   │   ├── require-auth.jsx    # HOC route guard
│   │   └── dashboard/
│   │       ├── dashboard-overview.jsx
│   │       └── stat-card.jsx
│   │
│   ├── features/
│   │   └── auth/
│   │       ├── login-page.jsx
│   │       ├── register-page.jsx
│   │       ├── forgot-password-page.jsx
│   │       └── contact-page.jsx
│   │
│   ├── layouts/
│   │   └── admin-layout.jsx    # Sidebar + topbar + mobile bottom nav
│   │
│   └── pages/
│       ├── index.jsx           # Landing page
│       └── admin/
│           ├── dashboard-page.jsx
│           ├── students-page.jsx
│           ├── student-add-page.jsx
│           ├── student-profile-page.jsx
│           ├── teachers-page.jsx
│           ├── courses-page.jsx
│           ├── sessions-page.jsx
│           ├── attendance-page.jsx
│           ├── finance-page.jsx
│           ├── requests-page.jsx
│           ├── academics-page.jsx
│           ├── products-page.jsx
│           ├── users-page.jsx
│           └── settings-page.jsx
│
├── docAPI/
│   ├── currentAdminFeature.md  # Code review & feature coverage
│   └── specAPI.md              # Full API specification
│
└── dist/                       # Production build output
```

---

## Tech Stack & Rationale

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Preact 10 | 3kB React alternative, same API, smaller bundle |
| **Build Tool** | Vite 6 | Fast HMR, tree-shaking, ESBuild-based |
| **Styling** | Tailwind CSS v4 | Utility-first, JIT compilation, no runtime CSS-in-JS overhead |
| **Design System** | Oasis Theme (Minimalist Soft) | Violet accent, zinc neutrals, soft rounded corners, friendly/accessible |
| **State Management** | Context + useReducer | Lightweight, no external dependency overhead |
| **Routing** | preact-router | Simple hash-free routing, no extra abstraction |
| **HTTP Client** | Native fetch | Zero-dependency, `credentials: 'include'` for cookie auth |
| **Forms** | (Custom hooks) | Avoids form library overhead for simple forms |
| **QR Code** | react-qr-code + jsqr | Generate QR for student cards, decode from camera stream |
| **Testing** | Vitest + @testing-library/preact | Fast, modern, preact-compatible |
| **TypeScript** | tsconfig set up | Files use `.jsx` extension, but strict types available |

---

## มาตรฐานการเขียนโค้ด

### 1. Component Structure

```jsx
// Components are functional with named exports
export function ComponentName({ prop1, prop2 }) {
  // Hooks at top
  const [state, setState] = useState(null);
  
  // Effects
  useEffect(() => { /* ... */ }, []);
  
  // Event handlers
  const handleClick = () => { /* ... */ };
  
  // Render
  return <div>{/* ... */}</div>;
}
```

### 2. File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Pages | `kebab-case-page.jsx` | `student-profile-page.jsx` |
| Components | `kebab-case.jsx` | `status-badge.jsx` |
| Services | `kebab-case-service.js` | `attendance-service.js` |
| Hooks | `use-kebab-case.js` | `use-abort-controller.js` |
| Store | `PascalCase.jsx` / `PascalCase.js` | `AppContext.jsx`, `AppReducer.js` |

### 3. API Layer Pattern

- **Service module** มีหน้าที่เดียว: เรียก API endpoint
- **Service function** รับ `payload` และ `options` (สำหรับ `{ signal }`)
- **Service object** export ทั้งแบบ named function และ service object:

```js
// ✅ Good
export function getStudents(params = {}, options = {}) {
  return api.get('/students', { params, ...options });
}

export const studentService = { getStudents, getStudentById, ... };
```

### 4. Error Handling

- API errors ถูก throw เป็น `Error` object พร้อม `status` และ `data`
- Service layer **ไม่** catch error — ปล่อยให้ page component จัดการ
- Components ใช้ try/catch + `showToast()` แสดงข้อความ error

```jsx
try {
  const res = await studentService.getStudentById(id);
  setStudent(res.data?.data || res.data);
} catch (err) {
  const msg = err?.data?.message || 'เกิดข้อผิดพลาด';
  showToast(msg, 'error');
}
```

### 5. Request Cancellation

ทุก page ที่ fetch ข้อมูล ต้องใช้ `useAbortController` hook:

```jsx
const getSignal = useAbortController();

useEffect(() => {
  api.get('/data', { signal: getSignal() })
    .then(/* ... */)
    .catch(() => { /* ignore abort errors */ });
}, []);
```

### 6. Styling Guidelines — Minimalist Soft (Oasis Theme)

- **ใช้ Tailwind utility classes เท่านั้น** — ไม่ใช้ CSS modules หรือ styled-components
- **ใช้ custom theme tokens** (`oasis-primary`, `oasis-accent`, etc.) แทน hardcoded colors
- **Page Background:** `bg-oasis-bg` (`#f4f2f2` / warm gray)
- **Floating Card Layout:** เนื้อหาหลักอยู่ใน `bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-sm` — ลอยบนพื้นหลัง, my-4, mr-4
- **Color Palette:**
  - `oasis-primary: #ff9e20` (orange amber) — primary action, active states
  - `oasis-primary-light: #ffb84d` — hover states
  - `oasis-primary-dark: #e08500` — active/pressed
  - `oasis-accent: #215e61` (teal) — secondary accent, badges
  - `oasis-accent-light: #2d7d81` — light variant
  - `oasis-accent-dark: #163f41` — dark variant
  - `oasis-bg: #f4f2f2` (warm gray) — page background + sidebar
  - `oasis-surface: #ffffff` — floating card background
  - `oasis-heading: #1d2128` (dark navy) — heading text
  - `oasis-body: #4a4e55` — body text
  - `oasis-muted: #94989e` — muted text
  - `oasis-border: #d8d6d6` — borders
  - `oasis-success: #10b981` (emerald) — success
  - `oasis-warning: #f59e0b` (amber) — warning
  - `oasis-danger: #ef4444` (red) — danger
- **Sidebar:** `bg-oasis-bg` (same as page bg), active item `bg-zinc-200/60 text-zinc-900`, inactive `text-zinc-500 hover:text-zinc-900`
- **Data Cards:** `bg-zinc-50 rounded-2xl border border-zinc-100 p-5 shadow-sm` — subtle card on card
- **Border radius** ใช้ `rounded-xl` / `rounded-2xl` / `rounded-3xl` (floating card) — soft, friendly look
- **Cards** ใช้ `bg-white rounded-2xl border border-zinc-200/80 shadow-sm` (inside floating card)
- **Data tables** ใช้ `rounded-xl border border-zinc-200/80` — soft table container
- **Status badges** ใช้ `rounded-full` — pill shape, soft bg (`bg-oasis-success-light` etc.)
- **Interactive elements** ใช้ `hover:bg-zinc-100` / `hover:bg-zinc-50`
- **Section toggles** (scan/manual, form/history) ใช้ `bg-zinc-100 p-1 rounded-xl` พร้อม active indicator `bg-white shadow-sm`
- **Responsive** ใช้ breakpoints: `sm:`, `md:`, `lg:`
- **Font:** Sarabun (Thai-optimized), body `font-weight: 400`, headings `font-weight: 600` + `tracking-tight`

### 7. Routing Convention

- Route paths ใช้ `kebab-case` (e.g., `/admin/student-profile`)
- Dynamic segments ใช้ `:param` (e.g., `/admin/students/:id`)
- Nested routes ใช้ `:parentId/child` (e.g., `/admin/courses/:courseId/sessions`)
- Admin routes ต้อง wrap ด้วย `requireAuth()` HOC

### 8. Import Order

1. External libraries (preact, preact-router)
2. Internal modules (services, hooks, components)
3. Styles (`.css`)

### 9. State Management Rules

- **Global state** (user, auth, institute info) → `AppContext`
- **Page-local state** → `useState` / `useReducer`
- **Server data** → fetch on mount, store in local state (no cache layer yet)
- **No localStorage for auth tokens** — httpOnly cookie only

### 10. Accessibility (WCAG)

- ใช้ semantic HTML (`button`, `nav`, `main`, `header`)
- Input fields ต้องมี `<label>` พร้อม `htmlFor`
- Interactive elements ต้องมี `cursor-pointer`
- ใช้ `sr-only` utility สำหรับ screen reader text เมื่อจำเป็น

---

## State Management

### Global State (AppContext)

```
{
  theme: 'dark',
  user: null,              // Current user object
  userProfile: null,        // Full profile from getMe()
  isAuthenticated: false,   // Derived from user
  isAuthLoading: true,      // true while checking auth on mount
  instituteLogo: null,      // Base64 logo string
  instituteName: null,      // Institute display name
}
```

### Actions

| Action | Effect |
|--------|--------|
| `SET_THEME` | Update theme (light/dark) |
| `SET_USER` | Set user + `isAuthenticated: true` |
| `SET_PROFILE` | Set user profile |
| `CLEAR_USER` | Clear all auth state + `isAuthenticated: false` |
| `SET_AUTH_LOADING` | Toggle auth loading state |
| `SET_INSTITUTE_LOGO` | Set institute logo |
| `SET_INSTITUTE_NAME` | Set institute name |

---

## API Layer

### Base Client (`services/api.js`)

```js
api.get(endpoint, options)
api.post(endpoint, data, options)
api.put(endpoint, data, options)
api.delete(endpoint, options)
```

- **Auth:** `credentials: 'include'` (httpOnly cookie)
- **Content-Type:** `application/json` (auto, except FormData)
- **Query params:** auto-built from `options.params`
- **AbortController:** forwarded via `options.signal`
- **401 handling:** `setOnUnauthorized(handler)` — redirects to `/login`
- **Error format:** `{ status: number, data: object, message: string }`

### Service Pattern

```js
// Each service exports named functions + a service object
export function getUsers(params, options) {
  return api.get('/users', { params, ...options });
}

export const userService = { getUsers, getUserById, ... };
```

---

## Routing & Route Guards

```jsx
// Wrapping admin pages with auth guard
const AdminDashboard = requireAuth(DashboardPage);
const AdminStudents = requireAuth(StudentsPage);

// Router
<Router>
  <LoginPage path="/" />
  <AdminDashboard path="/admin/dashboard" />
  <AdminStudents path="/admin/students" />
  {/* ... */}
</Router>
```

`requireAuth()` HOC:
- Shows spinner while `isAuthLoading` is true
- Redirects to `/login` if not authenticated
- Renders the wrapped component if authenticated

---

## UI Component System

| Component | Description |
|-----------|-------------|
| `Button` | `variant`: primary/secondary/outline/link, `size`: sm/md/lg, supports `loading` — rounded-xl, soft shadow on primary |
| `Input` | Text/password with toggle, error state, label — rounded-xl, focus ring `oasis-primary/10` |
| `Textarea` | Consistent with Input styling |
| `Checkbox` | Styled checkbox — rounded-md with `oasis-primary` accent |
| `Card` | Container with `bg-white border border-zinc-200/80 rounded-2xl shadow-sm` |
| `DataTable` | Table with columns definition, actions, pagination, empty state, loading — `rounded-xl` container |
| `StatusBadge` | Color-coded pill badge: present/absent/late/leave/paid/unpaid — `rounded-full`, soft bg colors |
| `Toast` | Singleton pattern — `showToast(message, type)` from anywhere — `rounded-xl` with soft border |
| `ConfirmDialog` | Promise-based — `const ok = await showConfirm({ title, message })` — `rounded-2xl` modal |
| `ScannerCamera` | Camera viewfinder + jsQR decode + manual input fallback — `rounded-2xl` viewfinder, violet corner brackets |
| `LogoUpload` | Drag-and-drop logo upload (jpg/png/webp, max 2MB) — `rounded-xl` dashed drop zone |
| `SolidInput` | Admin-style input — `rounded-xl`, focus ring `oasis-primary/10` |

### Toast System

```jsx
import { showToast } from '../../components/ui';

// Fire-and-forget toast
showToast('บันทึกสำเร็จ', 'success');  // success | error | warning | info
```

### Confirm Dialog

```jsx
import { showConfirm } from '../../components/ui';

const ok = await showConfirm({
  title: 'ลบข้อมูล',
  message: 'คุณแน่ใจหรือไม่?',
  yesLabel: 'ลบ',
  cancelLabel: 'ยกเลิก',
});
if (ok) { /* proceed */ }
```

---

## QR Code Attendance System

### Generate QR (Student Profile Page)

```jsx
import { QRCode } from 'react-qr-code';

<QRCode
  value={qrToken}       // String to encode
  size={160}
  bgColor="transparent"
  fgColor="#1e293b"
/>
```

- API: `GET /api/students/:id/qr` → returns `{ qrToken, expiresAt }`
- QR Token มีอายุ (server-side) — ต้อง regenerate เมื่อหมดอายุ

### Scan QR (Attendance Page)

```jsx
import { ScannerCamera } from '../../components/ui';

<ScannerCamera
  onScan={(qrData) => handleScan(qrData)}
  onError={(err) => console.error(err)}
/>
```

- ใช้ `navigator.mediaDevices.getUserMedia()` เปิดกล้องหลัง (`facingMode: 'environment'`)
- decode QR ทุก frame ด้วย `jsQR`
- ส่ง `qrToken` ไป `POST /api/attendance/scan`
- มี debounce 3s ป้องกัน scan ซ้ำ
- Fallback: พิมพ์รหัส manual input

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |

---

## Scripts

```bash
npm run dev        # Start Vite dev server (localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm test           # Run Vitest once
npm run test:watch # Run Vitest in watch mode
```

---

## Code Review Standards

อ้างอิงจาก `docAPI/currentAdminFeature.md`:

| ระดับ | คำอธิบาย |
|-------|----------|
| 🔴 CRITICAL | Security issue, data leak, auth bypass |
| 🟠 HIGH | Performance, IDOR, missing validation |
| 🔸 MEDIUM | Race condition, UX issues, code quality |
| ⚪ LOW | Style, naming, minor optimization |

### Known Issues (after Sprint)

- 3 backend CRITICALs: hardcoded DB password, connection leak, weak JWT key
- No caching/SWR — every navigation re-fetches
- Client-side pagination in DataTable (no server-side pagination)
- No rate limiting (backend)
- Fire-and-forget exceptions (backend)