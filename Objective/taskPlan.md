# UI + API Execution Plan

> แผนใหม่: 13 กันยายน 2026
> ขอบเขตรอบนี้: ทำ UI และ API ให้เชื่อมกันครบตาม contract ที่มีหลักฐานแล้ว
> หลักการ: ไม่เดา business rule, ไม่สร้าง mock เพื่อปิด task และไม่ติ๊กเสร็จจากการมี route หรือ component อย่างเดียว

## 1. กติกาของแผนนี้
C:\Project\Acadamy-Frontend\skills\skills.md
1. ทุก task ต้องระบุทั้งฝั่ง UI และ API ที่เกี่ยวข้อง
2. อ่าน route, DTO, endpoint, service, repository, schema และ test ก่อนแก้
3. ถ้า API contract หรือ business rule ยังไม่ชัด ให้หยุดที่ discovery และบันทึก gap
4. API ต้องตรวจ validation, authorization, tenant และ ownership ตามความเสี่ยง
5. UI ต้องรองรับ loading, empty, validation, error, forbidden และ success state ตามความเหมาะสม
6. ทุก mutation ต้องมี focused test อย่างน้อย success และ failure ที่สำคัญ
7. ใช้ response จาก API จริงตาม contract ห้ามใช้ mock data เพื่อทำให้หน้าจอดูเสร็จ
8. `[/]` = มี code evidence แต่ยังขาดหลักฐานการเชื่อม UI/API หรือ test ที่จำเป็น
9. `[x]` = UI/API flow และหลักฐานที่กำหนดของ task ผ่านแล้ว
10. งานนอกขอบเขตให้บันทึกเป็น deferred เท่านั้น ห้ามแทรกเข้ามาเป็น task ระหว่างรอบ

## 2. Definition of Done

ทุก UI + API slice ต้องผ่านรายการนี้ก่อนปิด:

- [ ] ระบุหน้า UI, route, endpoint และ response contract ที่ใช้
- [ ] UI มี state ที่จำเป็น: loading, empty, validation, error และ success
- [ ] API มี validation และ authorization/ownership boundary
- [ ] API มี tenant isolation เมื่อแตะข้อมูลสถาบัน
- [ ] มี focused API/service test สำหรับ success และ failure ที่สำคัญ
- [ ] มี focused UI/service test เมื่อ slice แตะ Front หรือ LIFF
- [ ] API build ผ่าน
- [ ] Front/LineLiff build ผ่านเมื่อมีการแก้ frontend
- [ ] Contract validator มี `Errors = 0`
- [ ] `process.md` อ้างเฉพาะหลักฐานล่าสุด

## 3. Baseline ที่ใช้เริ่มงาน

หลักฐานที่มีอยู่แล้ว:

- API build ผ่าน
- Full API tests ล่าสุด `268 passed / 0 failed / 0 skipped`
- Front tests ล่าสุด `79 passed / 0 failed / 0 skipped`
- Front และ LineLiff build ผ่าน
- API contract validator ล่าสุด `Errors = 0`, `Warnings = 142`
- Controller direct EF/data access audit ตาม scope ล่าสุด `0 matches`
- มี implementation ของ public lead, finance report/export, makeup slot UI, LIFF homework และ LIFF scores แล้วบางส่วน

ข้อจำกัดที่ต้องไม่สรุปเกินหลักฐาน:

- ยังไม่มี production DB integration evidence ใน workspace
- ยังไม่มี live OCR provider contract และ environment ที่อนุมัติ
- ยังไม่มี holiday schema/business rule ที่ครบ
- ยังไม่มี backup/restore evidence
- ยังไม่มี k6 result จาก environment จริง

## 4. ลำดับงานใหม่

### P0. Customer UI + API

ทำทีละ slice ตามลำดับนี้:

1. Trial class
2. Finance
3. Leave & Make-up Admin
4. LIFF Homework และ Make-up
5. Public Website และ CMS read flow

### P1. Staff UI + API

ทำหลัง P0 ผ่าน:

1. Holiday Calendar
2. File Manager
3. Teacher Payroll
4. Broadcast
5. Reports และ Analytics

### P2. Deferred

ไม่ทำในรอบ UI + API นี้:

- Database concurrency hardening
- Live OCR provider implementation
- Backup และ restore drill
- k6 performance run
- Offline attendance queue
- Referral rule ที่ยังไม่มี attribution contract

## 5. P0 Task Board

### P0-01 Trial Class UI + API

สถานะ: `[x]`

หลักฐานที่มี:

