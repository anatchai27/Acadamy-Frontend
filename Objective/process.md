# รายงานหลักฐานและสถานะการพัฒนาโครงการ (Evidence & Implementation Status)

> **วันที่ประเมิน:** 13 กันยายน 2026  
> **เอกสารอ้างอิงหลัก:** `Objective/ProjectObj.md` (SRS Tutoring Management System)
> **Schema evidence ล่าสุด:** `Objective/results-2026-09-12-220648.csv`
> **ขอบเขตการตรวจสอบ:** ตรวจจากไฟล์ซอร์ส, model, endpoint และ schema ที่พบใน workspace ของ `API` (.NET 9), `Front` (Preact + Vite), และ `LineLiff` (Preact + LIFF SDK + Tailwind v4) แล้วเทียบกับ Acceptance Criteria (AC) ทั้ง 67 ข้อ รวมผล API contract validation, API build และ test suite ล่าสุด
>
> **ข้อจำกัดของรายงาน:** เอกสารนี้เป็น static code/schema assessment ไม่ใช่ผลทดสอบ production runtime, ไม่ใช่ผล load test หรือ security penetration test เว้นแต่จะระบุหลักฐานการทดสอบไว้โดยตรง

### วิธีอ่านสถานะ

- `[x]` = พบหลักฐานในโค้ดหรือ schema ที่สอดคล้องกับ AC จากขอบเขตที่ตรวจ
- `[/]` = พบการทำงานบางส่วน แต่ยังไม่ครบ AC
- `[ ]` = ยังไม่พบหลักฐานเพียงพอในขอบเขตที่ตรวจ ไม่ได้แปลว่าระบบไม่มีแน่นอน
- การมีตาราง/คอลัมน์ใน CSV เป็นหลักฐานระดับ schema เท่านั้น ไม่ถือว่า workflow, API, UI, worker, notification หรือ transaction ผ่าน SRS โดยอัตโนมัติ
- เปอร์เซ็นต์และชื่อสถานะเป็นผลประเมินจากหลักฐาน ไม่ใช่ metric ที่ระบบคำนวณอัตโนมัติ
- รายการ "สิ่งที่ต้องปรับปรุงต่อ" และ Priority P0/P1/P2 เป็นข้อเสนอแนะ ไม่ใช่ข้อเท็จจริงจาก runtime

---

## 1. สรุปภาพรวมความคืบหน้า (Executive Overview)

```text
[████████████████████████████░░░░░░░░░░░░░░░░░░░░░░] 57% (38.0 / 67 Acceptance Criteria)
```

- **ผลประเมินจากหลักฐานที่ตรวจ:** อยู่ในขั้น **Feature Integration & Stabilization**
- **ส่วนที่ทำได้ดีแล้ว:** สถาปัตยกรรม Multi-tenant, ระบบล็อกอิน/สิทธิ์, การจัดการนักเรียนและผู้ปกครอง, การสแกนเช็คชื่อและ checkout พร้อมบันทึกผู้รับ/audit log, ระบบส่งออกข้อมูลนักเรียนเป็น CSV และบัตรนักเรียน PDF, ระบบรับชำระเงินและออกใบเสร็จ PDF จริง, ระบบตรวจสอบสลิป, ระบบแจ้งลาและจองเรียนชดเชยบน LINE LIFF พร้อมแนบไฟล์หลักฐาน
- **ส่วนที่ยังต้องพัฒนาต่อเร่งด่วน:** notification logging ให้ครอบคลุม flow เดิมทั้งหมด, แก้ Front legacy dashboard tests, runtime load-test evidence, หน้ารายงาน Analytics และหน้า Public Website/CMS

### หลักฐาน validation ล่าสุด

- API contract validator: `92` current operations, `96` target operations, `Errors = 0` (`Objective/validate-api-contract.ps1`)
- API build: ผ่านด้วย output `API/bin/DodValidation`
- Full API test suite: `256 passed, 0 failed, 0 skipped`
- Front build: ผ่าน (`npm.cmd run build`)
- LineLiff build: ผ่าน (`npm.cmd run build`)
- Front full suite: `76 passed, 0 failed, 0 skipped`; `dashboard-page.test.jsx`: `30 passed, 0 failed`
- Controller ownership audit: direct EF/data access ลดลงเหลือ 1 controller file รวม 38 matches (จากเดิม 7 files / 101 matches); `TeacherEndpoints.cs`, `UserEndpoints.cs` และ `AuthEndpoints.cs` เหลือ 0
- Schema evidence: `Objective/results-2026-09-12-220648.csv` (ยืนยันตาราง `leave_request_attachments` เรียบร้อย)

### หลักฐาน Slice 1: Front legacy dashboard tests

- แยกสาเหตุ failure เดิมเป็น assertion ที่อ้าง UI รุ่นเก่า (`tiwhub`, heading/grid เดิม) และ test harness ที่ส่ง React-compatible/frozen VNode จาก `react-icons` เข้า Preact โดยตรง
- ปรับเฉพาะ `Front/src/pages/admin/__tests__/dashboard-page.test.jsx`: mock provider/effect และ icon boundary ให้เหมาะกับ unit test, แล้วปรับ assertion ให้ตรงกับ dashboard implementation ปัจจุบัน (`oasis`, `BentoGrid`, greeting ปัจจุบัน)
- ไม่แก้ `dashboard-page.jsx` และไม่ลบหรือ skip test
- Validation หลังแก้: `npm.cmd test -- --run` ผ่าน `76/76`; `npm.cmd run build` ผ่าน

### หลักฐาน Slice 2: Notification logging flow หลัก

