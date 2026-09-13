# Execution Plan ปัจจุบัน

> ปรับแผน: 12 กันยายน 2026
> เป้าหมาย: ทำงานเป็นรอบเล็กที่ build/test/ตรวจหลักฐานได้จริง ไม่ติ๊กงานจากการมี schema หรือ route อย่างเดียว

## Baseline ที่ยืนยันแล้ว

- Current API snapshot: `69 paths / 42 schemas`
- Target API contract: `73 paths / 62 schemas`
- Latest schema export: `Objective/results-2026-09-12-220648.csv`
- Contract validator: `Objective/validate-api-contract.ps1`
- API build ล่าสุดที่ผ่าน: `API/bin/DodValidation`
- Full API tests ล่าสุด: `247 passed / 0 failed / 0 skipped`
- Controller ที่ยังมี direct EF/data access: `3 files / 63 matches`
  - `AuthEndpoints.cs`
  - `MakeupEndpoints.cs` เฉพาะ ownership guard ที่ยังอยู่หน้า route
  - `ParentEndpoints.cs`
  - `UserEndpoints.cs`

## กติกาการทำงานทุก slice

1. อ่าน code path และ schema ก่อนแก้
2. แก้ contract/DTO ก่อน implementation เมื่อ response หรือ input เปลี่ยน
3. Controller รับ request และ map HTTP status เท่านั้น
4. Service คุม business rule/state transition
5. Repository คุม query/persistence/transaction
6. เพิ่ม AAA tests อย่างน้อย success, validation และ conflict/authorization ตามความเสี่ยง
7. รัน focused test ก่อน full suite
8. รัน API build และ contract validator ก่อนปิด slice
9. อัปเดต `process.md` จากหลักฐาน ไม่ใช้ความรู้สึก

## สถานะที่เสร็จแล้ว

- [x] Current API แยกจาก Target API
- [x] Makeup core แยก Controller -> Service -> Repository
- [x] Pickup authorization แยก Controller -> Service -> Repository
- [x] Attendance checkout ใช้ attendance ID จริงและเลือก authorized pickup ได้
- [x] Leave core: create, rule-based type, approve/reject, makeup credit และ ledger reference
- [x] Parent LIFF: leave status, session selection, makeup credit, slot list, booking และ cancel booking (Slice A)
- [x] Makeup credit expired validation & tests (Slice B)
- [x] Leave attachment: schema `leave_request_attachments` verified, model, EF mapping, storage upload API และ LIFF UI (Slice C)
- [x] Admin checkout audit log: atomic transaction, read API, UI server timestamp/actor display (Slice D)
- [x] Legacy controller boundary: `FileUploadEndpoints.cs` ย้ายเป็น service/repository สมบูรณ์ (Slice E part 1)
- [x] Student card PDF generator (QuestPDF + QRCoder) + S3 upload + Admin UI download (Slice F)
- [x] Student CSV export: async streaming query + escaping + tenant isolation test + Admin UI download (Slice G)
- [x] Payment slip verification: provider contract + amount check + conflict guard + tests (Slice H)
- [x] Receipt PDF renderer และ upload ผ่าน `IFileStorageService`
- [x] Contract validator, tenant-aware test fixture และ EF model cache key
- [x] Full API test suite ผ่าน `237/237`

## รอบถัดไป: P0 ปิดงานที่ค้างจาก workflow เดิม

### Slice A: Parent booking cancellation

**เป้าหมาย:** ผู้ปกครองเห็น booking ของลูกและยกเลิกได้อย่างปลอดภัย

**ไฟล์เป้าหมาย:**

- `API/Controllers/MakeupEndpoints.cs`
- `API/Services/MakeupService.cs`
- `API/Repositories/MakeupRepository.cs`
- `API/DTOs/MakeupDtos.cs`
- `LineLiff/src/services/parent-service.js`
- `LineLiff/src/pages/leave-makeup.jsx`
- `Front/docAPI/api-target.json`

**งาน:**

