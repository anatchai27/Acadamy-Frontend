
# UI Task Progress จากการสำรวจ Code จริง

อัปเดตล่าสุด: 2026-09-18

เอกสารนี้สรุปจากโค้ดที่มีอยู่จริงใน `Front`, `LineLiff`, `CMS` และ contract ฝั่ง `API` ไม่ถือว่าแค่มี route หรือมีหน้าจอแล้วจะเสร็จ ถ้า flow ยังใช้ fallback, localStorage หรือข้อมูลปลอม ให้ถือเป็นงานบางส่วนเท่านั้น

## สถานะที่ใช้

- `[x]` มี UI และเชื่อม API/flow ตามขอบเขตแล้ว
- `[/]` มีบางส่วน แต่ยังขาด contract, runtime evidence, UX state หรือรายละเอียดตาม Requirement
- `[ ]` ยังไม่มี implementation ที่ใช้งานได้

## ภาพรวมจาก Code

| พื้นที่ | สถานะ | สิ่งที่พบจาก code | งานค้างหลัก |
|---|---|---|---|
| Front Admin | `[/]` | มี route และหน้า CRUD/transaction หลักหลายชุด, shared UI, auth guard, loading/toast | ตรวจ role guard รายเมนู, ปิด edge case และทดสอบ end-to-end |
| Line LIFF | `[/]` | มี login, dashboard, child switcher, attendance, payment, leave/makeup, homework, scores | เอา fallback/mock ออก, เพิ่ม Radar Chart, image compression, error/ownership state |
| CMS | `[/]` | มี Next.js public preview, trial lead submit, content API client และ local draft fallback | public fetch จาก API, CMS auth จริง, media, lead inbox/status |
| API Contract | `[/]` | มี endpoint รองรับ student, attendance, leave/makeup, homework, score, payment และ website content | ยืนยัน schema/runtime สำหรับ feature ที่ยังไม่ครบก่อนทำ UI ต่อ |

## Task Cards

### 1. Admin Shell, Authentication และสิทธิ์การใช้งาน

สถานะ: `[/]`

- [x] มี router ของ Admin ใน `Front/src/app.jsx`
- [x] หน้าหลังบ้านใช้ `requireAuth` และ `AdminLayout`
- [x] มี login, register, forgot password และ session timeout
- [x] มี shared component สำหรับ Button, Input, Card, Table, DatePicker, Upload, Toast และ Confirm Dialog
- [x] ตรวจสิทธิ์ระดับ role ต่อ route/menu ด้วย `requireAuth(Component, allowedRoles)`
- [x] route ที่ไม่มีสิทธิ์แสดง `/forbidden` และไม่ render page component
- [x] AdminLayout ซ่อนเมนูตาม role และ fallback role เป็น `unknown` แบบ deny-by-default
- [/] ตรวจทุก mutation ให้มี loading, disabled กันกดซ้ำ และ success/error message
- [/] เพิ่ม unit test สำหรับ role normalization/allow-deny; ยังต้องทำ browser matrix ครบทุก route

อ้างอิง: `Front/src/app.jsx`, `Front/src/components/require-auth.jsx`, `Front/src/components/require-auth.test.jsx`, `Front/src/layouts/admin-layout.jsx`, `Front/src/components/ui/`

Definition of Done: user แต่ละ role เข้าได้เฉพาะเมนูของตัวเอง และทุก action สำคัญมีผลลัพธ์ที่ผู้ใช้เข้าใจได้

### 2. Student และ Parent Management

สถานะ: `[x]` สำหรับ flow หลัก, งานเสริม `[/]`

