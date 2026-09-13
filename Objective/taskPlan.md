# Execution Plan รอบใหม่

> ปรับแผน: 13 กันยายน 2026
> หลักการ: ทำทีละ slice, ใช้หลักฐานจาก source/schema/test/runtime เท่านั้น และแยก “มีโค้ด” ออกจาก “พิสูจน์ว่าใช้งานจริง”

## 1. กติกาหลัก

1. อ่าน endpoint, contract, DTO, service, repository, UI, schema และ test ที่เกี่ยวข้องก่อนแก้
2. ถ้า contract ยังไม่กำหนด business rule ให้หยุดที่ discovery และบันทึกคำถาม ห้ามเดา default
3. Controller ทำเฉพาะ mapping, authorization boundary และ HTTP response
4. Service คุม validation, business rule และ state transition
5. Repository คุม query, persistence และ transaction
6. ทุก flow ที่แตะข้อมูล tenant ต้องพิสูจน์ `institute_id` และ ownership
7. เพิ่ม test อย่างน้อย success, validation และ forbidden/conflict ตามความเสี่ยง
8. รัน focused test ก่อน full suite
9. ปิด slice ต้องรัน build ที่เกี่ยวข้องและ contract validator
10. `[/]` ใช้เมื่อมี code evidence แต่ยังไม่มี runtime/integration evidence; `[x]` ใช้เมื่อ acceptance ใน scope ถูกพิสูจน์ตามหลักฐานที่กำหนดแล้ว

## 2. Baseline ที่ยืนยันแล้ว

### Validation ล่าสุด

- API build: ผ่านด้วย output `API/bin/Slice6Validation`
- Full API tests: `266 passed / 0 failed / 0 skipped`
- Front tests: `79 passed / 0 failed / 0 skipped`
- Front build: ผ่าน
- LineLiff build: ผ่าน
- API contract validator: `Errors = 0`, `Warnings = 141`
- Contract validator แสดง `92 current operations`, `97 target operations`; ตัวเลขนี้ต้องตรวจซ้ำหลังปรับสถานะ target ให้ตรง source
- Controller direct EF/data access audit: `0` ตาม scope ปัจจุบัน

### หลักฐาน Slice ที่ปิดแล้ว

- Slice 1: Front dashboard legacy tests ผ่านโดยไม่ลบหรือ skip test
- Slice 2: attendance/payment ผ่าน notification dispatcher และมี idempotency key; schema ยังไม่มี unique idempotency constraint จึงยังมี multi-instance race risk
- Slice 3: ย้าย direct EF ออกจาก `ParentEndpoints.cs` และ controller scope เหลือ `0 matches`
- Slice 4: public lead endpoint, rate limit, institute resolution, trial-class UI และ tests มีแล้ว; duplicate rule และ admin recipient ยังไม่ยืนยัน
- Slice 5: makeup slot UI, LIFF homework submission และ skill score page มีแล้ว; ยังไม่มี component/integration runtime tests
- Slice 6 ส่วนที่ทำแล้ว: revenue report API, payment CSV export, Finance revenue chart และ room-overlap validation

### หลักฐาน schema/runtime ที่ยังไม่มี

- ไม่มี production DB integration evidence ใน workspace
- ไม่มี live OCR provider endpoint/credential/payload contract ที่ยืนยันได้
- ไม่มี holiday schema/business rule ที่ครบ
- ไม่มี backup schedule/provider evidence
- ไม่มี k6 result จาก environment จริง

## 3. แผนใหม่ตามลำดับความเสี่ยง

### Phase 0: Reconcile evidence และ contract

**เป้าหมาย:** ทำให้เอกสาร, target contract และ source ไม่ขัดกัน ก่อนเพิ่ม feature ใหม่

**งาน:**

- [ ] รัน contract validator จาก source ล่าสุดและเก็บตัวเลข current/target ใหม่
- [ ] ตรวจ target operations ที่ยังเป็น `new` หรือ `partial` ทีละรายการกับ implementation จริง
- [ ] เพิ่ม/แก้ `x-implementation-status`, security และ role declaration ใน contract เฉพาะรายการที่มีหลักฐานจาก source
- [ ] ตรวจ `process.md` รายการที่ยังเขียนว่า “ยังไม่มี” แต่มี implementation แล้ว เช่น revenue report, room overlap และ notification logging
- [ ] ทำตาราง gap แยก `code gap`, `contract gap`, `schema gap`, `runtime evidence gap`

**ผ่านเมื่อ:** เอกสารไม่อ้างตัวเลขเก่า และทุกสถานะมี source/test/runtime reference ที่เปิดอ่านซ้ำได้

### Phase 1: Payment/reporting hardening

**สถานะ:** `[/]` มี implementation และ unit tests แล้ว แต่ยังไม่มี DB integration/runtime evidence