- Front route `/trial-class`
- API `POST /api/public/leads`
- `CreateLeadRequest` บังคับ `instituteSlug`
- API resolve active institute และมี rate limit

งาน:

- [x] ตรวจ request/response shape ระหว่าง `trial-class-page.jsx`, service และ endpoint
- [x] ตรวจ UI loading, validation, success และ error state ให้ตรง API
- [x] เพิ่ม/ตรวจ focused API tests สำหรับ valid input, invalid input และ unknown institute
- [x] เพิ่ม/ตรวจ focused Front service/UI tests สำหรับ success และ failure
- [x] ระบุ admin lead follow-up/list/status เป็น contract gap ที่ยังไม่มีหลักฐาน ไม่เพิ่ม implementation

ปิด task เมื่อ:

- [x] ฟอร์มส่ง API จริงและแสดงผลตาม response จริง
- [x] validation และ rate-limit/error response ถูกแสดงอย่างถูกต้อง
- [x] มีหลักฐาน test ของ UI/API ครบตามความเสี่ยง

หมายเหตุ: admin lead follow-up/list/status ไม่ได้อยู่ใน contract ที่ยืนยันสำหรับ slice นี้ จึงคงเป็น contract gap/deferred ไม่เพิ่ม implementation

### P0-02 Finance UI + API

สถานะ: `[/]`

หมายเหตุ: ยังปิดไม่ได้จนกว่าจะมี owner ระบุค่า `Payment.Status` ที่นับเป็นรายรับและค่า status ที่ไม่ให้นับ; ห้ามเดาจาก implementation ปัจจุบันที่รวม payment ทุก record

หลักฐานที่มี:

- `GET /api/reports/revenue`
- `GET /api/payments/export`
- หน้า Finance มี chart, history และ CSV export
- มี tenant filter และ admin authorization test

งาน:

- [ ] ตรวจ response mapping ของ chart, history, total และ export
- [ ] เพิ่ม/ตรวจ UI state ของ date range, invalid `group_by`, empty และ API error
- [ ] ยืนยัน payment status policy กับ owner ก่อนเรียกข้อมูลเป็นรายรับ
- [ ] เพิ่ม focused tests สำหรับ report query, authorization, date boundary และ CSV response
- [ ] ตรวจว่า UI ไม่สรุป payment status ที่ยังไม่ผ่าน policy

ปิด task เมื่อ:

- [ ] Finance UI ใช้ response จาก API จริงครบ flow
- [ ] status policy ถูกบันทึกและถูกใช้ตรงกันใน API/UI
- [ ] export และ authorization มี test ที่รันซ้ำได้

### P0-03 Leave & Make-up Admin UI + API

สถานะ: `[/]`

หลักฐานที่มี:

- makeup slot list/create/cancel routes
- หน้า `/admin/makeup-slots`
- API คืนเครดิตใน group cancel ตาม code evidence

งาน:

- [x] ตรวจ response shape ของ slot list, create และ cancel
- [x] ตรวจ teacher/institute ownership ของทุก mutation
- [x] เพิ่ม UI state สำหรับ loading, empty, validation, conflict, forbidden และ success
- [x] เพิ่ม focused API tests สำหรับ create, invalid capacity, forbidden และ cancel
- [x] เพิ่ม focused UI/service tests สำหรับ create และ group cancel
- [x] ตรวจ mapping ของ status/teacher label จาก response จริง ห้ามสร้าง field เอง

หลักฐานรอบนี้:

- [x] mapping ชื่อครูใช้ข้อมูลจาก `GET /api/teachers` และ status ใช้จาก `MakeupSlotResponse.status` โดยมี fallback เฉพาะเมื่อ response ไม่มีค่า
- [x] mutation routes จำกัด role เป็น `admin` หรือ `teacher`; tenant boundary ของ teacher/slot ใช้ global query filter ของ `TutoringDbContext`
- [x] focused API tests ครอบคลุม valid create, invalid capacity, unknown teacher, unknown tenant slot, group cancel delegation และ role forbidden
- [x] focused Front tests ครอบคลุม response mapping, validation, create และ group cancel

ปิด task เมื่อ:

- [ ] ครูเปิดและยกเลิก slot ผ่าน UI/API flow เดียวกันได้
- [ ] error และ conflict response แสดงผลถูกต้อง
- [ ] tenant/ownership และ mutation tests ผ่าน

