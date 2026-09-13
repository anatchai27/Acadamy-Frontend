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

## 3. แผนใหม่ตามลำดับ Customer Value

> หลักการปรับลำดับ: ส่งมอบสิ่งที่ลูกค้ามองเห็นและใช้งานได้ก่อน technical hardening แต่ห้ามสร้าง UI ที่แสดงข้อมูลปลอมหรือผูกกับ business rule ที่ยังไม่ยืนยัน

### 3.0 Priority order ใหม่

| Priority | Customer-facing slice | เหตุผล | Gate ก่อนเริ่ม |
|---|---|---|---|
| P0 | ปิดช่องว่าง UI ที่ลูกค้าใช้งานประจำ: Public Website/ทดลองเรียน, Admin finance, Leave & Make-up, Homework/LIFF | กระทบการสมัครเรียน การเงิน และ daily operation โดยตรง | contract, API response และ ownership ต้องตรวจจาก source |
| P1 | Admin Operations UI: Holiday Calendar, File Manager, Teacher Payroll, Broadcast | ลดงาน manual และทำให้ customer/staff เห็น workflow ครบ | requirement/schema/role ต้องยืนยันก่อน |
| P1 | Reports UI: Analytics, Teacher Timesheet, Revenue detail/export | ทำให้ผู้บริหารใช้ข้อมูลตัดสินใจได้ | สูตร, source data, timezone และ export contract ต้องยืนยัน |
| P2 | Technical hardening: concurrency, backup evidence, k6, provider/runtime validation | ลดความเสี่ยง production หลัง customer flow ใช้งานได้ | ต้องมี environment และ acceptance ที่ตรวจได้ |

### 3.1 Customer-facing UI backlog (ทำก่อน technical backlog)

**P0: ทำต่อทันทีเมื่อ contract พร้อม**

- [ ] Public Website: หน้า home, ผลงานนักเรียน, ครู, คอร์ส/ราคา และติดต่อเรา ให้ครบตาม content contract
- [ ] Trial-class journey: เชื่อม landing page → ฟอร์มทดลองเรียน → success/error state → admin lead follow-up
- [ ] Finance UI: ยืนยัน payment status policy ก่อนปรับ revenue chart, history และ CSV export ให้ตรงกับรายรับจริง
- [ ] Leave & Make-up Admin UI: จัดการ slot, group cancel, คืนเครดิต และแสดงผลสำเร็จ/ข้อผิดพลาดจาก API จริง
- [ ] LIFF Homework/Make-up: ตรวจ loading, empty, validation, upload และ booking state บน flow ที่ customer ใช้จริง

**P1: หลัง P0 และ requirement ผ่าน**

- [ ] Holiday Calendar Admin UI: ทำได้เฉพาะหลังยืนยัน institute scope, timezone, recurrence, suppression matrix, RBAC และ schema
- [ ] File Manager UI: แสดงรายการไฟล์, upload, permission, error และลิงก์ storage ตาม contract ที่ยืนยัน
- [ ] Teacher Payroll UI: แสดงงวด, ชั่วโมง, rate, status และ export หลังยืนยันสูตรและ source tables
- [ ] Broadcast UI: เลือกกลุ่มผู้รับ, preview, confirmation, result และ audit หลังยืนยัน recipient/notification policy
- [ ] Analytics UI: Renewal, churn, forecast และ timesheet หลังยืนยันสูตร, date window, timezone และ privacy rule

**P2: UI quality gate**

- [ ] ทุกหน้าต้องมี loading, empty, validation, error, forbidden และ success state ตามความเสี่ยง
- [ ] ทุก mutation ต้องตรวจ tenant/ownership ที่ API และมี focused UI/service test
- [ ] หน้าที่แตะ Front หรือ LIFF ต้องผ่าน responsive check และ build ก่อนปิด slice

### 3.2 Technical backlog หลัง customer-facing slices

**ผ่าน UI gate แล้วจึงกลับไปทำตามลำดับความเสี่ยง:**

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
- [/] จาก code evidence ปัจจุบัน `sessions` เป็น source of truth ของ create flow; `room_bookings` ยังไม่มี repository/endpoint ที่ใช้งาน แต่ยังไม่มี production runtime evidence
- [/] ออกแบบและ implement MySQL/TiDB named lock + transaction สำหรับ concurrent insert; ยังต้องพิสูจน์ด้วย integration/concurrency test กับ database environment จริง
- [ ] เพิ่ม integration/concurrency test กับ engine ที่ใช้จริง
- [/] overlap query ไม่ block `sessions.status = cancelled` และ block status อื่นตาม code; ยังต้องยืนยัน requirement/runtime data จริง

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

เริ่มจาก **Customer-facing UI backlog P0** โดยทำตาราง scope แยกต่อหน้า: customer outcome, API contract, existing implementation, missing state และ evidence ที่ต้องรัน จากนั้นเลือก slice แรกที่ contract พร้อมทำ focused implementation/test ก่อนกลับไป technical hardening