- `AttendanceService.ScanAsync` และ `PaymentService.CreateAsync` ไม่เรียก `SendAttendanceNotificationAsync`/`SendPaymentNotificationAsync` โดยตรงแล้ว แต่สร้าง `BackgroundNotificationCandidate` และใช้ `IBackgroundNotificationDispatcher` เดียวกับ background jobs
- Notification types และ idempotency keys ที่ใช้จริง:
  - `attendance_checkin` → `attendance_checkin:{sessionId}:{studentId}:{parentId}`
  - `payment_received` → `payment_received:{paymentId}:{parentId}`
- การสร้าง payment และ attendance transaction ยังคงอยู่ใน repository เดิม; notification dispatch เกิดหลัง persistence สำเร็จ และใช้ `CancellationToken.None` เพื่อไม่ให้ request cancellation ตัดการบันทึก log หลัง commit
- ข้อความ notification ถูกย้ายมาไว้ใน `NotificationMessageFactory` โดยคงเนื้อหา LINE เดิม และ dispatcher เป็นจุดเดียวที่สร้าง pending record, ส่ง provider, mark `sent` หรือ mark `retrying/failed`
- Focused notification/attendance/payment tests: `27 passed / 0 failed`; full API tests: `256 passed / 0 failed / 0 skipped`; API build และ test build ผ่าน
- ข้อจำกัดที่ยืนยันจาก schema/code: `notifications` ยังไม่มี unique idempotency column/constraint ดังนั้นการกัน race ระหว่างหลาย API instances ยังเป็น application-level check และอาจสร้าง duplicate pending rows ได้เมื่อ concurrent ก่อน `FindByIdempotencyKeyAsync` เห็นข้อมูลเดียวกัน

---

## 2. ตารางสรุปความคืบหน้าแยกตาม 12 หมวดหมู่

| หมวด | ชื่อระบบ / Objective | ผ่านตามหลักฐาน | ทั้งหมด | เปอร์เซ็นต์ประเมิน | สถานะประเมิน |
|:---:|---|:---:|:---:|:---:|:---:|
| **1** | Authentication & RBAC (ความปลอดภัยและการจัดการสิทธิ์) | 5 | 6 | **83%** | 🟢 ใกล้สมบูรณ์ |
| **2** | Student Management (ประวัตินักเรียนและออกบัตร QR) | 6.5 | 7 | **93%** | 🟢 ใกล้สมบูรณ์ |
| **3** | QR Attendance (ระบบเช็คชื่อ หักโควต้า และแจ้งเตือน) | 4.5 | 7 | **64%** | 🟡 กำลังพัฒนา |
| **4** | Leave & Make-up (ระบบแจ้งลาและบริหารคลาสชดเชย) | 4.0 | 5 | **80%** | 🟢 ใกล้สมบูรณ์ |
| **5** | Skill Card & Gamification (การ์ดพลังและประเมินผล) | 2.5 | 5 | **50%** | 🟡 กำลังพัฒนา |
| **6** | Homework System (การบ้านและการตรวจงานออนไลน์) | 2.5 | 5 | **50%** | 🟡 กำลังพัฒนา |
| **7** | Payment & Billing (รับชำระเงินและออกใบเสร็จ) | 3.0 | 5 | **60%** | 🟡 กำลังพัฒนา |
| **8** | Public Website & CMS (เว็บไซต์ประชาสัมพันธ์และหาลูกค้า) | 1.5 | 5 | **30%** | 🔴 ต้องเร่งทำ |
| **9** | LINE Integration (Push, LIFF App, Rich Menu, Bot) | 2.5 | 6 | **42%** | 🟡 กำลังพัฒนา |
| **10** | Reports & Analytics (รายงานเชิงวิเคราะห์สำหรับผู้บริหาร) | 1.5 | 5 | **30%** | 🔴 ต้องเร่งทำ |
| **11** | Operations & Compliance (จัดการหลังบ้านและ PDPA) | 2 | 6 | **33%** | 🔴 ต้องเร่งทำ |
| **12** | Architecture & NFR (ประสิทธิภาพ ความปลอดภัย สถาปัตยกรรม) | 2.5 | 5 | **50%** | 🟡 กำลังพัฒนา |
| **รวม** | **ผลรวมจากคะแนนในตาราง** | **38.0** | **67** | **~57%** | 🟡 อยู่ระหว่าง integration |

> **หมายเหตุการคำนวณ:** คะแนนรวมในตารางคือ `38.0 / 67 = 56.71%` ปัดเป็น `57%`. ตัวเลขนี้เป็นคะแนนแบบนับ AC เท่ากันทุกข้อ ไม่ใช่ weighted progress จริง เพราะเอกสารยังไม่ได้กำหนดน้ำหนักของแต่ละ AC

---

## 3. รายละเอียดความคืบหน้าแต่ละหมวด (Acceptance Criteria Breakdown)

---

### หมวดที่ 1: ระบบยืนยันตัวตน, จัดการสิทธิ์ผู้ใช้งาน และความปลอดภัย (Authentication & RBAC)
* **ความคืบหน้า:** `83%` (5 / 6 ผ่าน)
* **สถานะ:** 🟢 ใกล้สมบูรณ์

