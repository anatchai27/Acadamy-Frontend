# รายงานรีวิว Epic และความคืบหน้า TiwHub

**วันที่รายงาน:** 2026-08-01  
**ผู้รีวิว:** Senior Software Engineer / Tech Lead  
**ขอบเขต:** เปรียบเทียบความต้องการในเอกสาร Epic (`C:\Project\Acadamy-Frontend\Epic`) กับโค้ดจริงใน `API/` และ `Front/`  
**วิธีการ:** ตรวจสอบโค้ด controllers, services, models, frontend pages, และ database context ตาม acceptance criteria ของแต่ละ Epic/Feature/User Story  
**ฐานข้อมูลที่ใช้ต่อ:** TiDB MySQL (Distributed SQL)

---

## สรุปผลรวม

| ตัวชี้วัด | ค่า |
|-----------|------|
| **จำนวน Epic ทั้งหมด** | 6 |
| **จำนวน Feature ทั้งหมด** | 20 |
| **ความคืบหน้ารวม** | **~43%** |
| **ความคืบหน้า Backend API** | ~52% |
| **ความคืบหน้า Frontend UI** | ~34% |
| **Epic ที่คืบหน้ามากที่สุด** | Epic 1 — Platform Foundation (62.5%) |
| **Epic ที่คืบหน้าน้อยที่สุด** | Epic 6 — Public Acquisition (11.7%) |

### ข้อค้นพบสำคัญ

1. **Core workflow ฝั่ง Admin ใช้งานได้แล้วส่วนใหญ่** — การจัดการนักเรียน, คอร์ส, คาบเรียน, เช็คชื่อ, การเงิน, คะแนนทักษะ, การบ้าน, และคำร้องขอลา ล้วนมี API และหน้า Admin UI ที่ใช้งานได้
2. **Parent/Student Portal ยังเกือบไม่มีอะไรเลย** — ยังไม่มี LINE LIFF, ไม่มี Parent Dashboard, ไม่มี Digital Student Pass UI, ไม่มี Public Website, และไม่มีระบบจองทดลองเรียน
3. **Feature ทางการเงินและระบบอัตโนมัติขั้นสูงยังเป็นแค่แผน** — Credit Wallet, PromptPay QR, AI ตรวจสลิป, Gamification, Payroll, และการตรวจจับห้องเรียนชน ยังไม่ได้ implement
4. **Security Hardening ยังไม่สมบูรณ์** — Backend ตรวจสอบ login แล้ว แต่ยังไม่ได้บังคับ role-based authorization จริงจัง (เช่น `/api/payments` ใคร login ก็เรียกได้ ไม่ใช่แค่ admin)
5. **ระบบส่ง LINE ยังไม่น่าเชื่อถือ** — ยังใช้ `Task.Run()` แบบ fire-and-forget แทนที่จะเป็น queue + background worker ที่มี retry

---

## ความคืบหน้าแยกตาม Epic

| Epic | จำนวน Feature | ความคืบหน้า | สถานะ |
|------|--------------|------------|--------|
| Epic 1 — Platform Foundation & Multi-Tenant Core | 4 | **62.5%** | 🟡 บางส่วน |
| Epic 2 — Flexible Course Engine & Financial Ecosystem | 4 | **50.0%** | 🟡 บางส่วน |
| Epic 3 — High-Throughput Operations & Attendance | 3 | **56.7%** | 🟡 บางส่วน |
| Epic 4 — Parent & Student Digital Experience | 3 | **15.0%** | 🔴 เริ่มต้น |
| Epic 5 — Academics, Gamification & Skill Analytics | 3 | **55.0%** | 🟡 บางส่วน |
| Epic 6 — Public Acquisition & School Operations | 3 | **11.7%** | 🔴 เริ่มต้น |
| **รวม** | **20** | **~43.3%** | 🟡 |

---

## วิเคราะห์ราย Epic

### Epic 1 — Platform Foundation & Multi-Tenant Core Architecture

