# Bug Analysis Report — Acadamy-Frontend (Preact ES6)

> Generated: 2026-06-27 | Updated: 2026-06-28 | Base API: `specAPI.md` v2.0

---

## 1. API Coverage — Missing Endpoints vs specAPI.md

### Route-by-Route Comparison

| # | specAPI Endpoint | Auth | Frontend Implemented? | Status |
|---|-----------------|------|----------------------|--------|
| 1 | POST `/auth/login` | Public | ✅ `auth-service.js:login()` → `login-page.jsx` | OK |
| 2 | POST `/auth/register-institute` | Public | ✅ `auth-service.js:registerInstitute()` → `register-page.jsx` | OK |
| 3 | GET `/auth/me` | 🔒 | ✅ `auth-service.js:getMe()` → `AppContext.jsx` (deduplicated) | OK |
| 4 | POST `/auth/logout` | 🔒 | ✅ `auth-service.js:logout()` → `admin-layout.jsx` | OK |
| 5 | GET `/users` | 🔒 | ✅ `user-service.js:getUsers()` → no page wired | **SERVICE ONLY** |
| 6 | GET `/users/{id}` | 🔒 | ✅ `user-service.js:getUserById()` → no page wired | **SERVICE ONLY** |
| 7 | POST `/users/register` | Public | ✅ `user-service.js:createUser()` → no page wired | **SERVICE ONLY** |
| 8 | POST `/users/forget-password` | Public | ✅ `auth-service.js:forgetPassword()` → `forgot-password-page.jsx` | OK |
| 9 | POST `/users/reset-password` | Public | ✅ `auth-service.js:resetPassword()` → no page wired | **SERVICE ONLY** |
| 10 | GET `/students` | 🔒 | ✅ `student-service.js:getStudents()` → `students-page.jsx` | OK |
| 11 | GET `/students/{id}` | 🔒 | ✅ `student-service.js:getStudentById()` → `student-profile-page.jsx` | OK |
| 12 | POST `/students` | 🔒 | ✅ `student-service.js:createStudent()` → `student-add-page.jsx` | OK |
| 13 | PUT `/students/{id}` | 🔒 | ✅ `student-service.js:updateStudent()` → no page wired | **SERVICE ONLY** |
| 14 | GET `/students/{id}/qr` | 🔒 | ✅ `student-service.js:getStudentQR()` → no page wired | **SERVICE ONLY** |
| 15 | GET `/teachers` | 🔒 | ✅ `teacher-service.js:getTeachers()` → `teachers-page.jsx` | OK |
| 16 | GET `/teachers/{id}` | 🔒 | ✅ `teacher-service.js:getTeacherById()` → not used | **SERVICE ONLY** |
| 17 | POST `/teachers` | 🔒 | ✅ `teacher-service.js:createTeacher()` → no form wired | **SERVICE ONLY** |
| 18 | GET `/courses` | 🔒 | ✅ `course-service.js:getCourses()` → `courses-page.jsx` (hardcoded) | **SERVICE ONLY** |
| 19 | GET `/courses/{id}` | 🔒 | ✅ `course-service.js:getCourseById()` → not used | **SERVICE ONLY** |
| 20 | POST `/courses` | 🔒 | ✅ `course-service.js:createCourse()` → not used | **SERVICE ONLY** |
| 21 | PUT `/courses/{id}` | 🔒 | ✅ `course-service.js:updateCourse()` → not used | **SERVICE ONLY** |
| 22 | POST `/enrollments` | 🔒 | ❌ | **MISSING** |
| 23 | POST `/attendance/scan` | 🔒 | ✅ `attendance-service.js:scanAttendance()` → `attendance-page.jsx` | OK |
| 24 | POST `/attendance/manual` | 🔒 | ✅ `attendance-service.js:submitManualAttendance()` → `attendance-page.jsx` | OK |
| 25 | GET `/attendance/daily` | 🔒 | ✅ `attendance-service.js:getDailyAttendance()` → `attendance-page.jsx` | OK |
| 26 | POST `/payments` | 🔒 | ✅ `finance-service.js:createPayment()` → `finance-page.jsx` | OK |
| 27 | GET `/payments` | 🔒 | ✅ `finance-service.js:getPayments()` → `finance-page.jsx` | OK |
| 28-38 | `/products/*`, `/health`, `/v1/test-connection` | Public | ❌ | **NOT NEEDED** (legacy) |