- [x] เพิ่ม `GET /api/makeup/bookings?student_id=` หรือ parent-scoped endpoint
- [x] ตรวจ parent ownership ใน service/repository ไม่พึ่ง route guard อย่างเดียว
- [x] คืนเฉพาะ booking ของ student ที่ parent มีสิทธิ์ดู
- [x] ต่อรายการ booking ใน LIFF และปุ่ม cancel เฉพาะสถานะ `reserved`
- [x] เพิ่ม tests: own booking, booking ของคนอื่นต้อง forbidden, cancelled booking conflict

**ผ่านเมื่อ:**

- [x] LIFF แสดง booking จริงและยกเลิกได้
- [x] parent เดา ID ของเด็กอื่นแล้วไม่ได้ข้อมูล/แก้ข้อมูล
- [x] focused tests ผ่าน
- [x] LIFF build, API build และ validator ผ่าน

### Slice B: Makeup credit expired test

**เป้าหมาย:** ปิด test gap ที่เหลือของ core makeup

**ไฟล์เป้าหมาย:**

- `API/academy-API.Tests/unitTest/RefactoredSliceServiceTests.cs`
- `Objective/taskPlan.md`

**งาน:**

- [x] เพิ่ม AAA test เมื่อ `ExpiresAt <= UtcNow` ต้องจองไม่ได้
- [x] ยืนยันว่า repository create booking ไม่ถูกเรียก

**ผ่านเมื่อ:**

- [x] focused refactored slice tests ผ่าน
- [x] checklist ข้อนี้เปลี่ยนเป็น `[x]`

## รอบถัดไป: P1 schema-gated work

### Slice C: Leave attachment

**ต้องตัดสินใจก่อน:** schema ปัจจุบันยังไม่มี `leave_requests.attachment_url` และไม่มี attachment table

**งานตามลำดับ:**

- [x] ออกแบบ `leave_request_attachments` จาก SRS และเพิ่มใน `sql_script.md`/`erProjec.md` เป็น Proposed schema
- [x] เพิ่ม model + DbContext mapping หลัง schema พร้อมเท่านั้น (schema verified from `results-2026-09-12-220648.csv`)
- [x] เพิ่ม service validation: MIME type, size, ownership
- [x] เพิ่ม upload endpoint และ response URL
- [x] ต่อ LIFF file input
- [x] เพิ่ม tests สำหรับ file type, size, ownership และ upload failure

**ผ่านเมื่อ:**

- [x] schema export รอบใหม่ยืนยัน column/table (`results-2026-09-12-220648.csv`)
- [x] upload URL ถูกบันทึกผ่าน `IFileStorageService` และคืนกลับใน response
- [x] UI ไม่แสดงข้อความว่า attachment ใช้ไม่ได้ก่อน backend พร้อม; มี file input และ upload flow แล้ว

### Slice D: Admin audit log

**เป้าหมาย:** checkout ต้องตรวจย้อนหลังได้ว่าใครทำ เมื่อไร และรับเด็กโดยใคร

**งาน:**

- [x] กำหนด `AuditLog` event contract สำหรับ checkout
- [x] เขียน audit ใน transaction เดียวกับ attendance checkout
- [x] เพิ่ม read endpoint/service สำหรับ audit detail ที่จำเป็น
- [x] แสดง server timestamp และ actor ใน Admin UI
- [x] เพิ่ม tests ว่า failed checkout ไม่สร้าง audit record

## รอบถัดไป: Architecture boundary

### Slice E: ย้าย legacy controller ทีละไฟล์

ลำดับที่แนะนำ:

1. `FileUploadEndpoints.cs`
2. `InstituteEndpoints.cs`
3. `TeacherEndpoints.cs`
4. `UserEndpoints.cs`
5. `AuthEndpoints.cs`
6. `ParentEndpoints.cs`
7. `MakeupEndpoints.cs` ownership query

ต่อหนึ่งไฟล์ให้ทำครบ:

- [ ] สร้าง DTO/interface service/repository ที่จำเป็น
- [ ] ย้าย EF query ออกจาก controller
- [ ] ย้าย transaction/state rule ออกจาก controller
- [ ] เพิ่ม focused tests
- [ ] ตรวจว่า grep direct EF ของไฟล์นั้นเป็นศูนย์ หรือมีเหตุผลที่บันทึกไว้
- [ ] build และ full test ผ่าน