| Feature | เป้าหมาย | คืบหน้าจริง | หลักฐาน | สถานะ |
|---------|----------|------------|---------|--------|
| **1.1 Multi-Tenant Data Isolation & Query Filter** | 100% | ~90% | `TenantMiddleware` ดึง `institute_id`; `TutoringDbContext.ApplyTenantFilters()` ใช้ `HasQueryFilter` กับตาราง `IMultiTenantEntity` ทั้งหมด; `AuditTenantSaveChangesInterceptor` เติม `InstituteId` ตอน insert อัตโนมัติ | 🟢 เกือบเสร็จ |
| **1.2 Tenant Onboarding & White-Labeling** | 100% | ~60% | `POST /api/auth/register-institute` สร้าง institute + admin แบบ atomic ได้แล้ว แต่ logo ยังเก็บเป็น base64 string ไม่ได้อัปโหลด S3/WebP ยังไม่มี white-label CMS หรือ branding บนใบเสร็จ | 🟡 บางส่วน |
| **1.3 RBAC & Staff Directory** | 100% | ~50% | มี `UserRole` enum (admin/teacher/staff/parent/student) Frontend sidebar ใช้ `roles` แล้ว แต่ Backend ใช้แค่ `.RequireAuthorization()` — ยังไม่มี policy ตรวจ role Staff CRUD มีแล้วแต่ self-deletion check ยังไม่แข็งแรง | 🟡 บางส่วน |
| **1.4 PDPA Compliance & Consent Management** | 100% | ~50% | มี model/table `PdpaConsent` บันทึก consent พร้อม IP ตอนเพิ่มนักเรียน แต่ยังไม่มี PDPA modal แยก, ไม่มี data export, ไม่มี endpoint ลบข้อมูลตามสิทธิ์ | 🟡 บางส่วน |

**ค่าเฉลี่ย Epic 1:** `(90 + 60 + 50 + 50) / 4 = 62.5%`

#### ช่องโหว่สำคัญ

- **Backend ยังไม่ได้ enforce ตาม role** — `PaymentEndpoints`, `CourseEndpoints`, `UserEndpoints` และ controller ส่วนใหญ่ ตรวจแค่ login ไม่ได้เช็ค role ผู้ใช้ token บทบาท `teacher` หรือ `parent` สามารถยิง `POST /api/payments` ได้โดยตรง
- **White-label branding** — `Institute.LogoUrl` รับ base64 ไม่มีการแปลงไฟล์, CDN, หรือใส่ลงใบเสร็จ PDF
- **PDPA workflow** — การยินยอมเป็นแค่ส่วนหนึ่งของการเพิ่มนักเรียน ไม่มี versioning, ไม่มี parent-specific consent flow, ไม่มี audit export

---

### Epic 2 — Flexible Course Engine & Multi-Model Financial Ecosystem

| Feature | เป้าหมาย | คืบหน้าจริง | หลักฐาน | สถานะ |
|---------|----------|------------|---------|--------|
| **2.1 Polymorphic Course Engine** | 100% | ~85% | `Course.CourseType` รองรับ `group`, `private`, `subscription`, `video`, `credit` `CourseService.ValidateCourseTypeFields()` บังคับกฎตามประเภท UI ใน `courses-page.jsx` ปรับฟอร์มตามประเภทคอร์ส | 🟢 เกือบเสร็จ |
| **2.2 Multi-Tenant Credit Wallet & Ledger** | 100% | ~30% | มี model `StudentWallet` และ `WalletTransaction` ใน DB รองรับ course type "credit" แต่ยังไม่มี wallet service, ไม่มี API เติม/หัก, ไม่มีการบังคับ balance >= 0 | 🔴 เริ่มต้น |
| **2.3 Billing, Automated Invoicing & PDF Receipts** | 100% | ~75% | `PaymentService.CreateAsync()` สร้าง `invoiceNo`, ส่ง URL PDF, แจ้งเตือน LINE แต่ยังไม่มี library สร้าง PDF จริง (QuestPDF/DinkToPdf) — มีแค่ hardcoded URL | 🟡 บางส่วน |
| **2.4 Payment Gateway & AI Slip Verification** | 100% | ~10% | ไม่มี PromptPay QR generator, ไม่มี EasySlip/SlipOK มี endpoint อัปโหลดสลิป (`/api/uploads/payment-slip`) แต่เก็บแค่ไฟล์ ไม่มี AI validation | 🔴 เริ่มต้น |