- [x] รายการนักเรียนโหลดจาก API พร้อม search debounce และ pagination
- [x] เพิ่ม/แก้ไขนักเรียนพร้อมรูปและ `medical_info`
- [x] เพิ่มผู้ปกครองแบบ dynamic list
- [x] เพิ่มรายชื่อผู้รับเด็กและบันทึกผ่าน pickup authorization API
- [x] ดู student profile และสร้าง/ดาวน์โหลด student card ตาม flow ที่มีอยู่
- [x] Export รายชื่อนักเรียนเป็น CSV
- [ ] เพิ่ม XLSX export หากยังเป็น requirement จริง
- [x] Student list มี empty state แยกกรณีค้นหาไม่พบ/สถาบันยังไม่มีข้อมูล
- [x] Student list มี API error state และปุ่ม retry
- [x] Student profile มี error state และปุ่ม retry เมื่อโหลดข้อมูลไม่สำเร็จ
- [/] ตรวจ runtime กับข้อมูล tenant ที่ไม่มีรายการบน environment จริง

อ้างอิง: `Front/src/pages/admin/students-page.jsx`, `Front/src/pages/admin/__tests__/students-page.test.jsx`, `Front/src/pages/admin/student-add-page.jsx`, `Front/src/pages/admin/student-profile-page.jsx`, `Front/src/services/student-service.js`

Definition of Done: พนักงานสร้างนักเรียนหนึ่งคนพร้อมผู้ปกครอง/ผู้รับเด็ก แล้วค้นหาและดูข้อมูลต่อได้จาก API จริง

### 3. Attendance Scanner และ Checkout

สถานะ: `[/]`

- [x] หน้า scan QR และกล้อง `ScannerCamera`
- [x] manual attendance: มา, สาย, ลา, ขาด
- [x] เรียก scan/manual/checkout API และมี idempotency/error mapping ที่หน้า UI
- [x] แสดง loading กัน scan ซ้ำและ checkout ซ้ำ
- [x] โหลดรายชื่อผู้รับเด็กและบันทึก checkout พร้อม audit ผ่าน API
- [x] มี offline queue, pending/failed state และ sync เมื่อกลับ online
- [/] ทดสอบว่าข้อความจาก API ทุก error code แสดงผลครบใน UX จริง
- [/] ทดสอบ notification status หลัง scan/checkout บน environment ที่มี LINE config
- [ ] ทดสอบ flow จริงตั้งแต่เปิด session -> scan -> หัก quota -> checkout ด้วยข้อมูล test DB

อ้างอิง: `Front/src/pages/admin/attendance-page.jsx`, `Front/src/components/ui/scanner-camera.jsx`, `Front/src/services/attendance-service.js`, `Front/src/services/attendance-offline-queue.js`, `API/Controllers/AttendanceEndpoints.cs`

Definition of Done: ครูหรือ Staff ใช้หน้าจอเดียวทำ check-in, เห็น quota/status, กัน scan ซ้ำ และทำ checkout ได้จริง

### 4. Finance, POS และ Slip

สถานะ: `[/]`

- [x] ฟอร์มบันทึก payment และเลือกวิธีชำระเงิน
- [x] อัปโหลดสลิปหลังสร้าง payment
- [x] ดูประวัติ payment และกรองช่วงวันที่
- [x] ดู revenue report และ export CSV
- [x] มี loading state ตอน submit, โหลดรายการ และ export
- [/] ตรวจว่าการค้นหา student -> เลือก course -> สร้าง enrollment/payment ตาม UX POS ที่ Requirement ระบุครบหรือยัง
- [/] ตรวจ provider/AI slip verification บน environment จริง เพราะตอนนี้ UI รองรับ upload แต่ยังไม่ใช่หลักฐานว่า provider production ทำงาน
- [ ] เพิ่มปุ่มดาวน์โหลดใบเสร็จ PDF จาก invoice/payment ที่ผู้ใช้เลือก
- [ ] เพิ่ม empty/error state ที่ชัดเจนใน payment history และ revenue report

อ้างอิง: `Front/src/pages/admin/finance-page.jsx`, `Front/src/services/finance-service.js`, `Front/src/services/upload-service.js`, `Front/src/services/report-service.js`

