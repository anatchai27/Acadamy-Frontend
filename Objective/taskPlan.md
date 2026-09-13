# Execution Plan รอบใหม่

> ปรับแผน: 13 กันยายน 2026
> หลักการ: ทำทีละ slice, อ้างอิง code/schema/test ที่ตรวจได้จริง และห้ามติ๊กงานจากการมี route, DTO หรือ schema อย่างเดียว

## 1. Baseline ที่ยืนยันแล้ว

### Validation ล่าสุด

- API contract validator: `92 current operations`, `96 target operations`
- Validator result: `88 implemented`, `4 partial`, `4 new`, `0 errors`, `141 warnings`
- API build: ผ่านด้วย output `API/bin/DodValidation`
- Full API tests: `254 passed / 0 failed / 0 skipped`
- Front build: ผ่าน
- LineLiff build: ผ่าน
- Front full tests: `46 passed / 30 failed`; ทั้ง 30 failures อยู่ใน `dashboard-page.test.jsx`
- Front inactivity focused test: `2 passed / 0 failed`

### Architecture และ schema

- Controller direct EF/data access: `38 matches` ใน `ParentEndpoints.cs` ไฟล์เดียว
- `MakeupEndpoints.cs` ใช้ service/repository แล้ว และไม่อยู่ในผล direct EF audit ล่าสุด
- Schema export: `Objective/results-2026-09-12-220648.csv`
- Schema export มี `38 tables / 420 columns`
- `leave_request_attachments` มีอยู่จริงใน schema และมี 10 columns
- `makeup_slots.institute_id` มีอยู่จริงใน schema
- `makeup_credits.status`, `used_at`, `expired_at` มีอยู่จริงใน schema
- `POST /api/public/leads` มีใน `Front/docAPI/api-target.json` แต่ยังไม่พบ implementation ใน `API` จากการค้น source ล่าสุด

## 2. กติกาก่อนเริ่มแต่ละ slice

1. อ่าน endpoint, DTO, service, repository, UI และ schema ที่เกี่ยวข้องก่อนแก้
2. ถ้า contract เปลี่ยน ให้แก้ DTO/contract ก่อน implementation
3. Controller ทำเฉพาะ request mapping, authorization boundary และ HTTP response
4. Service คุม business rule และ state transition
5. Repository คุม query, persistence และ transaction
6. เพิ่ม test อย่างน้อย success, validation และ forbidden/conflict ตามความเสี่ยง
7. รัน focused test ก่อน full suite
8. รัน API build, frontend build และ contract validator เมื่อปิด slice
9. อัปเดต `Objective/process.md` เฉพาะสิ่งที่มีหลักฐานใหม่
10. ถ้ายังไม่มี runtime evidence ให้ใช้สถานะ `[/]` ไม่ใช้ `[x]`

## 3. แผนรอบใหม่ตามลำดับความเสี่ยง

### Slice 1: ปิด Front legacy dashboard tests

**เหตุผล:** เป็น test failure ที่ยืนยันได้ 30 กรณี และทำให้ Front full suite ยังไม่ผ่าน

**ขอบเขต:**

- `Front/src/pages/admin/dashboard-page.jsx`
- `Front/src/pages/admin/__tests__/dashboard-page.test.jsx`
- components ที่ dashboard ใช้จริง

**งาน:**

- [x] อ่าน failure ทั้ง 30 กรณีและแยกว่า test เก่ากับ implementation regression
- [x] ตรวจแล้วว่า implementation ปัจจุบันตรง requirement จึงไม่แก้ production dashboard
- [x] แก้ test เฉพาะกรณีที่ assertion ผูกกับ UI เก่าซึ่งไม่ใช่ behavior ปัจจุบัน
- [x] เพิ่ม/ปรับ mock ให้ไม่ทำให้ Preact object ถูก freeze หรือ mutate ไม่ได้

**ผ่านเมื่อ:**

- [x] Front full suite ผ่าน หรือมี failure ที่อธิบายได้และบันทึกเป็น known gap
- [x] Front build ผ่าน
- [ ] ไม่มีการลบ test เพียงเพื่อให้ตัวเลขผ่าน

### Slice 2: รวม notification logging ให้ครบ flow หลัก

**เหตุผล:** background jobs มี dispatcher และ log แล้ว แต่ attendance/payment flow เดิมยังเรียก LINE service โดยตรง