#### รายการ Acceptance Criteria:
- [x] **AC 1:** สร้างหน้า Login ที่รองรับการกรอก อีเมล/เบอร์โทรศัพท์ และรหัสผ่าน (`Front/src/features/auth/login-page.jsx`, API `/api/auth/login`)
- [x] **AC 2:** สร้างระบบเชื่อมต่อ LINE Login สำหรับผู้ปกครอง ให้สามารถเข้าสู่ระบบอัตโนมัติเมื่อกดผ่าน LINE (`LineLiff/src/pages/login.jsx`, `api/parents/bind-line`)
- [x] **AC 3:** สร้างฟังก์ชัน "ลืมรหัสผ่าน" ที่รองรับการส่งผ่านอีเมล (`/api/users/forget-password`, `/api/users/reset-password`, Smtp settings)
- [x] **AC 4:** Middleware/Guard ของ API ต้องตรวจสอบ `role` ก่อนอนุญาตให้เข้าถึง Endpoint ต่างๆ (`TenantMiddleware.cs`, `RequireAuthorization()`)
- [x] **AC 5:** พิสูจน์ได้ว่ารหัสผ่านใน Database (ตาราง `users`) ถูกเข้ารหัสด้วย bcrypt (`BCrypt.Net-Next` ใน `UserService`, `AuthEndpoints`)
- [x] **AC 6:** ระบบมีการตั้งเวลา Timeout 30 นาทีสำหรับผู้ใช้งานระดับ Admin (`admin-session-timeout.js`, AdminLayout auto-logout และ JWT/cookie expiry 30 นาที)

#### สิ่งที่ทำเสร็จแล้วในโค้ด:
- JWT Bearer authentication พร้อม `institute_id` claim สำหรับ Multi-tenancy
- Refresh Token rotation (`POST /api/auth/refresh-token`)
- คุ้กกี้ `auth_token` แบบ HttpOnly สำหรับเว็บเบราว์เซอร์
- Flow Map LINE ID และเบอร์โทรศัพท์สำหรับผู้ปกครองใน LIFF

#### สิ่งที่ต้องปรับปรุงต่อ:
1. เพิ่มหลักฐาน runtime สำหรับการบันทึก Login/Logout และการเปลี่ยนข้อมูลสำคัญเข้า `audit_logs` ที่มีอยู่แล้ว

---

### หมวดที่ 2: ระบบจัดการประวัตินักเรียนและออกบัตร QR Code (Student Management)
* **ความคืบหน้า:** `93%` (6.5 / 7 ผ่าน)
* **สถานะ:** 🟢 ใกล้สมบูรณ์

#### รายการ Acceptance Criteria:
- [x] **AC 1:** สร้างหน้าฟอร์มลงทะเบียนนักเรียน รองรับการอัปโหลดรูปภาพ (`photo_url`) และข้อมูลพื้นฐาน (`Front/src/pages/admin/student-add-page.jsx`, `/api/uploads/student-photo`)
- [/] **AC 2:** ในฟอร์ม มีส่วนให้เพิ่มข้อมูลผู้ปกครองแบบ Dynamic (กดเพิ่มคนที่ 1, คนที่ 2 ได้) และระบุรายชื่อคนรับกลับ (ทำ Dynamic Parent และระบบสิทธิ์รับส่งเด็ก `student_pickup_authorizations` CRUD สมบูรณ์แล้ว รอเชื่อมเข้าฟอร์มตอนลงทะเบียนใหม่)
- [x] **AC 3:** ในฟอร์ม มีช่อง (Textarea) ให้ระบุข้อมูลโรคประจำตัว/แพ้อาหาร (`medicalInfo` มีในหน้าเพิ่มนักเรียนและหน้ารายละเอียด)
- [x] **AC 4:** เมื่อกดบันทึก ระบบต้องสร้างบัตรนักเรียนดิจิทัลที่มี QR Code อัตโนมัติ (`POST /students` ส่งคืน `qrToken`, แสดงผลด้วย `react-qr-code` ใน `student-profile-page.jsx`)
- [x] **AC 5:** มีฟังก์ชันให้ Export หน้าบัตรเป็นไฟล์ PDF สำหรับพิมพ์จริงได้ (FR-STD-08) (`StudentCardPdfService.cs` เรนเดอร์บัตรขนาด A6 พร้อม QR Code อัปโหลดขึ้น S3 ผ่าน `GET /api/students/{id}/card.pdf` และปุ่ม "ดาวน์โหลดบัตร PDF" ใน `student-profile-page.jsx`)
- [x] **AC 6:** สร้างหน้าแสดงตารางรายชื่อนักเรียน ที่สามารถค้นหาด้วยชื่อ, รหัส, หรือเบอร์โทรผู้ปกครองได้ (`students-page.jsx` ค้นหาผ่าน `StudentRepository.SearchAsync`)
- [x] **AC 7:** มีปุ่มกด Export ข้อมูลนักเรียนทั้งหมดออกมาเป็นไฟล์ Excel/CSV (FR-STD-07) (`StudentExportService.cs` สตรีม CSV พร้อม UTF-8 BOM ผ่าน `GET /api/students/export?format=csv` และปุ่ม "ส่งออก CSV" ใน `students-page.jsx`)

#### สิ่งที่ทำเสร็จแล้วในโค้ด:
- API `/api/students` (CRUD สมบูรณ์ รองรับ Multi-parent, Medical Info, Photo Upload)
- API `/api/students/{id}/qr` สำหรับสร้าง rotating QR Token
- API `/api/students/{id}/card.pdf` สำหรับสร้างบัตรนักเรียนขนาดพิมพ์จริง
- API `/api/students/export?format=csv` ส่งออก CSV นักเรียนแบบ async streaming พร้อม tenant isolation
- API `/api/students/{id}/pickup-authorizations` (CRUD รายชื่อผู้มีสิทธิ์รับเด็ก)
- ปุ่มดาวน์โหลดบัตร PDF และปุ่มส่งออก CSV ในหน้า Admin

#### สิ่งที่ต้องปรับปรุงต่อ:
1. เชื่อมฟอร์มลงทะเบียนนักเรียนหน้าแรกเข้ากับตาราง `student_pickup_authorizations` ตอนกดเพิ่มเด็กใหม่
2. เพิ่มตัวเลือก Export เป็น XLSX ควบคู่กับ CSV ที่พร้อมแล้ว

---