หมายเหตุ: code/test evidence ผ่านตามรายการข้างต้น แต่ยังไม่ปิด task เพราะยังไม่มี production DB runtime evidence และยังไม่มี concurrency integration evidence สำหรับ capacity/group-cancel transaction

### P0-04 LIFF Homework + Make-up UI + API

สถานะ: `[/]`

หลักฐานที่มี:

- `/liff/homework/:childId`
- `/liff/leave-makeup/:childId`
- parent-owned homework submission endpoint
- parent/makeup service และ ownership checks บางส่วน

งาน:

 - [x] ตรวจ list/detail response ของ homework และ make-up slot
 - [x] ตรวจ submission creation, upload, booking และ cancel response ตาม endpoint จริง
 - [x] ตรวจ parent-child ownership และ enrollment boundary ทุก mutation
 - [x] เพิ่ม UI state สำหรับ loading, empty, file validation, upload error, booking conflict และ success
 - [/] เพิ่ม focused service/component tests ตาม flow ที่มีอยู่
 - [x] ตรวจ responsive behavior บนหน้าที่ customer ใช้งานจริง

 หลักฐานรอบนี้:

 - [x] `GET /api/parents/children/{childId}/homework` คืนรายการจาก enrollment ของ child; submission creation ตรวจ parent ownership และ enrollment; upload ตรวจ parent ownership ของ submission และ tenant
 - [x] `GET /api/makeup/credits`, `GET /api/makeup/bookings`, `GET /api/makeup/slots`, booking และ cancel ใช้ response/endpoint จริง; parent ownership ถูกตรวจใน `MakeupService`
 - [x] LIFF ตรวจ homework image และ leave attachment type/size ก่อนยิง upload, แสดง 403/409, และปิดการจอง slot ที่เต็มหรือไม่ใช่ `open`
 - [x] LineLiff build ผ่าน; focused API filter `FileUploadServiceTests|ParentServiceTests|MakeupServiceTests` ผ่าน `25 passed / 0 failed`
 - [/] ยังไม่มี LIFF component/service test runner ใน package ปัจจุบัน และยังไม่มี production DB/runtime evidence

ปิด task เมื่อ:

- [ ] ผู้ปกครองดูข้อมูลและทำ mutation ผ่าน API จริงได้ครบ flow ใน scope
- [ ] ไม่สามารถส่งงานหรือจองข้อมูลของ child อื่นได้
- [ ] upload/booking error และ success state มีหลักฐาน test

### P0-05 Public Website + CMS Read Flow

สถานะ: `[/]`

หลักฐานที่มี:

- Front route `/` ไป `IndexPage`
- CMS SSG preview `/p/oasis-learning`
- CMS routes `/content`, `/leads`, `/settings`
- CMS build ผ่านตามหลักฐานล่าสุด

งาน:

- [x] ตรวจ route/render evidence ของ public home และ preview
- [x] ตรวจ content sections ที่ Objective ระบุ โดยไม่เติมเนื้อหาที่ไม่มี source
- [x] ระบุ content read API, CRUD, media และ auth/RBAC เป็น contract gap หากยังไม่พบ
- [x] ทำ trial lead integration ให้เชื่อมกับ P0-01 โดยไม่ทำ duplicate implementation
- [x] เพิ่ม responsive/render test ที่ทำได้จาก source

 หลักฐานรอบนี้:

 - [x] Front route `/` render `IndexPage`; primary public CTA และ header CTA ไป `/trial-class`, sign-in ไป `/login`
 - [x] CMS SSG route `/p/oasis-learning` prerender ผ่าน และมี sections ตาม Objective: stories, teachers, courses/pricing และ contact พร้อม metadata
 - [x] CMS `/content` ใช้ `defaultSections` เป็น local draft source เท่านั้น; malformed localStorage data ถูกละทิ้งอย่างปลอดภัย
 - [x] CMS overview ไม่แสดง hardcoded metrics/activity เป็นข้อมูลจริงอีกต่อไป และระบุ read API boundary ชัดเจน
 - [x] Trial flow ใช้ `POST /api/public/leads` ผ่าน shared contract เดิม ไม่สร้าง duplicate endpoint; `instituteSlug` มาจาก `publicInstitute.slug` ใน CMS และ Front form รองรับ field เดียวกัน
 - [x] เพิ่ม Front render test สำหรับ public CTA/sign-in routing; focused public/lead tests `5 passed / 0 failed`; Front full suite `87 passed / 0 failed`
 - [x] Front build และ CMS build ผ่าน; CMS `/p/oasis-learning` เป็น SSG output
 - [/] ยังไม่มี content read API/CRUD, CMS authentication/RBAC, media storage, lead list/status API หรือ production integration evidence