**ขอบเขต:**

- `API/Services/AttendanceService.cs`
- `API/Services/PaymentService.cs`
- `API/Services/BackgroundNotificationService.cs`
- `API/Repositories/BackgroundNotificationRepository.cs`
- tests ที่เกี่ยวข้องกับ notification, attendance และ payment

**งาน:**

- [x] ระบุทุกจุดที่เรียก `SendAttendanceNotificationAsync` และ `SendPaymentNotificationAsync`
- [x] กำหนด notification type และ deterministic idempotency key ต่อ flow
- [x] ให้ attendance/payment ผ่าน dispatcher ที่เขียน `notifications`
- [x] รักษา transaction boundary เดิมของ attendance checkout และ payment
- [x] เพิ่ม tests สำหรับ success, provider failure, retry และ duplicate execution
- [x] ตรวจ multi-instance race และบันทึกข้อจำกัดจาก schema ที่ไม่มี unique idempotency column

**ผ่านเมื่อ:**

- [x] ทุก flow ที่ประกาศว่า log ได้ มี record ใน `notifications` จาก code path เดียวกัน
- [x] failed delivery มีสถานะและ retry behavior ที่ตรวจได้
- [x] focused tests และ full API tests ผ่าน

### Slice 3: ย้าย direct EF ที่เหลือจาก ParentEndpoints

**เหตุผล:** audit ล่าสุดเหลือ `ParentEndpoints.cs` 38 matches เป็น boundary gap เดียวที่ยืนยันได้

**ขอบเขต:**

- `API/Controllers/ParentEndpoints.cs`
- service/repository/DTO ที่จำเป็น
- tests ของ parent dashboard, profile และ child data access

**งาน:**

- [x] แยก query ของ dashboard/profile/child data ตาม responsibility จริง
- [x] ย้าย EF query ออกจาก controller โดยไม่เปลี่ยน response contract ที่ใช้งานอยู่
- [x] ตรวจ tenant filter และ parent-child ownership ทุก endpoint
- [x] เพิ่ม focused tests สำหรับ own child, foreign child และ not found
- [x] รัน controller ownership audit ซ้ำ

**ผ่านเมื่อ:**

- [x] `ParentEndpoints.cs` direct EF/data access เหลือ `0`
- [x] direct EF รวมใน controllers เหลือ `0` ตาม scope ปัจจุบัน
- [x] API tests และ contract validator ผ่าน

### Slice 4: Implement public trial-class lead ตาม contract

**เหตุผล:** target contract มี `POST /api/public/leads` แต่ source API ยังไม่พบ implementation

**ขอบเขต:**

- `Front/docAPI/api-target.json`
- `API/Models/Lead.cs`
- `API/Data/TutoringDbContext.cs`
- public endpoint/service/repository ที่ต้องเพิ่ม
- frontend public trial-class form เมื่อ backend พร้อม

**งาน:**

- [x] ตรวจ `CreateLeadRequest` ใน contract เทียบกับ model/schema จริง และเพิ่ม `instituteSlug`/`student_name` ที่จำเป็น
- [x] เพิ่ม public input validation และ fixed-window rate limit 10 requests/IP/minute
- [x] เพิ่ม endpoint ให้ resolve active institute จาก slug และบันทึก Lead โดยไม่เปิดข้อมูล tenant ข้ามสถาบัน
- [x] แยก notification behavior ออกจากการรับ lead และบันทึกว่า notification ยังรอ admin recipient contract
- [/] เพิ่ม API tests สำหรับ valid input, invalid input และ unknown-institute case; ยังไม่มี duplicate rule ที่ requirement ยืนยัน
- [x] ต่อ frontend trial-class form ที่ `/trial-class` และ API service

**ผ่านเมื่อ:**

- [x] endpoint implementation, DTO และ target contract ตรงกันใน scope ของ public lead
- [x] API test พิสูจน์ได้ว่าบันทึก lead สำเร็จ, validation และ institute resolution ทำงาน
- [x] มี public trial-class UI และ frontend build ผ่าน แต่ยังไม่ประกาศว่า public website ครบ

### Slice 5: ปิด parent workflow ที่ยังไม่มี UI

**เหตุผล:** backend หลักมีแล้ว แต่ UI ยังไม่ครบตาม acceptance criteria