### หมวดที่ 3: ระบบเช็คชื่อด้วย QR Code (Attendance)
* **ความคืบหน้า:** `64%` (4.5 / 7 ผ่าน)
* **สถานะ:** 🟡 กำลังพัฒนา

#### รายการ Acceptance Criteria:
- [/] **AC 1:** สร้างหน้าเว็บเปิดกล้องมือถือให้ครูสแกน QR Code เพื่อ Check-in และ Check-out ได้ (`attendance-page.jsx` มีกล้องสแกนด้วย `jsQR` สำหรับ Check-in และมีปุ่ม Checkout พร้อมเลือกผู้มารับ)
- [x] **AC 2:** มี UI ให้ครูสามารถกดเช็คชื่อแบบ Manual ได้ (เผื่อเด็กลืมบัตร) พร้อมระบุสถานะ มา/สาย/ลา/ขาด (แท็บ "รายชื่อวันนี้" ใน `attendance-page.jsx`)
- [x] **AC 3:** ระบบสามารถหักโควต้าคงเหลือของนักเรียนได้อัตโนมัติเมื่อเช็คชื่อสำเร็จ (`AttendanceService.ScanCheckinWithTransactionAsync` หัก `sessionsRemaining` ทันที)
- [x] **AC 4:** มีช่องให้บันทึกข้อมูลว่า "ผู้ที่มารับกลับ" คือใครในตอน Check-out (`POST /api/attendance/{id}/checkout` รับ `pickedUpBy`, `pickupAuthorizationId`, บันทึก `AuditLog` ใน transaction เดียวกัน และหน้า UI มี modal เลือกผู้รับเด็กที่ active พร้อมแสดงเวลา/ผู้บันทึก)
- [x] **AC 5:** มีระบบ Background Job คอยเช็ค หากผ่านไป 20 นาทีจากเวลาเริ่มเรียนแล้วเด็กยังไม่สแกน ให้ระบบแจ้งเตือน (`LateAttendanceNotificationJob` แยกเป็น hosted worker)
- [x] **AC 6:** ทันทีที่ Check-in / Check-out สำเร็จ ต้องมีข้อความ Push ยิงเข้า LINE ผู้ปกครอง (`LineNotificationService.SendAttendanceNotificationAsync`)
- [ ] **AC 7:** แอปสแกนรองรับโหมด Offline เก็บข้อมูลลง Cache และส่งกลับ Server เมื่อมีเน็ต (ยังไม่มี Service Worker หรือ IndexedDB Sync)

#### สิ่งที่ต้องปรับปรุงต่อ:
1. เพิ่มกล้องสแกนโหมดสลับ "สแกนเข้า (Check-in)" และ "สแกนออก (Check-out)" โดยตรงจาก QR
2. เพิ่ม runtime evidence ของ worker เช็คเวลาเรียนหลังเริ่มเรียน 20 นาที
3. ทำ Offline Queue ด้วย LocalStorage/IndexedDB ในหน้าสแกน

---

### หมวดที่ 4: ระบบลาและเรียนชดเชย (Leave & Make-up)
* **ความคืบหน้า:** `80%` (4.0 / 5 ผ่าน)
* **สถานะ:** 🟢 ใกล้สมบูรณ์

#### รายการ Acceptance Criteria:
- [x] **AC 1:** (LINE LIFF) สร้างหน้าฟอร์มให้ผู้ปกครองกดแจ้งลา เลือกคาบเรียน ระบุเหตุผล และแนบไฟล์ใบรับรองแพทย์ได้ (`leave-makeup.jsx` มีฟอร์มเลือก session, ใส่เหตุผล, แนบไฟล์ PDF/JPG/PNG/WEBP อัปโหลดผ่าน `POST /api/leave-requests/{id}/attachment` ลงตาราง `leave_request_attachments`)
- [x] **AC 2:** (Admin Panel) สร้าง UI ให้ครูจัดการคำขอลา (อนุมัติ/ปฏิเสธ) หรือครูสามารถสร้างคำขอลาแทนผู้ปกครองได้ (`Front/src/pages/admin/requests-page.jsx` พร้อม API approve ที่ออกเครดิตชดเชยอัตโนมัติ)
- [/] **AC 3:** (Admin Panel) ครูสามารถสร้าง Slot ว่างสำหรับเรียนชดเชย พร้อมระบุจำนวนที่นั่งที่รับได้ (Capacity) (API `POST /api/makeup/slots` ใน `MakeupService` และ repository ทำงานได้แล้ว รอทำหน้า UI บน Admin Panel)
- [x] **AC 4:** (LINE LIFF) ผู้ปกครองสามารถดู Slot ว่าง และใช้ `makeup_credits` กดจองเรียนชดเชยได้ (`leave-makeup.jsx` แสดงสิทธิ์คงเหลือ, แสดง slot ที่เปิด, กดจองเรียนชดเชย, และแสดงรายการ booking พร้อมปุ่มยกเลิก)
- [/] **AC 5:** (Backend) หากครูกดยกเลิก Slot แบบ Group Cancel ระบบต้องคืนเครดิตกลับเข้าบัญชีของนักเรียนทุกคนที่จองไว้ (`POST /api/makeup/slots/{slotId}/cancel` คืนเครดิตเข้า ledger ทุก booking อัตโนมัติใน transaction เดียวกัน รอทำปุ่มกดยกเลิกบน UI)

#### สิ่งที่ทำเสร็จแล้วในโค้ด:
- API จัดการ Leave Requests (คำนวณประเภทลา advance/urgent/absence อัตโนมัติ)
- API แนบไฟล์ใบรับรองแพทย์ `POST /api/leave-requests/{id}/attachment` พร้อมตาราง `leave_request_attachments`
- API อนุมัติ/ปฏิเสธคำขอลาพร้อมออก `makeup_credits` และบันทึก `makeup_credit_transactions`
- API จองเรียนชดเชย, แสดงรายการ booking, ยกเลิก booking และบันทึก no-show
- หน้า "ลาและเรียนชดเชย" บน LINE LIFF รองรับทั้งแจ้งลา แนบไฟล์ ดูสิทธิ์ จองที่นั่ง และยกเลิกการจอง