Definition of Done: Staff สร้างรายการเงิน, ตรวจผลสลิป, เปิด/ดาวน์โหลดใบเสร็จ และ trace ยอดกลับไปที่ API ได้

### 5. Course, Session, Teacher และ Academic Admin

สถานะ: `[/]`

- [x] Course list/search/create/edit เชื่อม API
- [x] สร้าง session และจัดการ slot/requests ตามหน้าที่มีใน Admin
- [x] Teacher และ product pages มี route และ service รองรับ
- [x] ครูสร้าง homework, ดู submission และให้คะแนน/feedback
- [x] สร้าง skill topics และกรอก skill score ใน Admin
- [x] homework-to-skill topic mapping UI มีอยู่ใน `academics-page.jsx`
- [/] ตรวจ role teacher ให้เห็นเฉพาะ schedule/student ที่ได้รับมอบหมาย ไม่ใช่เพียง auth guard
- [/] รัน migration/DDL และมี mapping row จริงเพื่อยืนยันว่า grade แล้ว score ถูก update
- [ ] เพิ่ม automated test ระดับ page สำหรับ create homework, grade และ mapping save

อ้างอิง: `Front/src/pages/admin/courses-page.jsx`, `Front/src/pages/admin/sessions-page.jsx`, `Front/src/pages/admin/academics-page.jsx`, `Front/src/pages/admin/teachers-page.jsx`

Definition of Done: ครูสร้างงาน/หัวข้อ ให้คะแนน และผลถูกส่งต่อไปยังข้อมูลนักเรียนจริงโดยไม่ข้าม tenant

### 6. LIFF Login, Dashboard และ Child Switcher

สถานะ: `[/]`

- [x] มี LIFF init/login และ parent token context
- [x] Dashboard เรียก `getParentDashboard()`
- [x] Dashboard เรียก `getChildSessions(childId)` เพื่อดึงตารางเรียนจริงของลูกที่เลือก
- [x] มี child switcher เมื่อผู้ปกครองมีหลายคนในบัญชี
- [x] มี route ไป attendance, payments, leave/makeup, homework และ scores
- [x] มี loading state หน้า dashboard
- [x] เอา `fallbackSchedule` ออก และแสดง empty state เมื่อ API ไม่มีตารางเรียนจริง
- [x] Dashboard เลือก active child เฉพาะจาก `children` ที่ parent API ส่งกลับ; child ที่ไม่อยู่ในรายการจะถูกแทนด้วย child ที่อนุญาต
- [x] เพิ่ม error state และปุ่มลองใหม่ แทนการ redirect เงียบเมื่อ dashboard API ล้มเหลว
- [/] ตรวจซ้ำว่า API ของทุก child-specific endpoint reject `childId` ที่ไม่ใช่ของ parent ใน runtime จริง

อ้างอิง: `LineLiff/src/pages/dashboard.jsx`, `LineLiff/src/components/child-switcher.jsx`, `LineLiff/src/store/LiffContext.jsx`, `LineLiff/src/services/parent-service.js`

Definition of Done: Parent เห็นเฉพาะลูกที่ผูกกับบัญชี และทุก card มาจาก API จริง ไม่มี fallback เป็นข้อมูลเด็กตัวอย่าง

หลักฐานรอบนี้: `LineLiff/src/pages/dashboard.jsx` เรียก `/parents/me/dashboard` และ `/parents/children/{childId}/sessions`, เพิ่ม `getTodaySchedule`/`resolveActiveChildId`; `LineLiff/src/pages/dashboard.test.jsx` ครอบคลุม no-schedule, invalid active child และการกรอง session ของวันนี้

### 7. LIFF Leave และ Make-up

สถานะ: `[x]` สำหรับ flow หลัก