**ขอบเขต:**

- `API/Controllers/PaymentEndpoints.cs`
- `API/Controllers/ReportEndpoints.cs`
- `API/Services/PaymentService.cs`
- `API/Services/RevenueReportService.cs`
- `API/Repositories/PaymentRepository.cs`
- `Front/src/pages/admin/finance-page.jsx`
- `Front/src/services/report-service.js`

**งาน:**

- [x] Revenue report จากข้อมูล payment จริง รองรับ day/month/year
- [x] Payment CSV export จากข้อมูลจริง พร้อม tenant filter
- [x] Finance chart, loading และ empty state
- [x] ตรวจช่วงวันที่, invalid `group_by`, CSV escaping และ locale-independent period format
- [x] เพิ่ม integration test กับ relational provider สำหรับ query filter, navigation และ date boundary
- [x] ทดสอบ authorization ของ report ให้ admin ผ่านและ role อื่นถูกปฏิเสธ
- [ ] ตัดสินใจจาก requirement ว่ารายงานต้องรวม payment status ใดบ้าง ห้ามสมมติว่า payment ทุก status คือรายรับ

**ผ่านเมื่อ:** contract, response shape, authorization, date boundary, tenant isolation และ export behavior มี test ที่รันซ้ำได้

### Phase 2: Room booking concurrency

**สถานะ:** `[/]` มี overlap query และ `409 ROOM_OVERLAP` แล้ว แต่ยังไม่พิสูจน์ concurrent request ใน DB จริง

**งาน:**

- [x] ตรวจช่วงเวลาทับซ้อนที่ room เดียวกันใน tenant เดียวกัน
- [x] ปฏิเสธ duration ที่ไม่ถูกต้อง
- [x] เพิ่ม unit test กรณี overlap และไม่สร้าง session
- [ ] ตรวจว่า `sessions` หรือ `room_bookings` เป็น source of truth ของการจองห้องตาม schema/runtime จริง
- [ ] ออกแบบ transaction/locking หรือ database constraint ที่ป้องกัน concurrent insert ได้จริง
- [ ] เพิ่ม integration/concurrency test กับ engine ที่ใช้จริง
- [ ] ตรวจ cancellation/status ว่ารายการ cancelled ไม่ block ห้อง แต่ status อื่นต้อง block ตาม requirement

**ผ่านเมื่อ:** ไม่เกิด overbooking จาก request พร้อมกัน และ rule ของ status/tenant มีหลักฐานจาก test หรือ runtime

### Phase 3: Live slip verification provider

**สถานะ:** `[ ]` ยังไม่มีข้อมูลที่พอ implement โดยไม่เดา

**ต้องได้ก่อนเริ่ม implementation:**

- provider ที่เลือกและเอกสาร API จริง
- authentication/secret source และ environment ที่ใช้ทดสอบ
- request/response payload, amount/reference semantics และ error codes
- timeout, retry, circuit-breaker และ failure policy ที่ผู้มีอำนาจยืนยัน
- กติกาการเก็บ raw payload และข้อมูลส่วนบุคคล

**งานหลังมีข้อมูลครบ:**

- [ ] สร้าง provider adapter หลัง `ISlipVerificationProvider` โดยไม่ผูก provider กับ domain service
- [ ] กำหนด timeout และ cancellation behavior
- [ ] แยก provider unavailable, invalid slip, amount mismatch และ duplicate verification
- [ ] เพิ่ม contract tests ด้วย payload ที่ provider อนุญาตให้ใช้
- [ ] ต่อ DI/config เฉพาะ environment และปิดการใช้งานเมื่อ config ไม่ครบ
- [ ] เก็บ runtime evidence โดยไม่ log secret หรือ raw PII เกิน policy

**ห้ามทำ:** สร้าง fake OCR provider หรือเดา endpoint/payload เพื่อให้ test ผ่าน

### Phase 4: Holiday calendar และ notification suppression

**สถานะ:** `[ ]` requirement และ schema ยังไม่ครบ

**Discovery ก่อนเขียน code:**

- [ ] ยืนยัน holiday เป็นระดับ institute หรือ global
- [ ] ยืนยัน timezone, recurring holiday, effective date และการแก้ไขย้อนหลัง
- [ ] ระบุ worker/notification ทุกตัวที่ต้อง suppress ในวันหยุด
- [ ] ยืนยันสิทธิ์ admin/staff และ audit requirement
- [ ] ยืนยัน schema/migration และ retention policy

**Implementation หลัง requirement ผ่าน:**

- [ ] เพิ่ม model/repository/service/endpoint ตาม contract ที่ยืนยัน
- [ ] เพิ่ม admin UI พร้อม loading, empty, validation และ audit state
- [ ] เพิ่ม tests สำหรับ holiday, timezone boundary, worker suppression และ tenant isolation
- [ ] ทดสอบกับ worker runtime จริงก่อนติ๊ก `[x]`