**ค่าเฉลี่ย Epic 2:** `(85 + 30 + 75 + 10) / 4 = 50.0%`

#### ช่องโหว่สำคัญ

- **Wallet engine มีแค่ schema** — ตารางมี แต่ไม่มี business logic หรือ API
- **PDF receipt เป็น URL ปลอม** — `receiptPdfUrl = $"https://storage.tiwhub.com/receipts/{invoiceNo}.pdf"` สร้าง string แต่ไม่มีไฟล์จริง
- **ไม่มีระบบยืนยันการชำระเงินอัตโนมัติ** — Admin ต้องคอยบันทึกเงินด้วยมือในหน้า `/admin/finance`

---

### Epic 3 — High-Throughput Daily Operations & Gate Attendance

| Feature | เป้าหมาย | คืบหน้าจริง | หลักฐาน | สถานะ |
|---------|----------|------------|---------|--------|
| **3.1 High-Concurrency Dynamic QR Attendance Gate** | 100% | ~80% | `POST /api/attendance/scan` ตรวจ QR token, เช็ค duplicate, จัดการ billing method ตาม `group/private/subscription/credit/video`, บันทึกเช็คชื่อแบบ transaction มี manual attendance ด้วย | 🟢 เกือบเสร็จ |
| **3.2 Event-Driven LINE Push Queue** | 100% | ~40% | มี `ILineNotificationService` และ `LineNotificationService` แต่ `AttendanceService` และ `PaymentService` เรียก LINE ผ่าน `Task.Run()` แบบ fire-and-forget ยังไม่มี `IHostedService`, worker queue, retry/DLQ | 🟡 บางส่วน |
| **3.3 Leave Management & Makeup Credit Router** | 100% | ~50% | มี endpoint approve/reject คำร้องขอลา มี `InsertMakeupCreditAsync` แต่ยังไม่มี API/UI จอง makeup slot และไม่มีการสร้างคำร้องลาฝั่ง parent | 🟡 บางส่วน |

**ค่าเฉลี่ย Epic 3:** `(80 + 40 + 50) / 3 = 56.7%`

#### ช่องโหว่สำคัญ

- **LINE notification ไม่น่าเชื่อถือ** — `Task.Run()` อาจถูก kill เมื่อ app restart ความล้มเหลวถูกกลืนเงียบ
- **Idempotency ยังไม่สมบูรณ์** — ตรวจ duplicate scan ใน DB แล้ว แต่ยังไม่มี `X-Idempotency-Key` middleware สำหรับ payment หรือ leave approval
- **Makeup slot booking ยังขาด** — มี model `MakeupSlot` และ `MakeupCredit` แต่ไม่มี flow จอง

---

### Epic 4 — Parent & Student Digital Experience Gateway

| Feature | เป้าหมาย | คืบหน้าจริง | หลักฐาน | สถานะ |
|---------|----------|------------|---------|--------|
| **4.1 Zero-Password Parent Portal (LINE LIFF)** | 100% | ~5% | มี model `Parent` และคอลัมน์ `LineUserId` ใน `User`/`Parent` แต่ยังไม่มี `@line/liff`, ไม่มี route `/parent`, ไม่มี `POST /api/parents/bind-line`, ไม่มี child switcher | 🔴 เริ่มต้น |
| **4.2 Student Digital Identity & QR Pass** | 100% | ~40% | มี `Student.QrToken` และ `GET /api/students/{id}/qr` rotate token ได้ แต่ไม่ใช่ HMAC-SHA256 (ใช้ `Guid.NewGuid()`) ไม่มี PDF บัตรนักเรียน, ไม่มี UI Digital Pass | 🟡 บางส่วน |
| **4.3 Multi-Child Dashboard & Real-Time Tracking** | 100% | ~0% | ไม่มี parent dashboard, ไม่มี aggregation API, ไม่มี real-time feed | 🔴 ยังไม่เริ่ม |

**ค่าเฉลี่ย Epic 4:** `(5 + 40 + 0) / 3 = 15.0%`

#### ช่องโหว่สำคัญ