- [x] โหลดคาบเรียนและคำขอลาของเด็ก
- [x] ส่งคำขอลาพร้อมเหตุผลและไฟล์แนบ
- [x] มี validation file และ loading/disabled state
- [x] แสดงรายการคำขอลาและสถานะ
- [x] แสดง credit, slot และ booking ของเด็ก
- [x] จอง, ยกเลิก booking และคืนเครดิตผ่าน API
- [/] ตรวจวันที่/timezone และข้อความกรณี slot เต็มหรือ credit หมดกับ API จริง

อ้างอิง: `LineLiff/src/pages/leave-makeup.jsx`

Definition of Done: Parent แจ้งลาและจองเรียนชดเชยได้จากมือถือโดยไม่ต้องแก้ข้อมูลในฐานข้อมูลเอง

### 8. LIFF Homework Submission

สถานะ: `[/]`

- [x] โหลดรายการการบ้านจาก `getChildHomework`
- [x] แสดงสถานะส่งแล้ว/ยังไม่ส่ง, due date, score และ feedback
- [x] สร้าง submission และ upload ไฟล์ผ่าน API
- [x] มี loading, success, error และ empty state
- [x] แยก Tab ค้างส่ง/ส่งแล้ว และมี empty state แยกตาม tab
- [x] ใช้ camera input (`capture="environment"`) บนอุปกรณ์ที่รองรับ
- [x] บีบอัดรูปด้วย `compressImageFile` ให้ต่ำกว่า 2MB ก่อน upload
- [x] retry ใช้ `createOrGetHomeworkSubmission` เดิม จึงไม่สร้าง submission ซ้ำก่อน upload ใหม่
- [/] ทดสอบ upload จริงบนมือถือและตรวจไฟล์ที่ storage ได้ขนาด/ชนิดตาม contract

อ้างอิง: `LineLiff/src/pages/homework.jsx`, `LineLiff/src/services/parent-service.js`, `LineLiff/src/utils/validation.js`, `LineLiff/src/utils/image-compression.js`

Definition of Done: นักเรียน/ผู้ปกครองเลือกงานจาก tab ที่ถูกต้อง ถ่าย/เลือกรูป ระบบบีบอัดแล้วส่งสำเร็จ และเห็นผลตอบกลับจากครู

### 9. LIFF Skill Card และ Progress

สถานะ: `[/]`

- [x] หน้า scores โหลดข้อมูลจาก `getChildScores`
- [x] ต่อ `getChildProgress` กับ `GET /api/parents/children/{childId}/progress`
- [x] มี loading, error และ empty state
- [x] แสดงคะแนนรายหัวข้อเป็น progress bar
- [x] เพิ่ม Radar Chart จาก `skill_scores` ด้วย SVG โดยไม่เพิ่ม dependency หนัก
- [x] เพิ่ม Feedback Inbox จาก field `note` ของ score API
- [x] แสดง streak/badge จาก progress API พร้อม empty state
- [x] ส่ง `childId` ที่เลือกเข้า scores/progress endpoint ซึ่ง Backend ตรวจ ownership ด้วย `OwnsChild`
- [/] ทดสอบข้อมูลจริงที่มีหลายหัวข้อ/Badge และตรวจการแสดงผลบนมือถือ

อ้างอิง: `LineLiff/src/pages/scores.jsx`, `LineLiff/src/pages/scores.test.jsx`, `LineLiff/src/services/parent-service.js`, `API/Controllers/ParentEndpoints.cs`, `Front/src/pages/admin/academics-page.jsx`

Definition of Done: Parent เห็นกราฟพัฒนาการ, feedback, streak และ badge ของลูกที่เลือกจากข้อมูลจริงเท่านั้น

### 10. LIFF Payment History

สถานะ: `[/]`

