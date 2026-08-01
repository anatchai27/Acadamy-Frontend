# TiwHub Epic Review & Implementation Coverage Report

**Report Date:** 2026-07-29  
**Reviewer:** Senior Software Engineer / Tech Lead  
**Scope:** Compare Epic requirements in `C:\Project\Acadamy-Frontend\Epic` against actual implementations in `API/` and `Front/`  
**Methodology:** Code inspection of controllers, services, models, frontend pages, and database context against Epic/Feature/User Story acceptance criteria.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Epics** | 6 |
| **Total Features** | 20 |
| **Overall Implementation Coverage** | **~43%** |
| **Backend API Coverage** | ~52% |
| **Frontend UI Coverage** | ~34% |
| **Highest Coverage Epic** | Epic 1 — Platform Foundation (62.5%) |
| **Lowest Coverage Epic** | Epic 6 — Public Acquisition (11.7%) |

### Key Findings

1. **Admin-side core workflows are largely functional**: student management, courses, sessions, attendance scanning, payments, skill scores, homework, and leave requests all have working backend APIs and admin UI pages.
2. **Parent/Student portals are almost entirely missing**: No LINE LIFF integration, no parent dashboard, no digital student pass UI, no public website, and no trial booking.
3. **Advanced financial/automation features remain theoretical**: Credit wallet engine, PromptPay QR, AI slip verification, gamification, payroll, and room conflict detection are not implemented.
4. **Security hardening is incomplete**: Backend endpoints check authentication but rarely enforce role-based authorization (e.g., `/api/payments` allows any authenticated user, not just admin).
5. **Reliability patterns need attention**: LINE notifications are still fire-and-forget via `Task.Run()` rather than a durable queue with retry/background worker.

---

## Coverage by Epic

| Epic | Features | Coverage | Status |
|------|----------|----------|--------|
| Epic 1 — Platform Foundation & Multi-Tenant Core | 4 | **62.5%** | 🟡 Partial |
| Epic 2 — Flexible Course Engine & Financial Ecosystem | 4 | **50.0%** | 🟡 Partial |
| Epic 3 — High-Throughput Operations & Attendance | 3 | **56.7%** | 🟡 Partial |
| Epic 4 — Parent & Student Digital Experience | 3 | **15.0%** | 🔴 Early |
| Epic 5 — Academics, Gamification & Skill Analytics | 3 | **55.0%** | 🟡 Partial |
| Epic 6 — Public Acquisition & School Operations | 3 | **11.7%** | 🔴 Early |
| **TOTAL** | **20** | **~43.3%** | 🟡 |

---

## Epic-by-Epic Detailed Analysis

### Epic 1 — Platform Foundation & Multi-Tenant Core Architecture

| Feature | Target | Actual Coverage | Evidence | Status |
|---------|--------|-----------------|----------|--------|
| **1.1 Multi-Tenant Data Isolation & Query Filter** | 100% | ~90% | `TenantMiddleware` extracts `institute_id`; `TutoringDbContext.ApplyTenantFilters()` uses `HasQueryFilter` on all `IMultiTenantEntity` tables; `AuditTenantSaveChangesInterceptor` auto-sets `InstituteId` on insert. | 🟢 Mostly Done |
| **1.2 Tenant Onboarding & White-Labeling** | 100% | ~60% | `POST /api/auth/register-institute` creates institute + admin atomically. Logo stored as base64 string, not uploaded to S3/WebP. No white-label CMS or receipt branding. | 🟡 Partial |
| **1.3 RBAC & Staff Directory** | 100% | ~50% | `UserRole` enum exists (admin/teacher/staff/parent/student). Frontend sidebar uses `roles`. Backend uses only `.RequireAuthorization()` — no role policies. Staff CRUD exists but self-deletion check is weak. | 🟡 Partial |
| **1.4 PDPA Compliance & Consent Management** | 100% | ~50% | `PdpaConsent` model/table exists; consent captured during student creation with IP. No standalone PDPA modal, no data export, no right-to-be-forgotten endpoint. | 🟡 Partial |

**Epic 1 Coverage:** `(90 + 60 + 50 + 50) / 4 = 62.5%`

#### Critical Gaps

- **Backend role enforcement**: `PaymentEndpoints`, `CourseEndpoints`, `UserEndpoints`, and most other controllers only check login, not specific roles. A `teacher` or `parent` token can hit `POST /api/payments` directly.
- **White-label branding**: `Institute.LogoUrl` accepts base64; no transformation, CDN, or receipt PDF integration.
- **PDPA workflow**: Consent is implicit during student add; no versioning, no parent-specific consent flow, no audit export.

---

### Epic 2 — Flexible Course Engine & Multi-Model Financial Ecosystem