- **UI ฝั่ง parent/student ขาดหมด** — Frontend มีแค่ `/admin/*` และหน้า landing เท่านั้น
- **ไม่มี LINE integration** — ไม่มี LIFF SDK, Rich Menu handler, หรือ flow ผูก `line_user_id`
- **QR token ไม่ปลอดภัย** — ใช้ GUID แทน HMAC-SHA256 signed payload

---

### Epic 5 — Academics, Gamification & Skill Analytics

| Feature | เป้าหมาย | คืบหน้าจริง | หลักฐาน | สถานะ |
|---------|----------|------------|---------|--------|
| **5.1 Skill Card & Radar Progress** | 100% | ~80% | `SkillScoreEndpoints` รองรับ batch update, topic CRUD, ดึงตาม student หน้า `academics-page.jsx` มี radar chart | 🟢 เกือบเสร็จ |
| **5.2 Digital Homework Submission & Review** | 100% | ~80% | `HomeworkEndpoints` รองรับสั่งการบ้าน, ดู submission, ให้คะแนน มี file upload service | 🟢 เกือบเสร็จ |
| **5.3 Gamification Engine (Badges & Streaks)** | 100% | ~5% | ไม่มี streak counter, ไม่มี badge evaluator, ไม่มี badge gallery UI มีแค่ component badge ทั่วไปสำหรับ demo | 🔴 เริ่มต้น |

**ค่าเฉลี่ย Epic 5:** `(80 + 80 + 5) / 3 = 55.0%`

#### ช่องโหว่สำคัญ

- **Gamification ยังไม่ได้ implement จริง** — Badge และ Streak เป็นแค่ decoration ใน UI ไม่มี backend logic วิเคราะห์ pattern การเข้าเรียน

---

### Epic 6 — Public Acquisition & School Operations Management

| Feature | เป้าหมาย | คืบหน้าจริง | หลักฐาน | สถานะ |
|---------|----------|------------|---------|--------|
| **6.1 Dynamic Public Website & CMS** | 100% | ~10% | มีหน้า landing พื้นฐาน (`Front/src/pages/index.jsx`) และ `/contact` แต่ไม่มี `/p/[institute_slug]`, ไม่มี CMS จัดการ banner/ครู/ผลงาน | 🔴 เริ่มต้น |
| **6.2 Trial Class Booking & Lead Pipeline** | 100% | ~0% | ไม่มี public trial API, ไม่มี lead table/Kanban board | 🔴 ยังไม่เริ่ม |
| **6.3 Room Booking, Resource Allocation & Payroll** | 100% | ~25% | มี `Session.RoomId` ใน schema และ UI แต่ไม่มี room overlap validation, ไม่มี payroll calculation API | 🔴 เริ่มต้น |

**ค่าเฉลี่ย Epic 6:** `(10 + 0 + 25) / 3 = 11.7%`

#### ช่องโหว่สำคัญ

- **ไม่มี public acquisition flow** — ผลิตภัณฑ์ยังไม่สามารถดักจับ lead หรือรับจองทดลองเรียนจากเว็บได้
- **Operations automation ยังขาด** — จัดตารางห้องเรียนด้วยมือ ไม่มี conflict detection คิดเงินครูก็ยัง manual

---

## สารบัญหลักฐานการ Implement

### Backend APIs ที่ทำแล้ว

| กลุ่ม Endpoint | ไฟล์ | สถานะ |
|----------------|------|--------|
| Authentication (login, register-institute, me, refresh, logout) | `API/Controllers/AuthEndpoints.cs` | ✅ ทำแล้ว |
| Users/Staff CRUD + อัปเดต role | `API/Controllers/UserEndpoints.cs` | ✅ ทำแล้ว |
| Students + QR token | `API/Controllers/StudentEndpoints.cs` | ✅ ทำแล้ว |
| Teachers | `API/Controllers/TeacherEndpoints.cs` | ✅ ทำแล้ว |
| Courses (polymorphic types) | `API/Controllers/CourseEndpoints.cs` | ✅ ทำแล้ว |
| Sessions | `API/Controllers/SessionEndpoints.cs` | ✅ ทำแล้ว |
| Enrollments | `API/Controllers/EnrollmentEndpoints.cs` | ✅ ทำแล้ว |
| Attendance scan/manual/daily | `API/Controllers/AttendanceEndpoints.cs` | ✅ ทำแล้ว |
| Payments | `API/Controllers/PaymentEndpoints.cs` | ✅ ทำแล้ว (ยังไม่มี role policy) |
| Products | `API/Controllers/ProductEndpoints.cs` | ✅ ทำแล้ว |
| Homework + ให้คะแนน | `API/Controllers/HomeworkEndpoints.cs` | ✅ ทำแล้ว |
| Skill scores + topics | `API/Controllers/SkillScoreEndpoints.cs` | ✅ ทำแล้ว |
| Leave requests approve/reject | `API/Controllers/LeaveRequestEndpoints.cs` | ✅ ทำแล้ว |
| Institute update | `API/Controllers/InstituteEndpoints.cs` | ✅ ทำแล้ว |
| File uploads | `API/Controllers/FileUploadEndpoints.cs` | ✅ ทำแล้ว |