#### สิ่งที่ต้องปรับปรุงต่อ:
1. สร้างหน้า UI ใน Admin Panel สำหรับให้ครูเปิด Slot ชดเชยและกดยกเลิก Slot (Group Cancel)
2. เพิ่ม Background Worker จัดการเครดิตที่หมดอายุ (`status = expired`)

---

### หมวดที่ 5: ระบบการ์ดพลังและระบบแรงจูงใจ (Skill Card & Gamification)
* **ความคืบหน้า:** `50%` (2.5 / 5 ผ่าน)
* **สถานะ:** 🟡 กำลังพัฒนา

#### รายการ Acceptance Criteria:
- [x] **AC 1:** (Admin Panel) มี UI ให้ครูเข้าไปสร้างและแก้ไขหัวข้อบทเรียน (`skill_topics`) พร้อมจัดเรียงลำดับได้ (`academics-page.jsx` แท็บทักษะ)
- [x] **AC 2:** (Admin Panel) มี UI สำหรับให้ครูกรอกคะแนน (`score`) และพิมพ์คอมเมนต์ (`note`) ให้เด็กแต่ละคนในคลาสได้สะดวกรวดเร็ว (`academics-page.jsx` ตารางกรอกคะแนน)
- [/] **AC 3:** (LINE LIFF) ผู้ปกครองสามารถเปิดดูการ์ดพลังของลูก พร้อมเห็นกราฟพัฒนาการและข้อความ Feedback จากครู (มี Endpoint `/api/parents/children/{childId}/scores` และ Card สรุปใน Dashboard แต่ยังไม่มีหน้ารวมกราฟ Radar Chart)
- [ ] **AC 4:** (Backend) หากมีคะแนนมาจากการบ้าน (`homework_submissions`) ระบบสามารถนำคะแนนนั้นมาอัปเดตใน `skill_scores` ได้อัตโนมัติ (ยังไม่มี Trigger/Logic เชื่อม)
- [ ] **AC 5:** (Frontend) หน้าโปรไฟล์เด็กมีการแสดงผล Streak Counter (นับวันมาเรียนต่อเนื่อง) และโชว์ Icon เหรียญตรา (Badges) ที่ปลดล็อคแล้ว (มีระบบ Badge ในฝั่ง Admin Layout แต่ในโปรไฟล์เด็กของ LIFF ยังไม่ได้นำไปแสดง)

#### สิ่งที่ต้องปรับปรุงต่อ:
1. สร้างหน้า `/liff/scores/:childId` ใน LINE LIFF พร้อมแสดง Radar Chart หรือ Bar Chart
2. เพิ่มตัวนับวันมาเรียนต่อเนื่อง (Streak Counter) ในหน้าโปรไฟล์เด็ก
3. ทำ Logic คำนวณคะแนนเฉลี่ยจากการบ้านเข้า Skill Card อัตโนมัติ

---

### หมวดที่ 6: ระบบการบ้าน (Homework)
* **ความคืบหน้า:** `50%` (2.5 / 5 ผ่าน)
* **สถานะ:** 🟡 กำลังพัฒนา

#### รายการ Acceptance Criteria:
- [x] **AC 1:** (Admin Panel) UI สำหรับครูในการสร้างการบ้าน เลือกคอร์ส พิมพ์โจทย์ แนบไฟล์ และกำหนดเวลาส่ง (`academics-page.jsx` แท็บการบ้าน, `/api/homeworks`)
- [ ] **AC 2:** (LINE LIFF) UI สำหรับนักเรียน/ผู้ปกครอง เพื่อดูโจทย์การบ้าน และมีปุ่มเปิดกล้อง/เลือกรูปเพื่ออัปโหลดส่งงาน (API พร้อมแล้ว แต่หน้า LIFF ยังไม่มีหน้ารายการการบ้านและการส่งงาน)
- [x] **AC 3:** (Admin Panel) UI สำหรับครูเพื่อดู List รายชื่อเด็กที่ส่ง/ยังไม่ส่ง และสามารถเปิดดูรูปที่เด็กส่ง พร้อมกรอกคะแนน/Feedback ได้ (`academics-page.jsx` ส่วนตรวจการบ้าน)
- [/] **AC 4:** (LINE LIFF & Web) หน้าการ์ดของนักเรียน มีการแสดง Badge สถานะการบ้านอย่างชัดเจน (ใน LIFF Dashboard มี StatCard บอกจำนวนการบ้านค้างส่ง แต่ยังไม่มีหน้ารายการแยกย่อย)
- [/] **AC 5:** (Backend/Worker) ระบบทวงงานล่วงหน้า 1 วันมี `HomeworkReminderNotificationJob` และ retry/idempotency แล้ว แต่ยังไม่มี trigger แจ้งเตือนทันทีตอนสร้างการบ้าน

#### สิ่งที่ต้องปรับปรุงต่อ:
1. เพิ่มหน้า `/liff/homework/:childId` ใน LINE LIFF ให้ผู้ปกครองดูโจทย์และอัปโหลดส่งภาพการบ้านได้
2. เชื่อมต่อ Push Notification เมื่อครูสร้างการบ้านใหม่
3. เพิ่ม trigger แจ้งเตือนทันทีเมื่อสร้างการบ้าน และเก็บ runtime evidence ของ `due_at` reminder worker

---