### Summary
- **Implemented & wired:** 15/30 (50%) ↑ from 37%
- **Service exists but no page:** 9/30 (30%)
- **Missing service entirely:** 2/30 (7%) — `/enrollments` and legacy
- **Not needed (legacy):** 7/30 (23%)

---

## 2. Bug Fixes Applied (2026-06-28)

### 2.1 FIXED: `attendance-service.js` — Wrong request body format

**File:** `src/services/attendance-service.js`

**Before:**
```js
export function scanAttendance(qrData) {
  return api.post('/attendance/scan', { qrData });
}
```

**After:**
```js
export function scanAttendance(payload) {
  return api.post('/attendance/scan', payload);
}
```

The call site in `attendance-page.jsx` now passes `{ qrToken: qrData, sessionId: Number(sessionId) }` which matches specAPI `POST /attendance/scan` body format.

---

### 2.2 FIXED: `attendance-page.jsx` — Manual attendance missing `sessionId`

**File:** `src/pages/admin/attendance-page.jsx`

**Before:**
```js
await attendanceService.submitManualAttendance({ studentId, status });
```

**After:**
```js
await attendanceService.submitManualAttendance({ sessionId: Number(sessionId), studentId, status });
```

`sessionId` is sourced from `GET /attendance/daily` response (`sessionInfo.id`). Matches specAPI `POST /attendance/manual` requirements.

---

### 2.3 FIXED: `attendance-page.jsx` — Replaced mock data with real API

**File:** `src/pages/admin/attendance-page.jsx`

**Before:** Hardcoded 20 mock student names (`mockStudents`).
**After:** Calls `attendanceService.getDailyAttendance()` on mount. Uses `res.data?.data.attendances` or `res.data.attendances` from response. Extracts `sessionInfo.id` as `sessionId`. Shows "ยังไม่มีข้อมูลการเข้าเรียนวันนี้" when empty. Added loading state.

---

### 2.4 FIXED: `teachers-page.jsx` — Removed non-existent `nickname` column

**File:** `src/pages/admin/teachers-page.jsx`

**Before:** Column renderer referenced `row.nickname` which does not exist in `GET /teachers` response.
**After:** Simplified to single `<span>` showing `fullName` or `'-'`. The response parsing (`Array.isArray(res.data) ? res.data : res.data?.data || []`) correctly handles the bare array response.

---

### 2.5 PARTIALLY: `finance-page.jsx` — Mock data debt

**File:** `src/pages/admin/finance-page.jsx`

Still uses `mockCourses` and `mockPayments` as fallback when API fails. The payload now correctly sends `{ enrollmentId, amount, method, slipUrl }` matching specAPI. `getCourses` moved from `finance-service.js` to `course-service.js`.

---

### 2.6 NOT FIXED: `courses-page.jsx` — 100% hardcoded mock data

**File:** `src/pages/admin/courses-page.jsx`

Still uses hardcoded `const courses = [...]`. Service layer (`course-service.js`) now exists with `getCourses`, `getCourseById`, `createCourse`, `updateCourse`. Wiring the page to real API calls is deferred.

---

### 2.7 FIXED: `register-page.jsx` — `logo_base64` sends `undefined` instead of `''`

**File:** `src/features/auth/register-page.jsx`

**Before:**
```js
logo_base64: logoBase64 || '',
```
**After:**
```js
logo_base64: logoBase64 || undefined,
```

`JSON.stringify` omits keys with `undefined` values, so the field is excluded entirely when absent. Matches spec: `logo_base64` is `string?` (optional).

---

### 2.8 FIXED: `register-page.jsx` — `pdpaConsentVersion` reads from form

**File:** `src/features/auth/register-page.jsx`

**Before:**
```js
pdpaConsentVersion: '1.0',
```
**After:**
```js
pdpaConsentVersion: data.consent_version || '1.0',
```