- [x] มี route และเรียก `getChildPayments`
- [x] Parent API คืน `id`, `invoiceNo`, `amount`, `status` และ `receiptPdfUrl` สำหรับแต่ละรายการ
- [x] มี loading และ empty state
- [x] แสดงยอดเงินและสถานะรายการ
- [x] เพิ่ม error state และปุ่ม retry เมื่อ API ล้มเหลว
- [x] เพิ่มปุ่มเปิดใบเสร็จ PDF จาก `receiptPdfUrl` ที่ API คืนให้
- [x] normalize field วันที่, amount, status และ receipt URL ก่อน render
- [/] ทดสอบเปิดไฟล์ PDF จริงบนมือถือและตรวจ permission/CORS ของ storage

อ้างอิง: `LineLiff/src/pages/payments.jsx`, `LineLiff/src/pages/payments.test.jsx`, `LineLiff/src/services/parent-service.js`, `API/Controllers/ParentEndpoints.cs`, `API/Repositories/ParentRepository.cs`, `API/Services/ParentService.cs`

### 11. Public Website และ Trial Lead

สถานะ: `[/]`

- [x] หน้า public responsive และมี route `/p/[slug]`
- [x] มี metadata, canonical, Open Graph และ JSON-LD
- [x] unknown slug แสดง not found
- [x] Trial form ส่ง `POST /api/public/leads`
- [x] มีหน้า CMS สำหรับทดสอบ lead submission
- [x] เพิ่ม public endpoint `GET /api/public/website-content/{slug}` ที่คืนเฉพาะ `isActive=true`
- [x] public page fetch published content ตาม institute slug และ overlay hero title/body จาก API
- [x] fallback ใช้ static source เฉพาะกรณีไม่มี API URL หรือ API คืนรายการ published ว่าง
- [x] รองรับ `contentValue` แบบ JSON array สำหรับ teachers, courses และ portfolio/stories
- [x] public parser validate shape ก่อนแทนที่ source ตั้งต้น; JSON ผิดหรือข้อมูลไม่ครบจะไม่ทำให้ public page พัง
- [/] CMS editor ยังเป็น textarea; ต้องทำ form builder แยกเมื่อ SA ต้องการแก้หลายรายการแบบไม่เขียน JSON
- [x] unknown slug ยังแสดง not found และ public endpoint ไม่เปิด draft content
- [/] ทดสอบ public fetch กับ database จริง, unpublished content และ API failure บน environment deploy

อ้างอิง: `API/Controllers/PublicLeadEndpoints.cs`, `CMS/app/p/[slug]/page.tsx`, `CMS/lib/content.ts`, `CMS/lib/api.ts`, `CMS/app/trial-class/page.tsx`

Definition of Done: Admin publish แล้ว public URL แสดงข้อมูลจากฐานข้อมูลเดียวกัน โดยยังคง SEO และ 404 behavior

### 12. CMS Content Editor และ Lead Inbox

สถานะ: `[/]`

- [x] มี content editor และแก้ section ได้
- [x] มี API client สำหรับ list/save `/api/website-content`
- [x] มี Bearer token จาก `academy-cms-admin-token`
- [x] มี local draft fallback เมื่อ API/token ยังไม่พร้อม
- [x] localStorage fallback แสดงสถานะ `Draft saved locally` ชัดเจน และไม่รายงานว่า publish ผ่าน API
- [x] เพิ่ม `POST /api/uploads/website-media` ใช้ storage เดิม, tenant context เดิม และจำกัดรูปไม่เกิน 5MB
- [x] CMS content editor อัปโหลด media แล้วเก็บ URL ใน `hero_banner` metadata ก่อน Save draft
- [x] Public page แสดง hero media URL เมื่อ content ถูก publish
- [/] story/teacher media ยังต้องทำ content schema แยก หากต้องการผูก media หลายรายการต่อ section
- [x] มี API client สำหรับ `GET /api/leads` พร้อม filter status/search
- [x] หน้า Leads เป็น inbox/kanban แยก New, Contacted, Qualified, Converted, Lost
- [x] เปลี่ยน status และ notes ผ่าน `PUT /api/leads/{id}/follow-up`
- [x] แสดง token/permission error และปุ่ม refresh/retry
- [/] สถานะ Backend ใช้ `qualified/converted` แทนคำใน Requirement เดิม `Trial/Enrolled` ต้องยืนยันศัพท์กับ SA
- [ ] เพิ่ม auth/RBAC สำหรับ CMS admin แบบไม่พึ่ง token ที่กรอกใน localStorage อย่างเดียว
- [x] CMS Overview โหลด published/draft sections และ new leads จาก API จริง พร้อม loading/error state

