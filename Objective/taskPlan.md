# Execution Plan ปัจจุบัน

> ปรับแผน: 12 กันยายน 2026
> เป้าหมาย: ทำงานเป็นรอบเล็กที่ build/test/ตรวจหลักฐานได้จริง ไม่ติ๊กงานจากการมี schema หรือ route อย่างเดียว

## Baseline ที่ยืนยันแล้ว

- Current API snapshot: `68 paths / 42 schemas`
- Target API contract: `73 paths / 62 schemas`
- Latest schema export: `Objective/results-2026-09-12-220648.csv`
- Contract validator: `Objective/validate-api-contract.ps1`
- API build ล่าสุดที่ผ่าน: `API/bin/DodValidation`
- Full API tests ล่าสุด: `230 passed / 0 failed / 0 skipped`
- Controller ที่ยังมี direct EF/data access: `5 files / 82 matches`
  - `AuthEndpoints.cs`
  - `InstituteEndpoints.cs`
  - `MakeupEndpoints.cs` เฉพาะ ownership guard ที่ยังอยู่หน้า route
  - `ParentEndpoints.cs`
  - `TeacherEndpoints.cs`
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
- [x] Parent LIFF: leave status, session selection, makeup credit, slot list และ booking
- [x] Admin attendance/pickup UI
- [x] Receipt PDF renderer และ upload ผ่าน `IFileStorageService`
- [x] Contract validator, tenant-aware test fixture และ EF model cache key
- [x] Full API test suite ผ่าน `225/225`

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
- [ ] `InstituteEndpoints.cs` (ไฟล์ถัดไป)
- [ ] `TeacherEndpoints.cs`
- [ ] `UserEndpoints.cs`
- [ ] `AuthEndpoints.cs`
- [ ] `ParentEndpoints.cs`
- [ ] `MakeupEndpoints.cs` ownership query

**Definition of Done ของ architecture รอบนี้:**

- [/] controller direct EF matches ลดจาก `101` เหลือ `82` หลังปิด FileUpload; เป้าหมาย scope ทั้งหมดคือ `0`
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

- [ ] กำหนด provider contract และผลลัพธ์ `verified/amount/reference/reason`
- [ ] ห้ามเปลี่ยน payment เป็น verified หาก amount ไม่ตรง
- [ ] เก็บ provider payload ตาม schema ที่มีอยู่
- [ ] เพิ่ม mock provider tests และ conflict tests

### Slice I: Background jobs

แยก worker ตาม trigger ไม่ทำ worker ก้อนเดียว:

- [ ] late attendance หลังเริ่มเรียน 20 นาที
- [ ] homework reminder ก่อน due 24 ชั่วโมง
- [ ] quota low เมื่อเหลือไม่เกิน 3
- [ ] notification log ทุกการส่ง
- [ ] idempotency กันส่งซ้ำ
- [ ] tests สำหรับ retry และ duplicate execution

### Slice J: Admin inactivity timeout / CI / load test

- [ ] Admin inactivity timeout 30 นาทีใน frontend + token policy ที่สอดคล้อง
- [ ] CI build API, Front และ LineLiff
- [ ] CI รัน focused/full tests
- [ ] k6 attendance load test พร้อม threshold ที่ระบุ

## Definition of Done ของแผนนี้

- [ ] ทุก slice มี issue/file scope ชัดเจน
- [ ] ทุก slice มี focused tests และ command ที่รันซ้ำได้
- [ ] `api-target.json` ตรงกับ DTO/route ของ implementation ที่ประกาศว่า implemented
- [ ] `validate-api-contract.ps1` รายงาน `Errors = 0`
- [ ] API build ผ่าน
- [ ] Full API tests ผ่าน โดยรายงานจำนวน pass/fail/skip
- [ ] Controller boundary audit มีตัวเลขก่อน/หลัง
- [ ] `Objective/process.md` อัปเดตจากหลักฐานหลังจบรอบ

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

1. Slice A: parent booking cancellation
2. Slice B: expired credit test
3. Slice C: schema decision + leave attachment
4. Slice D: audit log checkout
5. Slice E: legacy controller boundary ทีละไฟล์
6. Slice F-J: P2 ที่เหลือตาม dependency