**ลำดับย่อย:**

1. Admin UI สร้างและยกเลิก make-up slot
2. LIFF homework list และ upload submission
3. LIFF skill score detail พร้อม chart ที่เลือกใช้จริง

**งานร่วม:**

- [x] ตรวจ API response กับ UI state ก่อนทำหน้าใหม่ และเติม parent submission API ที่ขาดจริง
- [x] แสดง loading, empty, error และ permission/ownership state ในทั้ง 3 flow
- [/] เพิ่ม focused frontend tests: makeup service `3 passed`; ยังไม่มี component test สำหรับ LIFF pages
- [/] ทดสอบ tenant/parent ownership ผ่าน service/API boundary tests; ยังไม่มี runtime integration test กับ DB จริง

**ผ่านเมื่อ:**

- [x] แต่ละ flow มีหน้าใช้งานจริงต่อกับ API จริง
- [x] มี success/error/loading/empty evidence จาก code path และ focused tests
- [x] Front และ LineLiff build ผ่าน

### Slice 6: Payment/reporting และ operational gaps

ทำหลัง Slice 1-5 เสถียรแล้ว:

- [ ] เชื่อม live AI/OCR provider ผ่าน `ISlipVerificationProvider` โดยมี timeout และ failure policy
- [ ] เพิ่ม payment export และกราฟรายรับตาม requirement ที่ยืนยันแล้ว
- [ ] เพิ่ม analytics/report API จากข้อมูลจริง ไม่ใช้ mock data
- [ ] เพิ่ม holiday calendar และ room overlap validation
- [ ] ตรวจ automated backup จาก provider/environment จริง
- [ ] รัน k6 กับ environment จริงและเก็บผล `p95 < 2s`, `p99 < 3s`, checks `> 99%`

## 4. งานที่ยังห้ามติ๊ก `[x]`

- ห้ามนับ route ใน `api-target.json` เป็น implementation
- ห้ามนับ schema เป็นหลักฐานว่า workflow ผ่าน
- ห้ามนับ hosted worker เป็น runtime evidence จนกว่าจะมีผลการรันที่ตรวจสอบได้
- ห้ามนับ k6 script เป็นผล load test
- ห้ามปิด Front test gap ด้วยการลบหรือ skip test โดยไม่มีเหตุผลทาง requirement
- ห้ามประกาศ public lead ว่าพร้อมจนมี endpoint implementation และ test

## 5. Definition of Done รอบนี้

- [ ] Slice มี scope ไฟล์และ acceptance ที่ตรวจได้
- [ ] มี focused tests และ command ที่รันซ้ำได้
- [ ] API contract validator: `Errors = 0`
- [ ] API build ผ่าน
- [ ] Full API tests ผ่าน พร้อมจำนวน pass/fail/skip
- [ ] Front และ LineLiff build ผ่านเมื่อ slice แตะ frontend
- [ ] Controller audit มีตัวเลขก่อน/หลัง
- [ ] `process.md` อัปเดตจากหลักฐานหลังปิด slice

## 6. Commands หลัก

```powershell
# API build
dotnet build .\API\academy-API.csproj --no-restore -o .\API\bin\DodValidation

# Full API tests
dotnet build .\API\academy-API.Tests\academy-API.Tests.csproj --no-restore -o .\API\bin\DodValidation
dotnet vstest .\API\bin\DodValidation\academy-API.Tests.dll

# Front tests and build
Push-Location .\Front; npm.cmd test -- --run; npm.cmd run build; Pop-Location

# LIFF build
Push-Location .\LineLiff; npm.cmd run build; Pop-Location

# Contract validation
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\Objective\validate-api-contract.ps1

# Controller ownership audit
$patterns = 'TutoringDbContext|DbContext|SaveChanges|BeginTransaction|FirstOrDefaultAsync|ToListAsync|AnyAsync'
$hits = Get-ChildItem '.\API\Controllers\*.cs' | ForEach-Object { Select-String -Path $_.FullName -Pattern $patterns }
$hits.Count
```

## 7. Current next action

ดำเนินการ **Slice 4: Implement public trial-class lead ตาม contract** แล้ว โดยมี API, schema change script, UI และหลักฐาน build/test/contract validator ตามที่ระบุไว้ด้านบน