สถานะรายไฟล์:

- [x] `FileUploadEndpoints.cs`: แยกเป็น service/repository, focused tests `4/4`, direct EF `0`
- [x] `InstituteEndpoints.cs`: แยกเป็น service/repository, focused tests `4/4`, direct EF `0`
- [x] `TeacherEndpoints.cs`: แยกเป็น service/repository, focused tests `6/6`, direct EF `0`
- [ ] `UserEndpoints.cs`
- [ ] `AuthEndpoints.cs`
- [ ] `ParentEndpoints.cs`
- [ ] `MakeupEndpoints.cs` ownership query

**Definition of Done ของ architecture รอบนี้:**

- [/] controller direct EF matches ลดจาก `101` เหลือ `63` หลังปิด FileUpload + Institute + Teacher; เป้าหมาย scope ทั้งหมดคือ `0`
- [ ] ไม่มี controller เริ่ม transaction หรือเรียก `SaveChanges`
- [ ] ทุก endpoint ใน scope มี service/repository ownership ชัดเจน

## P2 หลัง boundary เสถียร

### Slice F: Student card PDF

- [x] สร้าง `StudentCardPdfService` แยกจาก controller
- [x] ใช้ QR token และข้อมูล student จริง
- [x] upload ผ่าน `IFileStorageService`
- [x] เพิ่ม endpoint `GET /api/students/{id}/card.pdf`
- [x] เพิ่ม AAA tests สำหรับ student not found และ PDF generation
- [x] ต่อปุ่ม download ใน Admin UI

### Slice G: Export

- [x] กำหนด CSV เป็น first delivery ก่อน XLSX
- [x] เพิ่ม service/repository query แบบ async streaming
- [x] เพิ่ม endpoint `GET /api/students/export?format=csv` และ content type `text/csv`
- [x] เพิ่ม tests เรื่อง tenant isolation และ empty dataset
- [ ] ค่อยเพิ่ม XLSX หลัง CSV ผ่านจริง

### Slice H: Payment slip verification

- [x] กำหนด provider contract และผลลัพธ์ `verified/amount/reference/reason`
- [x] ห้ามเปลี่ยน payment เป็น verified หาก amount ไม่ตรง
- [x] เก็บ provider payload ตาม schema ที่มีอยู่
- [x] เพิ่ม mock provider tests และ conflict tests
- [/] ผูก provider จริงใน production (default provider ตอนนี้ตอบ `503 provider unavailable` จนกว่าจะตั้งค่า)

### Slice I: Background jobs

แยก worker ตาม trigger ไม่ทำ worker ก้อนเดียว:

- [x] late attendance หลังเริ่มเรียน 20 นาที (`LateAttendanceNotificationJob`)
- [x] homework reminder ก่อน due 24 ชั่วโมง (`HomeworkReminderNotificationJob`)
- [x] quota low เมื่อเหลือไม่เกิน 3 (`QuotaLowNotificationJob`)
- [/] notification log ทุกการส่ง: background jobs log แล้ว; attendance/payment flow เดิมยังต้อง refactor เข้า dispatcher
- [x] idempotency กันส่งซ้ำด้วย deterministic key ใน notification payload
- [x] tests สำหรับ retry และ duplicate execution (`BackgroundNotificationTests` `4/4`)

**หลักฐาน Slice I รอบนี้:**

- Hosted worker แยก 3 service และแต่ละตัวเรียก `RunOnceAsync` ของ job เฉพาะ trigger
- `notifications` บันทึกสถานะ `pending`, `retrying`, `sent`, `failed`, retry count และ error message
- duplicate execution ที่พบ notification สถานะ `sent` จะไม่ส่ง LINE ซ้ำ
- retry สูงสุด 3 ครั้ง และ worker จับ exception เพื่อไม่ให้ host หยุดทำงาน
- idempotency ปัจจุบันใช้ payload key เพราะ schema ที่ยืนยันยังไม่มี unique `idempotency_key` column; multi-instance race ต้องปิดด้วย schema migration ในรอบถัดไป