### Phase 5: Reports & analytics ที่ยังเป็น requirement gap

**สถานะ:** `[/]` revenue report มีแล้ว แต่ analytics เชิงลึกยังไม่มี definition ครบ

**งาน discovery:**

- [ ] นิยาม Renewal Rate, Churn Risk และ Revenue Forecast เป็นสูตรที่ผู้ใช้ยืนยัน
- [ ] ระบุ source tables, date window, timezone, missing data และ privacy rule
- [ ] ยืนยันว่ารายงาน Teacher Timesheet ใช้ `sessions`, `attendances` หรือทั้งสองอย่าง
- [ ] ยืนยันรูปแบบ export: CSV หรือ XLSX และ column contract
- [ ] ตัด Referral ออกจาก scope จนกว่าจะมี attribution rule และ schema ที่ยืนยัน

**Implementation หลังนิยามผ่าน:**

- [ ] เพิ่ม report service/repository ที่ query ข้อมูลจริงเท่านั้น
- [ ] เพิ่ม API contract และ authorization role
- [ ] เพิ่ม admin reports UI และ chart ที่มี loading/empty/error state
- [ ] เพิ่ม tests สูตรคำนวณ, timezone, tenant isolation และ export

### Phase 6: Backup และ production operational evidence

**สถานะ:** `[ ]` เป็นงานตรวจ environment ไม่ใช่งานเดาจาก config ใน repo

**งาน:**

- [ ] ระบุ provider/database account/environment ที่จะตรวจ
- [ ] ตรวจ backup schedule, retention, encryption, region และ access policy จาก provider console/API
- [ ] ตรวจ restore point และทำ restore drill ใน environment ที่ปลอดภัย
- [ ] บันทึก timestamp, command/result และผู้ตรวจใน evidence artifact โดยไม่เก็บ secret
- [ ] แก้ deployment/config เฉพาะเมื่อพบ gap ที่ยืนยันได้

**ผ่านเมื่อ:** มีหลักฐาน backup สำเร็จและ restore ได้จริง ไม่ใช่มีเพียง script หรือ setting file

### Phase 7: k6 performance evidence

**สถานะ:** `[/]` มี script แต่ยังไม่มีผล runtime

**งาน:**

- [ ] ยืนยัน environment URL, test account, seed data และ rate limit policy
- [ ] ยืนยันว่า test ไม่ยิง production โดยไม่ได้รับอนุญาต
- [ ] รัน baseline และเก็บ raw result/summary
- [ ] ตรวจ `p95 < 2s`, `p99 < 3s`, checks `> 99%` ตาม requirement
- [ ] วิเคราะห์ bottleneck และแก้เฉพาะสาเหตุที่วัดได้
- [ ] รันซ้ำหลังแก้และเก็บผลเปรียบเทียบ

**ผ่านเมื่อ:** มีผล k6 จาก environment จริงพร้อม timestamp, version, scenario และ threshold result

## 4. งานที่ห้ามติ๊ก `[x]`

- ห้ามนับ route, DTO หรือ schema เป็น implementation/workflow evidence
- ห้ามนับ unit test ที่ mock provider/database เป็น production runtime evidence
- ห้ามประกาศ live OCR โดยไม่มี provider contract และ credential ที่ตรวจได้
- ห้ามประกาศ backup จากไฟล์ config หรือ hosted worker โดยไม่มี provider/restore evidence
- ห้ามนับ k6 script เป็นผล load test
- ห้ามสร้าง holiday/analytics/referral rule จากการเดา
- ห้ามลบหรือ skip test เพื่อให้ตัวเลขผ่าน

## 5. Definition of Done ต่อ Slice

- [ ] มี scope file, contract และ acceptance ที่ตรวจได้
- [ ] มี focused tests และ command ที่รันซ้ำได้
- [ ] มี success, validation และ forbidden/conflict evidence ตามความเสี่ยง
- [ ] API build ผ่าน
- [ ] Full API tests ผ่าน พร้อมจำนวน pass/fail/skip
- [ ] Front/LineLiff build ผ่านเมื่อ slice แตะ frontend
- [ ] Contract validator `Errors = 0`
- [ ] Controller audit ไม่เพิ่ม direct EF/data access
- [ ] `process.md` อัปเดตด้วยหลักฐานใหม่เท่านั้น

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

## 7. Next Action

เริ่ม **Phase 0: Reconcile evidence และ contract** ก่อนเพิ่ม feature ใหม่ โดยเฉพาะการแก้ตัวเลข baseline ที่เก่า, ตรวจ target operations ที่ยังระบุ `new/partial` และแยก code evidence ออกจาก runtime evidence ให้เรียบร้อย