| Feature | Target | Actual Coverage | Evidence | Status |
|---------|--------|-----------------|----------|--------|
| **2.1 Polymorphic Course Engine** | 100% | ~85% | `Course.CourseType` supports `group`, `private`, `subscription`, `video`, `credit`. `CourseService.ValidateCourseTypeFields()` enforces per-type rules. Dynamic UI in `courses-page.jsx`. | 🟢 Mostly Done |
| **2.2 Multi-Tenant Credit Wallet & Ledger** | 100% | ~30% | `StudentWallet` and `WalletTransaction` models exist in DB. Course type "credit" is recognized. No wallet service, no top-up/deduct API, no ledger immutability or balance constraint enforcement. | 🔴 Early |
| **2.3 Billing, Automated Invoicing & PDF Receipts** | 100% | ~75% | `PaymentService.CreateAsync()` generates `invoiceNo`, creates PDF URL, sends LINE notification. No actual PDF generation library (QuestPDF/DinkToPdf) — only a hardcoded URL. | 🟡 Partial |
| **2.4 Payment Gateway & AI Slip Verification** | 100% | ~10% | No PromptPay QR generator, no EasySlip/SlipOK integration. Image upload endpoint exists (`/api/uploads/payment-slip`) but only stores the file; no AI validation. | 🔴 Early |

**Epic 2 Coverage:** `(85 + 30 + 75 + 10) / 4 = 50.0%`

#### Critical Gaps

- **Wallet engine is a schema-only feature**: Tables exist but no business logic or API surface.
- **PDF receipts are fake URLs**: `receiptPdfUrl = $"https://storage.tiwhub.com/receipts/{invoiceNo}.pdf"` is generated but no file is created.
- **No automated payment verification**: Admin must manually confirm every payment in `/admin/finance`.

---

### Epic 3 — High-Throughput Daily Operations & Gate Attendance

| Feature | Target | Actual Coverage | Evidence | Status |
|---------|--------|-----------------|----------|--------|
| **3.1 High-Concurrency Dynamic QR Attendance Gate** | 100% | ~80% | `POST /api/attendance/scan` validates QR token, checks duplicates, handles `group/private/subscription/credit/video` billing methods, and records attendance transactionally. Manual attendance also available. | 🟢 Mostly Done |
| **3.2 Event-Driven LINE Push Queue** | 100% | ~40% | `ILineNotificationService` and `LineNotificationService` exist. Both `AttendanceService` and `PaymentService` call LINE via `Task.Run()` fire-and-forget. No `IHostedService`, no queue table worker, no retry/DLQ. | 🟡 Partial |
| **3.3 Leave Management & Makeup Credit Router** | 100% | ~50% | Leave request approve/reject endpoints exist; `InsertMakeupCreditAsync` is referenced. No makeup slot booking API or UI. No parent-side leave request creation. | 🟡 Partial |

**Epic 3 Coverage:** `(80 + 40 + 50) / 3 = 56.7%`

#### Critical Gaps

- **LINE notifications are unreliable**: `Task.Run()` can be killed on app restart; failures are silently swallowed.
- **Idempotency is incomplete**: Duplicate scan is checked in DB, but no `X-Idempotency-Key` middleware for payments or leave approvals.
- **Makeup slot booking missing**: `MakeupSlot` and `MakeupCredit` models exist but no booking flow.

---

### Epic 4 — Parent & Student Digital Experience Gateway

| Feature | Target | Actual Coverage | Evidence | Status |
|---------|--------|-----------------|----------|--------|
| **4.1 Zero-Password Parent Portal (LINE LIFF)** | 100% | ~5% | `Parent` model exists; `LineUserId` columns exist on `User` and `Parent`. No `@line/liff` dependency, no `/parent` routes, no `POST /api/parents/bind-line`, no child switcher. | 🔴 Early |
| **4.2 Student Digital Identity & QR Pass** | 100% | ~40% | `Student.QrToken` exists; `GET /api/students/{id}/qr` rotates token. No HMAC-SHA256 signature (uses `Guid.NewGuid()`). No printable PDF ID card, no student digital pass UI. | 🟡 Partial |
| **4.3 Multi-Child Dashboard & Real-Time Tracking** | 100% | ~0% | No parent dashboard, no aggregation API, no real-time feed. | 🔴 Not Started |

**Epic 4 Coverage:** `(5 + 40 + 0) / 3 = 15.0%`

#### Critical Gaps

- **Entire parent/student-facing UI missing**: The frontend only has `/admin/*` and marketing landing pages (`/`, `/contact`).
- **LINE integration absent**: No LIFF SDK, no Rich Menu handler, no `line_user_id` binding flow.
- **QR token is not secure**: Uses GUID instead of HMAC-SHA256 signed payload.

---

### Epic 5 — Academics, Gamification & Skill Analytics