### หมวดที่ 7: ระบบการเงิน (Payment & Billing)
* **ความคืบหน้า:** `60%` (3.0 / 5 ผ่าน)
* **สถานะ:** 🟡 กำลังพัฒนา

#### รายการ Acceptance Criteria:
- [x] **AC 1:** (Admin Panel) หน้าจอ POS ให้พนักงานบันทึกการรับเงิน ระบุวิธีชำระ และอัปโหลดสลิป (`Front/src/pages/admin/finance-page.jsx`, `/api/payments`)
- [/] **AC 2:** (Backend) API ตรวจสอบสลิป เพื่อดึงข้อมูลยอดเงินและเทียบกับระบบ (`PaymentSlipVerificationService.cs` มี provider interface `ISlipVerificationProvider`, ตรวจสอบยอดเงิน slip กับยอดชำระ, ป้องกัน amount mismatch ด้วยสถานะ conflict, บันทึก slip metadata ลงฐานข้อมูล และมี endpoint `POST /api/payments/{id}/verify-slip` พร้อม unit tests; รอเชื่อม AI provider จริงใน production)
- [x] **AC 3:** (Backend) ระบบสร้างไฟล์ PDF ใบเสร็จรับเงินจริงด้วย `ReceiptPdfService`, upload ผ่าน `IFileStorageService` และส่ง URL จริงเข้า LINE
- [/] **AC 4:** (Admin Panel) มีหน้า Dashboard แสดงรายงานรายได้ และมีปุ่ม Export เป็น Excel/CSV (หน้า `finance-page.jsx` มีตารางประวัติและยอดรวม แต่ยังไม่มีกราฟรายวัน/เดือน/ปี และยังไม่มีปุ่ม Export)
- [x] **AC 5:** (Backend/Worker) ระบบแจ้งเตือนอัตโนมัติเมื่อโควต้าเด็กเหลือน้อย (<= 3 ครั้ง) ผ่าน `QuotaLowNotificationJob` พร้อม notification log และ idempotency

#### สิ่งที่ทำเสร็จแล้วในโค้ด:
- API บันทึกการรับเงิน POS และคำนวณยอดชำระสะสมใน Enrollment
- ระบบสร้างใบเสร็จรับเงิน PDF ขนาด A5 ด้วย QuestPDF และอัปโหลดขึ้น S3 พร้อมส่งลิงก์จริงทาง LINE
- API ตรวจสอบสลิป `POST /api/payments/{id}/verify-slip` พร้อมตรวจสอบยอดเงินตรงกันก่อน verify
- Service/Repository และ Unit Tests สำหรับการรับเงินและการตรวจสอบสลิป

#### สิ่งที่ต้องปรับปรุงต่อ:
1. เชื่อม 3rd-party AI OCR Slip Provider ตัวจริงเข้ากับ `ISlipVerificationProvider`
2. เพิ่มกราฟสรุปรายรับในหน้าการเงิน และเพิ่มปุ่ม Export CSV/Excel ในหน้าการเงิน
3. เพิ่ม runtime evidence และ business policy ว่าการเตือนโควต้า `<= 3` ควรส่งซ้ำเมื่อใด

---

### หมวดที่ 8: เว็บไซต์สาธารณะ (Public Website & CMS)
* **ความคืบหน้า:** `30%` (1.5 / 5 ผ่าน)
* **สถานะ:** 🔴 ต้องเร่งทำ

#### รายการ Acceptance Criteria:
- [/] **AC 1:** (Frontend) พัฒนาหน้า Public Website จำนวน 5 หน้าหลัก: หน้าแรก, ผลงานนักเรียน, แนะนำครู, ตารางคอร์ส/ราคา, ติดต่อเรา (มีหน้าแรกเบื้องต้น `pages/index.jsx` และหน้าติดต่อ `contact-page.jsx` แต่ยังขาดหน้าผลงาน, หน้ารวมครู, และหน้าตารางคอร์ส)
- [ ] **AC 2:** (Frontend) สร้างฟอร์ม "ลงทะเบียนทดลองเรียน" ที่หน้าเว็บ (ยังไม่มีฟอร์มหน้าบ้าน)
- [ ] **AC 3:** (Admin Panel) สร้างเมนู CMS ให้แอดมินสามารถอัปโหลดรูป แบนเนอร์ และพิมพ์แก้ไขข้อความผลงานนักเรียนได้ (ยังไม่มีเมนู CMS)
- [/] **AC 4:** (Backend) ใน `Front/docAPI/api-target.json` มี contract `POST /api/public/leads` และ schema `CreateLeadRequest` แล้ว แต่ยังไม่พบ endpoint implementation ใน `API` จากการค้น source รอบนี้ จึงยังไม่ถือว่ารับข้อมูลจริงได้
- [x] **AC 5:** หน้าเว็บทั้งหมดรองรับ Responsive Design แสดงผลได้สวยงามทั้งบนมือถือ แท็บเล็ต และคอมพิวเตอร์ (โค้ดใช้ Tailwind CSS และออกแบบ Responsive ทุกหน้า)

#### สิ่งที่ต้องปรับปรุงต่อ:
1. Implement และทดสอบ endpoint `POST /api/public/leads` ให้บันทึก `Lead` จริง พร้อมกำหนด notification behavior
2. พัฒนาหน้าเว็บฝั่ง Landing Page ให้ครบ 5 หน้าหลักตามบรีฟ
3. สร้างหน้า CMS จัดการเนื้อหาหน้าเว็บใน Admin Panel

---

### หมวดที่ 9: ระบบ LINE Integration
* **ความคืบหน้า:** `42%` (2.5 / 6 ผ่าน)
* **สถานะ:** 🟡 กำลังพัฒนา