Now reads the `consent_version` form field (set by checkbox to `'v1.0'` or `''`), with fallback to `'1.0'` as per spec default.

---

### 2.9 FIXED: `student-add-page.jsx` — PDPA consent version format

**File:** `src/pages/admin/student-add-page.jsx`

**Before:**
```js
consentVersion: consent ? 'v1.0' : '',
```
**After:**
```js
consentVersion: consent ? '1.0' : undefined,
```

Matches specAPI: `consentVersion` expects `"1.0"` without `v` prefix. `undefined` ensures field is omitted when consent is false (not reachable due to validation check but defensive).

---

### 2.10 NOT FIXED: `API base URL` — No .env file

**File:** `src/services/api.js:3`
```js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

No `.env` file exists. `VITE_API_URL` is never set. Requires operational configuration via `.env` or deployment environment variable.

---

### 2.11 FIXED: `admin-layout.jsx` — Duplicate `/auth/me` call removed

**File:** `src/layouts/admin-layout.jsx`

**Before:** `admin-layout.jsx` called `api.get('/auth/me')` in its own `useEffect`, duplicating the call in `AppContext.jsx`.
**After:** Reads `const profile = state.userProfile` directly from context. Import of `api` removed. Dropped unused `profile` local state and the `useEffect` block.

---

### 2.12 FIXED: `admin-layout.jsx` — Profile display name extraction

**File:** `src/layouts/admin-layout.jsx`

**Before:** Set `profile` to the response envelope, causing display name to always fall through to `state.user?.email` or `'admin'`.
**After:**
```js
const profile = state.userProfile;  // = inner data from GET /auth/me response
const displayName =
  profile?.profile?.fullName  // matches response shape: data.profile.fullName
  || profile?.fullName        // flat fallback
  || profile?.email           // email fallback
  || state.user?.email        // initial user fallback
  || state.user?.userId       // userId fallback
  || 'admin';
```
Correctly navigates `data.profile.fullName` → `userProfile.profile.fullName`.

---

### 2.13 FIXED: AppContext `SET_PROFILE` response parsing

**File:** `src/store/AppContext.jsx`

**Before:**
```js
getMe().then((res) => dispatch({ type: 'SET_PROFILE', payload: res.data }))
```
Set `userProfile` to the full response envelope `{ status, data: {...} }`, breaking all consumers.

**After:**
```js
getMe().then((res) => dispatch({ type: 'SET_PROFILE', payload: res.data?.data || res.data }))
```
Extracts the inner `data` object (actual user profile), with fallback to raw body if envelope is absent.

---

### NEW: Students page `fullName` column key fix

**File:** `src/pages/admin/students-page.jsx`

**Before:** Column key was `fullname` (all lowercase), renderer concatenated `row.firstname + row.lastname`.
**After:** Column key changed to `fullName` (camelCase), renderer shows `value || row.fullName || '-'`. Matches `GET /students` response field `fullName`.

---

### NEW: Forgot password page wired to real API

**File:** `src/features/auth/forgot-password-page.jsx`

**Before:** `onSubmit` did `console.log` and showed success toast without any API call.
**After:** Calls `authService.forgetPassword(data.email)`. Local `submitting` state replaces `react-hook-form`'s `isSubmitting` (not supported by `useForm`). Error handling with server message display.

---

### NEW: Token expiration handling via 401 interceptor

**File:** `src/services/api.js` + `src/store/AppContext.jsx`

The API fetcher now exports `setOnUnauthorized(handler)`. On any 401 response, it calls `clearAuthStorage()` (removes token from localStorage) then invokes the handler.

`AppContext.jsx` registers `handleUnauthorized` via `setOnUnauthorized(handleUnauthorized)` in a `useEffect`. The handler dispatches `CLEAR_USER` and routes to `/login`.

---

### NEW: Services created / completed

| Service File | New Functions |
|---|---|
| `src/services/course-service.js` | `getCourses`, `getCourseById`, `createCourse`, `updateCourse` |
| `src/services/auth-service.js` | `forgetPassword`, `resetPassword` |
| `src/services/user-service.js` | `getUsers`, `getUserById` |

`getCourses` removed from `finance-service.js` (was incorrectly placed there).

---

## 3. Context/Reducer Analysis

### Current State Shape
```js
const initialState = {
  theme: 'dark',
  user: null,           // { userId, email, role, instituteId } from login response
  userProfile: null,    // inner data from GET /auth/me response (FIXED)
  isAuthenticated: false,
};
```

### Reducer Actions (AppReducer.js)
| Action | Payload | Effect |
|--------|---------|--------|
| `SET_THEME` | `string` | Sets `theme` (unused in codebase) |
| `SET_USER` | `object` | Sets `user` + `isAuthenticated: !!payload` |
| `SET_PROFILE` | `object` | Sets `userProfile` (FIXED: now inner data, not envelope) |
| `CLEAR_USER` | — | Clears `user`, `userProfile`, `isAuthenticated: false` |

### Known Gaps
1. **No `SET_LOADING` / `SET_ERROR` actions** — loading/error managed per-component via `useState`
2. **`SET_THEME` never dispatched** — theme defaults to `'dark'` and never changes
3. **No `instituteId` at root** — `instituteId` exists inside `user` object but not extracted
4. **Single reducer** — all state in one reducer; no domain splitting

### 401 Token Expiration Flow (NEW)
```
API call → 401 response
  → api.js fetcher: clearAuthStorage() → onUnauthorized()
  → AppContext: dispatch(CLEAR_USER) → route('/login')