| Feature | Target | Actual Coverage | Evidence | Status |
|---------|--------|-----------------|----------|--------|
| **5.1 Skill Card & Radar Progress** | 100% | ~80% | `SkillScoreEndpoints` supports batch update, topic CRUD, and per-student retrieval. Frontend `academics-page.jsx` includes radar chart. | 🟢 Mostly Done |
| **5.2 Digital Homework Submission & Review** | 100% | ~80% | `HomeworkEndpoints` supports assignment creation, submission listing, and grading. File upload service exists. | 🟢 Mostly Done |
| **5.3 Gamification Engine (Badges & Streaks)** | 100% | ~5% | No streak counter, no badge evaluator, no badge gallery UI. Only generic badge component exists for UI demo. | 🔴 Early |

**Epic 5 Coverage:** `(80 + 80 + 5) / 3 = 55.0%`

#### Critical Gaps

- **Gamification is not implemented**: Badges and streaks are UI decoration only; no backend logic evaluates attendance patterns.

---

### Epic 6 — Public Acquisition & School Operations Management

| Feature | Target | Actual Coverage | Evidence | Status |
|---------|--------|-----------------|----------|--------|
| **6.1 Dynamic Public Website & CMS** | 100% | ~10% | Only basic landing page (`Front/src/pages/index.jsx`) and `/contact` exist. No `/p/[institute_slug]`, no CMS for banners/teachers/portfolio. | 🔴 Early |
| **6.2 Trial Class Booking & Lead Pipeline** | 100% | ~0% | No public trial API, no lead table/Kanban board. | 🔴 Not Started |
| **6.3 Room Booking, Resource Allocation & Payroll** | 100% | ~25% | `Session.RoomId` exists in schema and UI. No room overlap validation, no teacher payroll calculation API. | 🔴 Early |

**Epic 6 Coverage:** `(10 + 0 + 25) / 3 = 11.7%`

#### Critical Gaps

- **Public-facing acquisition flow missing**: The product cannot capture leads or trial bookings from the web.
- **Operations automation missing**: Manual room scheduling with no conflict detection; teacher payroll is manual.

---

## Implementation Evidence Index

### Backend APIs Currently Implemented

| Endpoint Group | File | Status |
|----------------|------|--------|
| Authentication (login, register-institute, me, refresh, logout) | `API/Controllers/AuthEndpoints.cs` | ✅ Implemented |
| Users/Staff CRUD + role update | `API/Controllers/UserEndpoints.cs` | ✅ Implemented |
| Students + QR token | `API/Controllers/StudentEndpoints.cs` | ✅ Implemented |
| Teachers | `API/Controllers/TeacherEndpoints.cs` | ✅ Implemented |
| Courses (polymorphic types) | `API/Controllers/CourseEndpoints.cs` | ✅ Implemented |
| Sessions | `API/Controllers/SessionEndpoints.cs` | ✅ Implemented |
| Enrollments | `API/Controllers/EnrollmentEndpoints.cs` | ✅ Implemented |
| Attendance scan/manual/daily | `API/Controllers/AttendanceEndpoints.cs` | ✅ Implemented |
| Payments | `API/Controllers/PaymentEndpoints.cs` | ✅ Implemented (no role policy) |
| Products | `API/Controllers/ProductEndpoints.cs` | ✅ Implemented |
| Homework + grading | `API/Controllers/HomeworkEndpoints.cs` | ✅ Implemented |
| Skill scores + topics | `API/Controllers/SkillScoreEndpoints.cs` | ✅ Implemented |
| Leave requests approve/reject | `API/Controllers/LeaveRequestEndpoints.cs` | ✅ Implemented |
| Institute update | `API/Controllers/InstituteEndpoints.cs` | ✅ Implemented |
| File uploads | `API/Controllers/FileUploadEndpoints.cs` | ✅ Implemented |

### Backend APIs NOT Implemented

| Missing Capability | Why It Matters |
|--------------------|----------------|
| `POST /api/parents/bind-line` | Required for LINE LIFF parent login |
| `GET /api/parents/me/dashboard` | Required for parent multi-child dashboard |
| Wallet top-up/deduct/ledger APIs | Required for credit-based courses |
| PromptPay QR generator | Required for parent self-payment |
| AI slip verification endpoint | Required for automated payment confirmation |
| Public trial booking API | Required for lead acquisition |
| Room overlap validation API | Required to prevent double-booking |
| Teacher payroll calculation API | Required for automated payroll |
| PDF receipt generation service | Currently only hardcoded URL |
| PDPA data export & right-to-be-forgotten | Required for legal compliance |
| Background notification queue worker | Required for reliable LINE delivery |

### Frontend Pages Currently Implemented

