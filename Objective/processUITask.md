
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
- [/] ตรวจสิทธิ์ระดับ role ต่อ route/menu ให้ครบ ไม่ใช่แค่ตรวจว่าล็อกอินแล้ว
- [/] ตรวจทุก mutation ให้มี loading, disabled กันกดซ้ำ และ success/error message
- [ ] เพิ่ม test matrix ว่า Admin, Staff และ Teacher เห็น/ทำ action ได้ตรงตาม Requirement

อ้างอิง: `Front/src/app.jsx`, `Front/src/components/require-auth.jsx`, `Front/src/layouts/admin-layout.jsx`, `Front/src/components/ui/`

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
- [/] ตรวจ empty state และ error state ของทุกตารางกับข้อมูล tenant ที่ไม่มีรายการ

อ้างอิง: `Front/src/pages/admin/students-page.jsx`, `Front/src/pages/admin/student-add-page.jsx`, `Front/src/pages/admin/student-profile-page.jsx`, `Front/src/services/student-service.js`

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
- [x] มี loading, error และ empty state
- [x] แสดงคะแนนรายหัวข้อเป็น progress bar
- [/] Requirement ระบุ Radar Chart แต่ implementation ปัจจุบันยังเป็น progress bar และยังไม่มี Recharts/Chart.js ใน dependencies
- [/] Feedback จากครูยังไม่แสดงเป็น inbox ตาม Requirement หาก API ส่ง field มา ต้องออกแบบส่วนแสดงผลให้ครบ
- [ ] เพิ่ม Radar Chart จาก `skill_scores` โดยมี fallback เมื่อข้อมูลไม่ครบ
- [ ] เพิ่ม Feedback Inbox พร้อมวันที่/ผู้ให้ feedback ถ้า contract รองรับ
- [ ] เชื่อม streak/badge จาก progress API และทำ empty state
- [ ] ตรวจ selected child ownership ก่อนโหลดคะแนน

อ้างอิง: `LineLiff/src/pages/scores.jsx`, `LineLiff/src/services/parent-service.js`, `Front/src/pages/admin/academics-page.jsx`

Definition of Done: Parent เห็นกราฟพัฒนาการ, feedback, streak และ badge ของลูกที่เลือกจากข้อมูลจริงเท่านั้น

### 10. LIFF Payment History

สถานะ: `[/]`

- [x] มี route และเรียก `getChildPayments`
- [x] มี loading และ empty state
- [x] แสดงยอดเงินและสถานะรายการ
- [/] error ถูกกลืนด้วย `catch(() => {})` ทำให้ผู้ใช้ไม่รู้ว่า API ล้มเหลว
- [ ] เพิ่ม error state และ retry
- [ ] เพิ่มปุ่มดู/ดาวน์โหลดใบเสร็จ PDF ตาม Requirement
- [/] ตรวจ format field วันที่, amount และ status ให้ตรง API contract ไม่ใช้ fallback ที่เดาเอง

อ้างอิง: `LineLiff/src/pages/payments.jsx`

### 11. Public Website และ Trial Lead

สถานะ: `[/]`

- [x] หน้า public responsive และมี route `/p/[slug]`
- [x] มี metadata, canonical, Open Graph และ JSON-LD
- [x] unknown slug แสดง not found
- [x] Trial form ส่ง `POST /api/public/leads`
- [x] มีหน้า CMS สำหรับทดสอบ lead submission
- [/] public page อ่านข้อมูลจาก `CMS/lib/content.ts` แบบ static ไม่ได้อ่าน published content จาก API
- [/] course/teacher/story/contact จึงยังเป็นข้อมูล source ใน code ไม่ใช่ข้อมูลที่ Admin แก้แล้วเห็นบน public page
- [ ] fetch public content ตาม institute slug จาก API
- [ ] เพิ่ม fallback เฉพาะกรณี API ยืนยันว่าไม่มี published content
- [ ] ทดสอบ unknown slug, unpublished content และ API failure

อ้างอิง: `CMS/app/p/[slug]/page.tsx`, `CMS/lib/content.ts`, `CMS/app/trial-class/page.tsx`, `CMS/lib/api.ts`

Definition of Done: Admin publish แล้ว public URL แสดงข้อมูลจากฐานข้อมูลเดียวกัน โดยยังคง SEO และ 404 behavior

### 12. CMS Content Editor และ Lead Inbox

สถานะ: `[/]`

- [x] มี content editor และแก้ section ได้
- [x] มี API client สำหรับ list/save `/api/website-content`
- [x] มี Bearer token จาก `academy-cms-admin-token`
- [x] มี local draft fallback เมื่อ API/token ยังไม่พร้อม
- [/] localStorage fallback ยังทำให้ผู้ใช้เข้าใจผิดว่า save production แล้ว ต้องแสดงสถานะให้เด่นและไม่ถือเป็น publish จริง
- [/] ยังไม่มี media upload/storage สำหรับ banner, story และ teacher photo
- [x] มีหน้า lead submit test
- [ ] ทำ lead inbox/list จาก API
- [ ] เพิ่มเปลี่ยนสถานะ New -> Contacted -> Trial -> Enrolled
- [ ] เพิ่ม auth/RBAC สำหรับ CMS admin แบบไม่พึ่ง token ที่กรอกใน localStorage อย่างเดียว

อ้างอิง: `CMS/app/content/page.tsx`, `CMS/lib/api.ts`, `CMS/app/leads/page.tsx`, `CMS/app/page.tsx`

Definition of Done: Admin แก้ draft, publish, อัปโหลด media และติดตาม lead ได้จาก CMS โดยข้อมูลไม่หายเมื่อเปลี่ยน browser/device

### 13. Reports, Analytics และ Owner Dashboard

สถานะ: `[/]`

- [x] Admin dashboard route และ revenue report UI มีอยู่
- [x] Finance page แสดง payment/revenue ตามช่วงวันที่และ export CSV
- [/] Daily dashboard ยังไม่ครบ card attendance present/late/absent/leave ตาม Requirement
- [/] ยังไม่มี retention/churn, renewal rate, trial conversion, referral, NPS และ forecast ที่ผูกกับข้อมูลจริงครบ
- [ ] เพิ่ม date range/institute filter ให้ report ที่เกี่ยวข้อง
- [ ] เพิ่ม empty/zero state ที่ห้ามใช้ตัวเลขปลอม
- [ ] ทำ teacher timesheet จาก sessions + attendance และ export CSV
- [ ] ยืนยันสูตร Revenue Forecast กับ Owner ก่อนทำ UI

อ้างอิง: `Front/src/pages/admin/dashboard-page.jsx`, `Front/src/pages/admin/finance-page.jsx`, `Front/src/services/report-service.js`, `API/Services/RevenueReportService.cs`

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

- LineLiff tests: `8 passed / 0 failed`
- API tests: `279 passed / 0 failed / 0 skipped`
- LineLiff production build: ผ่าน
- Dashboard ดึง summary จาก `/api/parents/me/dashboard` และดึงตารางจาก `/api/parents/children/{childId}/sessions`
- Dashboard ไม่แสดงตารางเรียนตัวอย่างเมื่อ child sessions API คืนรายการว่าง
- Dashboard ไม่ยอมใช้ active child ที่ไม่มีอยู่ในรายการจาก parent API
- Homework แยก pending/submitted, ใช้ camera input และบีบอัดไฟล์ก่อนเรียก upload API
- ยังไม่ได้ปิด runtime smoke บน LIFF จริง, device camera หรือ API test environment