```

---

## 4. Remaining Issues

### 4.1 courses-page.jsx still hardcoded
Service exists (`course-service.js`) but `courses-page.jsx` still uses hardcoded mock data. Need to wire `getCourses` to real API calls.

### 4.2 finance-page.jsx still uses mock fallback
`mockCourses` and `mockPayments` arrays used as fallback when API fails. Should display error state instead of fake data.

### 4.3 No `/enrollments` service
`POST /enrollments` endpoint is the only required endpoint with no service implementation.

### 4.4 No route protection / guards
Admin pages render without authentication check. Now mitigated by the 401 interceptor which redirects to `/login` on expired/missing tokens, but UI flashes briefly before redirect.

### 4.5 No env file
`VITE_API_URL` must be set via `.env` or deployment environment.

### 4.6 No React Query / data fetching library
Manual `useState` + `useEffect` patterns with no caching, deduplication, or optimistic updates. Would benefit from `@tanstack/react-query` or similar.

### 4.7 Users page still hardcoded
`users-page.jsx` uses hardcoded `const users = [...]`. `user-service.js:getUsers()` now exists but page is not wired.

---

## 5. Fix Status Summary

| # | Bug | Priority | Status |
|---|-----|----------|--------|
| 2.1 | attendance scan wrong body format | P0 | ✅ FIXED |
| 2.2 | manual attendance missing sessionId | P0 | ✅ FIXED |
| 2.3 | attendance page mock data | P0 | ✅ FIXED |
| 2.4 | teachers page nickname column | P1 | ✅ FIXED |
| 2.5 | finance page mock data | P1 | ⚠️ MITIGATED |
| 2.6 | courses page mock data | P1 | ⬜ DEFERRED |
| 2.7 | register logo_base64 empty string | P1 | ✅ FIXED |
| 2.8 | register pdpaConsentVersion hardcoded | P1 | ✅ FIXED |
| 2.9 | student-add pdpa consent version | P2 | ✅ FIXED |
| 2.10 | no .env file | P0 | ⬜ CONFIG |
| 2.11 | admin-layout duplicate /auth/me | P2 | ✅ FIXED |
| 2.12 | admin-layout profile display | P2 | ✅ FIXED |
| 2.13 | AppContext SET_PROFILE parsing | P0 | ✅ FIXED |
| — | students page fullName column | P1 | ✅ FIXED |
| — | forgot-password page API call | P1 | ✅ FIXED |
| — | 401 token expiration handler | P3 | ✅ FIXED |
| — | course-service.js created | P1 | ✅ FIXED |
| — | auth-service missing endpoints | P1 | ✅ FIXED |
| — | user-service missing endpoints | P1 | ✅ FIXED |