| Page | Path | Status |
|------|------|--------|
| Landing page | `/`, `/contact` | ✅ Basic |
| Login / Register / Forgot Password | `/login`, `/register`, `/forgot-password` | ✅ Implemented |
| Admin Dashboard | `/admin/dashboard` | ✅ Implemented |
| Admin Students + Add/Profile | `/admin/students`, `/admin/students/add`, `/admin/students/:id` | ✅ Implemented |
| Admin Teachers | `/admin/teachers` | ✅ Implemented |
| Admin Courses + Sessions | `/admin/courses`, `/admin/courses/:courseId/sessions` | ✅ Implemented |
| Admin Attendance | `/admin/attendance` | ✅ Implemented |
| Admin Requests | `/admin/requests` | ✅ Implemented |
| Admin Academics | `/admin/academics` | ✅ Implemented |
| Admin Finance | `/admin/finance` | ✅ Implemented |
| Admin Products | `/admin/products` | ✅ Implemented |
| Admin Users | `/admin/users` | ✅ Implemented |
| Admin Settings | `/admin/settings` | ✅ Implemented |

### Frontend Pages NOT Implemented

| Missing Page | Epic |
|--------------|------|
| LINE LIFF Parent Portal | Epic 4 |
| Parent Dashboard / Child Switcher | Epic 4 |
| Student Digital Pass / QR Card | Epic 4 |
| Public institute website (`/p/[slug]`) | Epic 6 |
| Trial booking form | Epic 6 |
| Admin Lead Kanban board | Epic 6 |
| Room allocation calendar | Epic 6 |
| Teacher payroll report | Epic 6 |

---

## Risk Assessment

| Risk Area | Severity | Likelihood | Mitigation Priority |
|-----------|----------|------------|---------------------|
| Backend missing role-based authorization | 🔴 High | High | P0 — fix before production |
| LINE notifications lost on app restart | 🟡 Medium | Medium | P1 — implement queue + background worker |
| Wallet/credit engine not implemented | 🔴 High | High | P1 — blocks credit course model |
| PDF receipts are fake URLs | 🟡 Medium | High | P1 — implement QuestPDF |
| No parent/student portals | 🔴 High | High | P1 — required for product value proposition |
| No public lead acquisition | 🟡 Medium | Medium | P2 — affects growth |
| QR token uses GUID not HMAC | 🟡 Medium | Low | P2 — security hardening |
| No room conflict detection | 🟡 Medium | Medium | P2 — operational risk |

---

## Recommendations

### Immediate (P0 — Next 1-2 Sprints)

1. **Enforce role-based authorization on backend**
   - Add policies in `Program.cs`: `AdminOnly`, `TeacherOrAdmin`, `StaffOrAdmin`.
   - Apply `.RequireAuthorization("AdminOnly")` to `/api/payments`, user management, and institute settings.

2. **Fix LINE notification reliability**
   - Replace `Task.Run()` fire-and-forget with `System.Threading.Channels` + `IHostedService` background worker.
   - Add retry with exponential backoff and DLQ.

### Short-Term (P1 — Next 1-2 Months)

3. **Implement wallet/credit engine**
   - Build `IWalletService` with atomic deduct/top-up and immutable ledger.
   - Wire credit deduction into attendance scan for `course_type = credit`.

4. **Generate real PDF receipts**
   - Integrate QuestPDF or DinkToPdf.
   - Store generated PDFs in S3/R2 and return actual URLs.

5. **Build parent portal MVP**
   - Add `@line/liff` SDK.
   - Implement `POST /api/parents/bind-line`.
   - Create parent dashboard with child switcher.

### Medium-Term (P2 — 2-4 Months)

6. **Add public acquisition features**
   - Public institute landing page.
   - Trial booking form + admin lead pipeline.

7. **Harden QR tokens with HMAC-SHA256**
   - Sign `student_id + institute_id + secret` instead of GUID.

8. **Add room overlap validation and payroll calculation**
   - Validate `(start1 < end2) AND (end1 > start2)` before saving sessions.
   - Aggregate `actual_start_at/actual_end_at` × `hourly_rate`.

---

## Conclusion

TiwHub has a solid **administrative core** in place: multi-tenant isolation, polymorphic courses, attendance scanning, payments, homework, and skill scoring are all functional and demonstrate strong engineering fundamentals. However, the product is currently an **"Admin-Only MVP"** — the parent/student experience, public acquisition, advanced financial automation, and gamification layers described in the Epic documents are largely unimplemented.

**Overall implementation coverage: ~43%**, with the heaviest remaining work concentrated in:

- Epic 4 (Parent/Student Gateway)
- Epic 6 (Public Acquisition & Operations)
- Epic 2.2/2.4 (Wallet & Automated Payments)

The most urgent technical debt is **backend authorization enforcement** and **reliable LINE notification delivery**. Addressing these two items will significantly harden the existing MVP before expanding feature scope.