ปิด task เมื่อ:

- [ ] public route และ CMS preview render ได้ครบตาม scope
- [ ] ทุกข้อมูล dynamic มี API contract หรือถูกระบุชัดว่าเป็น static preview
- [ ] ไม่มี mock content ที่ถูกนำเสนอเป็นข้อมูลจริง

## 6. P1 Task Board

### P1-01 Operations UI + API

สถานะเริ่มต้น: `[ ]`

รวม Holiday Calendar, File Manager, Teacher Payroll และ Broadcast แต่ละรายการเริ่มได้เมื่อมี contract ของ endpoint, role, schema และ state ที่ตรวจได้

งานร่วม:

- [ ] ยืนยัน requirement และ role ที่อนุญาต
- [ ] ยืนยัน endpoint/DTO/response และ tenant boundary
- [ ] ทำ UI state ครบตามความเสี่ยง
- [ ] เพิ่ม API/service/UI tests ก่อนเชื่อม production

ห้ามปิด task จาก provisional UI หรือ local draft state เพียงอย่างเดียว

### P1-02 Reports + Analytics UI + API

สถานะ: `[/]` มีเฉพาะ revenue report และ Finance flow ที่เชื่อม API จริง

หลักฐานรอบ discovery:

- `GET /api/reports/revenue` รับ `from`, `to` และ `group_by=day|month|year`; จำกัด role เป็น `admin` และคืน `period`, `grossAmount`, `paymentCount`
- Revenue service ใช้ payment query ที่มี tenant filter และมี focused grouping test; มี authorization test ที่ยืนยัน `teacher` ได้ `403`
- Front Finance เชื่อม revenue report และ payment CSV export จริง พร้อม loading, empty และ error state
- Analytics ใน CMS ยังเป็น definition-gate state และไม่แสดงตัวเลขปลอม

ช่องว่างที่ยืนยันแล้ว:

- `Payment.Status` ยังไม่มี policy ว่า status ใดนับเป็นรายรับ จึงยังรับรองยอด revenue ไม่ได้
- ยังไม่มีสูตรที่ owner ยืนยันสำหรับ Renewal Rate, Churn Risk และ Revenue Forecast รวมถึง date window, timezone, missing-data และ privacy rule
- Revenue report ปัจจุบันเป็น historical aggregation ไม่ใช่ forecast
- ยังไม่มี Teacher Timesheet API/service/DTO/export contract; ยังต้องเลือก source ระหว่าง `sessions` และ `attendances`
- ยังไม่มี focused tests สำหรับ analytics formula, empty result, privacy, forecast และ timesheet export

งาน:

- [ ] ยืนยันสูตร Renewal Rate, Churn Risk และ Revenue Forecast
- [ ] ยืนยัน source tables, date window, timezone และ privacy rule
- [ ] ยืนยัน Teacher Timesheet source และ export format
- [ ] เพิ่ม API จากข้อมูลจริงหลังสูตรผ่าน
- [ ] เชื่อม UI chart/table/export กับ response จริง
- [ ] เพิ่ม tests สูตร, authorization, tenant isolation, empty และ export

ห้ามแสดงตัวเลข analytics ที่ไม่มี source หรือสูตรที่ owner ยืนยัน

## 7. วิธีทำงานต่อ Slice

ทุก slice ใช้ลำดับเดียวกัน:

1. Audit UI/API: อ่าน route, component, service, endpoint, DTO และ test
2. Contract map: เขียน request, response, error, role และ ownership ที่พบ
3. Gap list: แยก `ui gap`, `api gap`, `contract gap` และ `test gap`
4. Implement API boundary ก่อนเมื่อ response/authorization ยังไม่ชัด
5. เชื่อม UI กับ API จริงและเพิ่มทุก state ที่จำเป็น
6. รัน focused tests
7. รัน build ที่เกี่ยวข้อง
8. ตรวจ contract validator เมื่อมี endpoint/contract change
9. อัปเดต `process.md` ด้วยหลักฐานที่รันหรืออ่านซ้ำได้

## 8. Next Action

P0-01 ผ่านแล้ว; `P0-02 Finance UI + API` ยังติด owner payment-status policy และ `P0-03 Leave & Make-up Admin UI + API` ยังรอ production/runtime และ concurrency evidence. ห้ามเริ่มงาน P1 หรือ deferred จนกว่า P0 ทั้งหมดจะผ่าน Definition of Done.