อ้างอิง: `CMS/app/page.tsx`, `CMS/app/content/page.tsx`, `CMS/lib/api.ts`, `CMS/app/leads/page.tsx`, `API/Controllers/PublicLeadEndpoints.cs`, `API/Services/LeadService.cs`

Definition of Done: Admin แก้ draft, publish, อัปโหลด media และติดตาม lead ได้จาก CMS โดยข้อมูลไม่หายเมื่อเปลี่ยน browser/device

### 13. Reports, Analytics และ Owner Dashboard

สถานะ: `[/]`

- [x] Admin dashboard route และ revenue report UI มีอยู่
- [x] Finance page แสดง payment/revenue ตามช่วงวันที่และ export CSV
- [x] Daily dashboard ดึง attendance ของวันที่เลือกจาก API และแสดง present/late/absent/leave ใน summary
- [x] Daily dashboard ดึงรายได้ของวันที่เลือกจาก revenue API ไม่ใช้ตัวเลขปลอม
- [x] เพิ่ม date filter และ error/zero state สำหรับข้อมูลรายวัน
- [x] Owner dashboard ไม่แสดง fake recent activities หรือ fake top-course numbers เมื่อยังไม่มี API
- [/] ยังไม่มี retention/churn, renewal rate, trial conversion, referral, NPS และ forecast ที่ผูกกับข้อมูลจริงครบ
- [/] date filter รอบนี้เป็นรายวันของ Dashboard; report เชิงช่วงวันที่อื่นยังต้องทบทวนแยก
- [ ] ทำ teacher timesheet จาก sessions + attendance และ export CSV
- [ ] ยืนยันสูตร Revenue Forecast กับ Owner ก่อนทำ UI

อ้างอิง: `Front/src/components/dashboard/dashboard-overview.jsx`, `Front/src/components/dashboard/dashboard-overview.test.jsx`, `Front/src/pages/admin/dashboard-page.jsx`, `Front/src/pages/admin/finance-page.jsx`, `Front/src/services/report-service.js`, `API/Services/RevenueReportService.cs`, `API/Controllers/AttendanceEndpoints.cs`

### 14. Validation ก่อนปิด Task

สถานะ: `[/]`

- [x] Front มี unit/page tests และ build script
- [x] LineLiff มี tests และ build script
- [x] CMS มี production build script
- [x] API มี unit/integration tests และ tenant query filter หลายจุด
- [/] ยังต้องรัน validation ล่าสุดหลังการแก้ไขแต่ละชุด ไม่ใช้ผลเก่าเป็นหลักฐานแทน
- [ ] ทดสอบ browser/device จริงสำหรับ camera, file upload, responsive และ LIFF
- [ ] ทดสอบ User Journey หลักบน test environment ด้วยข้อมูลจริง ไม่ใช่เฉพาะ mocked service
- [ ] บันทึกผล test/build/runtime ไว้ใน `Objective/process.md`

คำสั่งพื้นฐาน:

```powershell
dotnet build .\API\academy-API.csproj
dotnet test .\API\academy-API.Tests\academy-API.Tests.csproj

Push-Location .\Front
npm.cmd test -- --run
npm.cmd run build
Pop-Location

Push-Location .\LineLiff
npm.cmd test -- --run
npm.cmd run build
Pop-Location

Push-Location .\CMS
npm.cmd run build
Pop-Location
```