### Backend APIs ที่ยังไม่ได้ทำ

| ความสามารถที่ขาด | ทำไมถึงสำคัญ |
|--------------------|----------------|
| `POST /api/parents/bind-line` | จำเป็นสำหรับ parent login ผ่าน LINE LIFF |
| `GET /api/parents/me/dashboard` | จำเป็นสำหรับ parent multi-child dashboard |
| Wallet top-up/deduct/ledger APIs | จำเป็นสำหรับคอร์สแบบ credit |
| PromptPay QR generator | จำเป็นสำหรับให้ parent จ่ายเงินเอง |
| AI slip verification endpoint | จำเป็นสำหรับยืนยันการชำระเงินอัตโนมัติ |
| Public trial booking API | จำเป็นสำหรับดักจับ lead |
| Room overlap validation API | จำเป็นสำหรับป้องกันจองห้องซ้อน |
| Teacher payroll calculation API | จำเป็นสำหรับคำนวณค่าสอนอัตโนมัติ |
| PDF receipt generation service | ตอนนี้มีแค่ URL ปลอม |
| PDPA data export & right-to-be-forgotten | จำเป็นสำหรับ compliance |
| Background notification queue worker | จำเป็นสำหรับส่ง LINE ให้น่าเชื่อถือ |

### Frontend Pages ที่ทำแล้ว

| หน้า | Path | สถานะ |
|------|------|--------|
| Landing page | `/`, `/contact` | ✅ พื้นฐาน |
| Login / Register / Forgot Password | `/login`, `/register`, `/forgot-password` | ✅ ทำแล้ว |
| Admin Dashboard | `/admin/dashboard` | ✅ ทำแล้ว |
| Admin Students + Add/Profile | `/admin/students`, `/admin/students/add`, `/admin/students/:id` | ✅ ทำแล้ว |
| Admin Teachers | `/admin/teachers` | ✅ ทำแล้ว |
| Admin Courses + Sessions | `/admin/courses`, `/admin/courses/:courseId/sessions` | ✅ ทำแล้ว |
| Admin Attendance | `/admin/attendance` | ✅ ทำแล้ว |
| Admin Requests | `/admin/requests` | ✅ ทำแล้ว |
| Admin Academics | `/admin/academics` | ✅ ทำแล้ว |
| Admin Finance | `/admin/finance` | ✅ ทำแล้ว |
| Admin Products | `/admin/products` | ✅ ทำแล้ว |
| Admin Users | `/admin/users` | ✅ ทำแล้ว |
| Admin Settings | `/admin/settings` | ✅ ทำแล้ว |

### Frontend Pages ที่ยังไม่ได้ทำ

| หน้าที่ขาด | สังกัด Epic |
|------------|------------|
| LINE LIFF Parent Portal | Epic 4 |
| Parent Dashboard / Child Switcher | Epic 4 |
| Student Digital Pass / QR Card | Epic 4 |
| Public institute website (`/p/[slug]`) | Epic 6 |
| Trial booking form | Epic 6 |
| Admin Lead Kanban board | Epic 6 |
| Room allocation calendar | Epic 6 |
| Teacher payroll report | Epic 6 |

---

## การประเมินความเสี่ยง