#### รายการ Acceptance Criteria:
- [x] **AC 1:** (Backend) เชื่อมต่อ LINE Messaging API สำเร็จ และสามารถยิง Push Message ตาม Trigger ได้ (`LineNotificationService.cs` ยิงแจ้งเตือนเช็คชื่อและการจ่ายเงิน)
- [ ] **AC 2:** (LINE OA) ตั้งค่า Rich Menu ใน LINE Official Account และผูก Action ลิงก์เข้ากับ LIFF App (ต้องนำ URL ของ LIFF ไปกำหนดค่าใน LINE Developers Console)
- [x] **AC 3:** (Frontend) พัฒนาหน้า LIFF App สำหรับผู้ปกครอง (`LineLiff` มีหน้า Dashboard, Attendance, Payments, Profile)
- [ ] **AC 4:** (Admin Panel) สร้างหน้าจอให้ Admin สามารถเลือกห้องเรียนและพิมพ์ส่งข้อความแบบ Bulk Message หาผู้ปกครองทั้งคลาสได้ (ยังไม่มีหน้า Broadcast)
- [ ] **AC 5:** (Backend) พัฒนา Webhook API เพื่อทำหน้าที่เป็น Chatbot จับ Keyword และตอบคำถามพื้นฐาน (ยังไม่มีตัวดัก Event Webhook)
- [/] **AC 6:** (Database) ทุกข้อความที่ส่งออกไป ต้องถูกบันทึกลงตาราง `notifications` เพื่อทำ Audit Trail (ปัจจุบันส่งข้อความตรงผ่าน HttpClient แต่ยังไม่ได้ Write Record ลง Database)

#### สิ่งที่ต้องปรับปรุงต่อ:
1. เพิ่มการบันทึก Log ลงตาราง `notifications` ทุกครั้งที่มีการส่ง LINE Push
2. เพิ่มหน้า Broadcast ข้อความหาผู้ปกครองรายห้องใน Admin Panel
3. จัดทำภาพต้นแบบ Rich Menu เพื่อนำไปติดตั้งใน LINE Official Account

---

### หมวดที่ 10: รายงานและการวิเคราะห์ (Reports & Analytics)
* **ความคืบหน้า:** `30%` (1.5 / 5 ผ่าน)
* **สถานะ:** 🔴 ต้องเร่งทำ

#### รายการ Acceptance Criteria:
- [x] **AC 1:** (Frontend) พัฒนาหน้า Dashboard สำหรับ Admin โดยมี Card สรุปตัวเลขรายวัน (มี Stat Card นักเรียน, การเข้าเรียน, คำร้องขอ และการเงินใน `Front/src/pages/admin/dashboard-page.jsx`)
- [ ] **AC 2:** (Backend) สร้าง API สำหรับดึงข้อมูล Analytics เชิงลึก (Renewal Rate, Churn Risk) (ยังไม่มี API วิเคราะห์ความเสี่ยง)
- [ ] **AC 3:** (Frontend) สร้างหน้ารายงานเฉพาะ (Reports) แสดงกราฟแนวโน้มรายได้ (Revenue Forecast) (ยังไม่มี)
- [ ] **AC 4:** (Frontend/Backend) สร้างรายงานสรุปชั่วโมงสอนของครูแต่ละคน (Teacher Timesheet) พร้อมปุ่ม Export เป็น Excel เพื่อนำไปทำ Payroll (ยังไม่มี)
- [ ] **AC 5:** (Backend) พัฒนาระบบติดตาม Referral ผู้แนะนำนักเรียน (ยังไม่มี)

#### สิ่งที่ต้องปรับปรุงต่อ:
1. สร้าง Endpoint ดึงสถิติภาพรวมแยกตามช่วงเวลา (วัน/สัปดาห์/เดือน)
2. สร้างหน้าเมนู "รายงานและสถิติ" (Analytics Page) ใน Admin Panel
3. เพิ่มรายงานชั่วโมงสอนครูจากตาราง `sessions` และ `attendances`

---

### หมวดที่ 11: ระบบจัดการอื่น ๆ (Operations & Compliance)
* **ความคืบหน้า:** `33%` (2 / 6 ผ่าน)
* **สถานะ:** 🔴 ต้องเร่งทำ

#### รายการ Acceptance Criteria:
- [ ] **AC 1:** (Admin Panel) มีหน้าต่างตั้งค่าปฏิทินวันหยุด (Holiday Calendar) ซึ่งส่งผลให้ไม่มีการแจ้งเตือนทวงงาน/เช็คชื่อในวันนั้น (ยังไม่มี)
- [ ] **AC 2:** (Backend) Validation ป้องกันการจองห้องเรียนซ้ำซ้อน (Room Overlap) ในตอนสร้างคาบเรียน (ยังไม่มีการเช็ค `scheduled_at` + `duration_min` ชนกับ `room_id` เดียวกัน)
- [/] **AC 3:** (Frontend/Backend) สร้าง UI สำหรับคลังเอกสารและอัปโหลดไฟล์การสอนไปยัง Storage (มี API File Upload เข้า Thai Data Cloud S3 แล้ว แต่ยังไม่มีหน้า FileManager กลาง)
- [ ] **AC 4:** (Admin Panel) มีรายงานสรุปค่าตอบแทนครูรายเดือน (ยังไม่มี)
- [x] **AC 5:** (Frontend/Backend) สร้างระบบขอ Consent PDPA พร้อมบันทึกประวัติ และฟังก์ชันขอ Export/ลบข้อมูล (`PdpaConsent` ถูกบันทึกตอนสมัครเรียนและสมัครสถาบัน, มีปุ่มลบบัญชีใน Settings)
- [ ] **AC 6:** (DevOps) ตรวจสอบว่าระบบ Automated Backup ถูกเปิดใช้งานแล้วบนฐานข้อมูล (ยังไม่มีเอกสารยืนยัน Backup Schedule)