## ลำดับทำต่อแบบ MVP

1. ปิด LIFF Dashboard ไม่ให้ใช้ `fallbackSchedule` และตรวจ child ownership ให้ครบ
2. ปิด LIFF Homework: แยก tab, compression, camera และ retry ที่ปลอดภัย
3. ปิด LIFF Scores: เพิ่ม Radar Chart, feedback และ progress API ที่เป็นข้อมูลจริง
4. ปิด Finance/LIFF receipt download และ error state ของ payment history
5. ทำ CMS public dynamic fetch จาก API ก่อนค่อยทำ media และ lead Kanban
6. ทำ browser/runtime smoke ของ Attendance, Leave/Make-up, Homework และ Payment

## เกณฑ์ไม่ให้ติ๊ก `[x]`

- มีเพียงหน้าจอ แต่ยังใช้ mock/fallback เป็นข้อมูลหลัก
- มี service call แต่ไม่มี loading, empty หรือ error state
- API มี endpoint แต่ยังไม่มี ownership/tenant/role verification
- บันทึกสำเร็จใน localStorage แต่ยังไม่ได้บันทึก backend จริง
- ผ่าน unit test อย่างเดียว แต่ยังไม่มีหลักฐานว่า flow ต่อกันตั้งแต่ต้นจนจบ

## ผลตรวจล่าสุด

- LineLiff tests: `11 passed / 0 failed`
- API tests: `279 passed / 0 failed / 0 skipped`
- LineLiff production build: ผ่าน
- Dashboard ดึง summary จาก `/api/parents/me/dashboard` และดึงตารางจาก `/api/parents/children/{childId}/sessions`
- Dashboard ไม่แสดงตารางเรียนตัวอย่างเมื่อ child sessions API คืนรายการว่าง
- Dashboard ไม่ยอมใช้ active child ที่ไม่มีอยู่ในรายการจาก parent API
- Homework แยก pending/submitted, ใช้ camera input และบีบอัดไฟล์ก่อนเรียก upload API
- Scores เรียก `/scores` และ `/progress`, แสดง Radar Chart, feedback, streak และ badges จากข้อมูล API
- Payment History เรียก child payment API, แสดง error/retry และเปิด receipt PDF จาก `receiptPdfUrl`
- Public CMS มี `GET /api/public/website-content/{slug}` และหน้า `/p/[slug]` อ่าน published hero content จาก API
- API build: ผ่าน `0 warnings / 0 errors`
- API tests: `279 passed / 0 failed / 0 skipped`
- CMS build: ผ่านด้วย Next.js `15.5.25`, static routes `10/10`
- Front tests: `64 passed / 0 failed`
- Front build: ผ่านหลังเพิ่ม daily Dashboard metrics
- Front tests หลังเพิ่ม role guardและลบ mock dashboard data: `64 passed / 0 failed`
- Front build ผ่านหลังเพิ่ม route/menu permission guard และ real-data empty states
- Front tests หลังเพิ่ม Student empty/error/retry states: `66 passed / 0 failed`
- Front build ผ่านหลังเพิ่ม Student error recovery
- CMS Lead Inbox build: ผ่าน, route `/leads` ใช้ API list/follow-up จริง
- CMS Overview build: ผ่าน, route `/` ใช้ Content/Lead API จริงพร้อม loading/error state
- CMS build หลังเพิ่ม website media upload: ผ่าน
- API build หลังเพิ่ม website media endpoint: ผ่าน `0 warnings / 0 errors`
- API tests หลังเพิ่ม website media endpoint: `279 passed / 0 failed / 0 skipped`
- CMS build หลังเพิ่ม JSON parser สำหรับ teachers/courses/stories: ผ่าน
- API tests หลังเพิ่ม public content/lead integration: `279 passed / 0 failed / 0 skipped`
- ยังไม่ได้ปิด runtime smoke บน LIFF จริง, device camera หรือ API test environment