| ด้านความเสี่ยง | ความรุนแรง | โอกาสเกิด | ลำดับความสำคัญ |
|-----------|----------|------------|---------------------|
| Backend ยังไม่มี role-based authorization | 🔴 สูง | สูง | P0 — แก้ก่อน production |
| LINE notifications หายเมื่อ app restart | 🟡 ปานกลาง | ปานกลาง | P1 — ทำ queue + background worker |
| Wallet/credit engine ยังไม่ได้ทำ | 🔴 สูง | สูง | P1 — บล็อกคอร์ส credit |
| PDF receipts เป็น URL ปลอม | 🟡 ปานกลาง | สูง | P1 — ทำ QuestPDF |
| ไม่มี parent/student portals | 🔴 สูง | สูง | P1 — จำเป็นต่อ value proposition |
| ไม่มี public lead acquisition | 🟡 ปานกลาง | ปานกลาง | P2 — กระทบการเติบโต |
| QR token ใช้ GUID ไม่ใช่ HMAC | 🟡 ปานกลาง | ต่ำ | P2 — ยกระดับ security |
| ไม่มี room conflict detection | 🟡 ปานกลาง | ปานกลาง | P2 — ความเสี่ยง operations |

---

## ข้อแนะนำ

### ทันที (P0 — 1-2 Sprints ถัดไป)

1. **บังคับใช้ role-based authorization ฝั่ง Backend**
   - เพิ่ม policies ใน `Program.cs`: `AdminOnly`, `TeacherOrAdmin`, `StaffOrAdmin`
   - ใช้ `.RequireAuthorization("AdminOnly")` กับ `/api/payments`, user management, institute settings

2. **แก้ไขความน่าเชื่อถือของ LINE notification**
   - เปลี่ยนจาก `Task.Run()` fire-and-forget เป็น `System.Threading.Channels` + `IHostedService` background worker
   - เพิ่ม retry แบบ exponential backoff และ DLQ

### ระยะสั้น (P1 — 1-2 เดือน)

3. **สร้าง wallet/credit engine**
   - สร้าง `IWalletService` หัก/เติมแบบ atomic พร้อม immutable ledger
   - ผูกการหักเครดิตเข้ากับ attendance scan เมื่อ `course_type = credit`

4. **สร้าง PDF receipt จริง**
   - ใช้ QuestPDF หรือ DinkToPdf
   - เก็บ PDF ลง S3/R2 แล้วคืน URL จริง

5. **สร้าง parent portal MVP**
   - ติดตั้ง `@line/liff`
   - ทำ `POST /api/parents/bind-line`
   - สร้าง parent dashboard พร้อม child switcher

### ระยะกลาง (P2 — 2-4 เดือน)

6. **เพิ่ม public acquisition features**
   - หน้าเว็บสถาบันแบบ public
   - ฟอร์มจองทดลองเรียน + admin lead pipeline

7. **ยกระดับ QR token ด้วย HMAC-SHA256**
   -  sign `student_id + institute_id + secret` แทน GUID

8. **เพิ่ม room overlap validation และ payroll calculation**
   - ตรวจสอบ `(start1 < end2) AND (end1 > start2)` ก่อน save session
   - รวมชั่วโมงสอนจริง × `hourly_rate`

---

## แนวทางการใช้ TiDB MySQL ต่อจากนี้

เนื่องจากระบบเลือกใช้ **TiDB MySQL (Distributed SQL)** เป็นฐานข้อมูลหลัก ข้อควรระวังและแนวทางปฏิบัติที่สำคัญ:

### ✅ ข้อดีของ TiDB ที่เหมาะกับ TiwHub

1. **Horizontal Scalability** — เหมาะกับ multi-tenant ที่มีสถาบันและข้อมูลเติบโตในอนาคต
2. **MySQL Protocol Compatible** — EF Core Pomelo/MySQL provider ใช้งานได้เลย ไม่ต้องเปลี่ยน driver
3. **HTAP-ready** — รองรับ analytical queries ในอนาคตสำหรับรายงานการเงิน/การเรียน
4. **AUTO_RANDOM Primary Key** — ช่วยกระจาย write hotspot สำหรับตารางที่ insert หนาแน่น เช่น `attendances`, `wallet_transactions`

### ⚠️ ข้อควรระวังเฉพาะ TiDB