### Slice J: Admin inactivity timeout / CI / load test

- [x] Admin inactivity timeout 30 นาทีใน frontend + token/cookie policy ที่สอดคล้อง
- [x] CI build API, Front และ LineLiff (`.github/workflows/ci.yml`)
- [/] CI รัน focused/full tests: API/full และ Front focused ผ่าน; Front full มี legacy `dashboard-page.test.jsx` ล้มเหลว 30 กรณี
- [x] k6 attendance load test พร้อม threshold ที่ระบุ (`load-tests/attendance.js`)

**หลักฐาน Slice J รอบนี้:**

- Admin inactivity timer ใช้ activity events และ auto-logout เมื่อไม่มี activity 30 นาที
- JWT access token และ auth cookie ใช้ `Jwt:ExpiryInMinutes = 30`; มี focused timeout test `2/2`
- CI แยก API, Front และ LineLiff jobs พร้อม restore/install, build และ test commands
- k6 ใช้ 100 VUs เป็นเวลา 30 วินาที พร้อม thresholds `p95 < 2s`, `p99 < 3s`, checks `> 99%`
- k6 ต้องรันกับ environment จริงที่กำหนด `BASE_URL`, `AUTH_TOKEN`, `SESSION_ID` และ `QR_TOKEN`/`QR_TOKENS`

## Definition of Done ของแผนนี้

 - [/] ทุก slice มี issue/file scope ชัดเจน (Slice J มี scope แล้ว; ยังไม่มี issue tracker reference กลาง)
 - [/] ทุก slice มี focused tests และ command ที่รันซ้ำได้ (Front full suite ยังมี legacy failures)
 - [x] `api-target.json` ตรงกับ DTO/route ของ implementation ที่ประกาศว่า implemented
 - [x] `validate-api-contract.ps1` รายงาน `Errors = 0`
 - [x] API build ผ่าน
 - [x] Full API tests ผ่าน โดยรายงานจำนวน pass/fail/skip (`241/0/0`)
 - [x] Controller boundary audit มีตัวเลขก่อน/หลัง (`101` เหลือ `77`)
 - [x] `Objective/process.md` อัปเดตจากหลักฐานหลังจบรอบ

## Commands หลัก

```powershell
# API build
 dotnet build .\API\academy-API.csproj --no-restore -o .\API\bin\DodValidation

# Full API tests
 dotnet build .\API\academy-API.Tests\academy-API.Tests.csproj --no-restore -o .\API\bin\DodValidation
 dotnet vstest .\API\bin\DodValidation\academy-API.Tests.dll

# Front build
 Push-Location .\Front; npm run build; Pop-Location

# LIFF build
 Push-Location .\LineLiff; npm run build; Pop-Location

# Contract validation
 Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
 .\Objective\validate-api-contract.ps1

# Controller ownership audit
 $hits = Get-ChildItem '.\API\Controllers\*.cs' | ForEach-Object { Select-String -Path $_.FullName -Pattern 'TutoringDbContext|DbContext|SaveChanges|BeginTransaction|FirstOrDefaultAsync|ToListAsync|AnyAsync' }
 $hits.Count
```

## ลำดับลงมือจริง

1. ~~Slice A: parent booking cancellation~~ (เสร็จสมบูรณ์)
2. ~~Slice B: expired credit test~~ (เสร็จสมบูรณ์)
3. ~~Slice C: schema decision + leave attachment~~ (เสร็จสมบูรณ์หลัง schema verified)
4. ~~Slice D: audit log checkout~~ (เสร็จสมบูรณ์)
5. ~~Slice F: student card PDF~~ (เสร็จสมบูรณ์)
6. ~~Slice G: student CSV export~~ (เสร็จสมบูรณ์; XLSX รอระยะถัดไป)
7. ~~Slice H: payment slip verification~~ (เสร็จสมบูรณ์; รอต่อ live AI provider)
8. Slice E: legacy controller boundary 4 ไฟล์ที่เหลือ (`Teacher`, `User`, `Auth`, `Parent`)
9. Slice I: background jobs (core workers done; existing attendance/payment notification logging remains)
10. Slice J: admin inactivity timeout / CI / load test