#### สิ่งที่ต้องปรับปรุงต่อ:
1. เพิ่ม Validation ตรวจสอบห้องเรียนซ้ำใน `SessionService.cs`
2. สร้างระบบจัดการวันหยุดสถาบัน (Holiday Management)
3. ตรวจสอบและตั้งเวลา Backup ฐานข้อมูล TiDB Cloud

---

### หมวดที่ 12: การตั้งค่าสถาปัตยกรรมระบบ และบังคับใช้ NFR (System Architecture & NFR)
* **ความคืบหน้า:** `50%` (2.5 / 5 ผ่าน)
* **สถานะ:** 🟡 กำลังพัฒนา

#### รายการ Acceptance Criteria:
- [x] **AC 1:** (DevOps) มี GitHub Actions สำหรับ build/test API, Front และ LineLiff (`.github/workflows/ci.yml`); deploy workflow เดิมยังแยกอยู่
- [x] **AC 2:** (Database) ตั้งค่าฐานข้อมูล TiDB Cloud (MySQL Compatible) พร้อม Multi-Tenant Isolation และ Connection Monitoring (`/api/health`, `/api/v1/test-connection`)
- [x] **AC 3:** (Backend/Frontend) มี BCrypt, Admin inactivity timeout 30 นาที และ access token/auth cookie expiry 30 นาที
- [x] **AC 4:** (Backend) สร้าง Algorithm ระบบ Rotating QR Code ที่ฝั่ง Client สร้าง Token ที่หมดอายุใน 60 วินาทีได้ (`/api/students/{id}/qr` กำหนดอายุและรีเฟรชทุก 60 วินาที)
- [/] **AC 5:** (QA) มี k6 script จำลอง 100 concurrent users ยิง `/api/attendance/scan` พร้อม threshold p95 < 2 วินาทีและ p99 < 3 วินาที แต่ยังไม่มีผล runtime load test จาก environment จริง

#### สิ่งที่ต้องปรับปรุงต่อ:
1. รัน k6 กับ environment จริงและเก็บผล runtime ตาม threshold ที่กำหนด
2. ตรวจสอบ security declarations ของ API contract จาก validator warnings 141 รายการ
3. ตรวจสอบระบบ Session Timeout และ lifecycle ของข้อมูลค้างใน environment จริง

---

## 4. แผนปฏิบัติการที่ต้องปรับปรุงต่อ (Priority Action Plan)

### ระยะเร่งด่วน (P0: ความสมบูรณ์ของการใช้งานจริง & ความปลอดภัย)
1. **บันทึก Notification Log:** attendance/payment ผ่าน dispatcher เดียวกับ background jobs แล้ว; ยังมีข้อจำกัด multi-instance race เพราะ schema ไม่มี unique idempotency constraint
3. **ดึงตารางเรียนจริงขึ้น Dashboard LIFF:** นำตารางเรียนของวันปัจจุบันจาก API แทนที่ mock data ในหน้า Dashboard
4. **ย้าย Direct EF ออกจาก Legacy Controllers:** จัดการ 1 ไฟล์ที่เหลือ (`Parent`) ให้เข้า Repository/Service Layer โดย `Institute`, `Teacher`, `User` และ `Auth` แยกชั้นแล้ว

### ระยะกลาง (P1: การปิด Loop ฟังก์ชันหลักให้ครบวงจร)
1. **หน้ารายการการบ้านใน LIFF:** ให้ผู้ปกครอง/นักเรียนเปิดดูโจทย์และอัปโหลดส่งภาพการบ้านได้
2. **หน้าแสดงการ์ดพลัง (Radar Chart) ใน LIFF:** แสดงผลลัพธ์พัฒนาการเด็กเป็นกราฟใยแมงมุม
3. **UI สำหรับสร้าง/ยกเลิก Make-up Slot ใน Admin:** ให้ครูสามารถเปิด slot และยกเลิก slot ชดเชยได้จากหน้าเว็บ
4. **เชื่อมต่อ AI OCR Slip Provider จริง:** ต่อ API ภายนอกเข้ากับ `ISlipVerificationProvider` สำหรับตรวจสลิปอัตโนมัติ

### ระยะเตรียมขึ้นระบบจริง (P2: ความพร้อมด้าน DevOps และความพึงพอใจ)
1. **ปุ่ม Export Excel/CSV ในหน้าการเงิน:** ต่อยอดจากหน้า Students ที่ทำเสร็จแล้ว
2. **ระบบแจ้งเตือนโควต้าใกล้หมด (<= 3 ครั้ง):** เพิ่ม runtime evidence และ business policy ว่าการเตือนควรส่งซ้ำเมื่อใด
3. **Runtime Load-test evidence:** รัน `load-tests/attendance.js` กับ environment จริงและเก็บผล threshold
4. **หน้า Public Website & CMS:** พัฒนาให้ครบ 5 หน้าหลักและระบบจัดการเนื้อหาสำหรับโปรโมทสถาบัน

---

## 5. บทสรุปขั้นตอนปัจจุบัน (Current Stage)

โครงการผ่านขั้นตอน **Foundational Setup** และ **Core CRUD** มาเรียบร้อยแล้ว ปัจจุบันกำลังอยู่ในช่วง **Cross-Platform Integration (Admin Panel + LINE LIFF + .NET API)**

จุดที่ต้องให้ความสำคัญสูงสุดนับจากนี้คือ **"ความลื่นไหลของผู้ปกครองบน LINE LIFF"** และ **"ความแม่นยำในการตัดรอบโควต้าเรียน/การเงิน"** เพื่อให้สถาบันสามารถนำระบบไปทดลองใช้งานจริงกับนักเรียนกลุ่มแรก (Pilot Class) ได้อย่างมั่นใจและปลอดภัย.