1. **หลีกเลี่ยง Global Query Filter ที่ JOIN หลายชั้น**
   - ในเอกสารเคยเสนอ `HasQueryFilter(a => a.Session.Course.InstituteId == ...)` ซึ่งทำให้ TiDB CPU พุ่งตอน concurrent spikes
   - ปัจจุบันโค้ดใช้ denormalized `InstituteId` ในแต่ละ entity แล้ว ควรรักษาวิธีนี้ต่อไป

2. **ใช้ AUTO_RANDOM กับตาราง high-write**
   - ควรประยุกต์ใช้กับ `attendances`, `notifications`, `wallet_transactions`, `payments` เพื่อป้องกัน hotspot

3. **Composite Index บน multi-tenant queries**
   - ทุกตารางควรมี index รูปแบบ `(institute_id, ..., id)` เพื่อให้ TiDB ใช้ partition pruning/region scan ได้ดี
   - ตัวอย่าง: `CREATE INDEX idx_students_tenant ON students(institute_id, deleted_at, id);`

4. **Transaction & Locking**
   - ใช้ `SELECT ... FOR UPDATE` ได้ แต่ระวังเรื่อง large transaction ใน TiDB
   - สำหรับ wallet/credit ควร implement pessimistic locking หรือ optimistic concurrency อย่างระมัดระวัง

5. **Avoid `COUNT(*)` บนตารางใหญ่โดยไม่มี index**
   - หน้า pagination ควรใช้ indexed column และเก็บ approximate count ถ้าไม่จำเป็นต้อง exact

### 🗺️ ลำดับการ implement บน TiDB ที่แนะนำ

| ลำดับ | งาน | เหตุผล |
|-------|------|---------|
| 1 | ตรวจสอบและปรับ index ทุกตารางให้มี `(institute_id, ...)` | รองรับ multi-tenant filter บน TiDB |
| 2 | เปลี่ยน primary key ของตาราง high-write เป็น `AUTO_RANDOM` | กระจาย write hotspot |
| 3 | Implement wallet service ด้วย `SELECT ... FOR UPDATE` | รองรับคอร์ส credit |
| 4 | สร้าง `notifications` queue table + background worker | แทน `Task.Run()` สำหรับ LINE |
| 5 | เพิ่ม lead/trial_bookings table | รองรับ public acquisition |
| 6 | เพิ่ม `room_bookings` หรือ `sessions` validation | ป้องกันห้องซ้อน |
| 7 | เพิ่ม `teacher_payroll_periods` + `session_actual_hours` | รองรับ payroll |

---

## บทสรุป

TiwHub มี **administrative core ที่แข็งแรง**: multi-tenant isolation, polymorphic courses, attendance scanning, payments, homework, และ skill scoring ล้วนใช้งานได้และแสดงให้เห็นพื้นฐานวิศวกรรมที่ดี อย่างไรก็ตาม ผลิตภัณฑ์ตอนนี้ยังเป็น **"Admin-Only MVP"** — parent/student experience, public acquisition, advanced financial automation, และ gamification ที่ระบุไว้ในเอกสาร Epic ยังไม่ได้ implement เกือบทั้งหมด

**ความคืบหน้ารวม: ~43%** โดยงานที่เหลือหนักๆ อยู่ที่:

- Epic 4 (Parent/Student Gateway)
- Epic 6 (Public Acquisition & Operations)
- Epic 2.2/2.4 (Wallet & Automated Payments)

หนี้สินทางเทคนิคที่เร่งด่วนที่สุดคือ **การบังคับใช้สิทธิ์ฝั่ง backend** และ **ระบบส่ง LINE notification ที่น่าเชื่อถือ** ถ้าแก้สองส่วนนี้ได้ MVP ที่มีอยู่จะแข็งแรงขึ้นมาก ก่อนขยาย feature ใหม่

---

**หมายเหตุ:** รายงานนี้จัดทำขึ้นเพื่อใช้เป็นแผน roadmap ต่อไปบนฐานข้อมูล **TiDB MySQL** ซึ่งรองรับการเติบโตของ multi-tenant SaaS ได้ดี แต่ต้องออกแบบ index และ transaction ให้เหมาะสม
