# แผนปฏิบัติงานปัจจุบัน (Task Plan)

> วันที่ปรับแผน: 12 กันยายน 2026
> หลักฐานอ้างอิง: `Front/docAPI/api-target.json`, API build output และ `Objective/process.md`

## สถานะที่ทำเสร็จแล้ว

- [x] แยก Current API baseline ออกจาก Target API contract
- [x] สร้างและปิดช่องว่าง Target API สำหรับ attendance checkout, pickup authorization, makeup, no-show, payment, public lead, reports และ broadcast
- [x] แยก Makeup เป็น `Controller -> Service -> Repository`
- [x] แยก Student pickup authorization เป็น `Controller -> Service -> Repository`
- [x] ย้าย attendance checkout business logic เข้า `AttendanceService` และ `AttendanceRepository`
- [x] ย้าย request/response contracts ของ slice ใหม่ไปไว้ใน `API/DTOs`
- [x] API build ผ่านด้วย output แยก `API/bin/RefactorValidation`
- [x] ปรับ target spec ให้ใช้ `int64` กับ ID ที่ model จริงเป็น `long`
- [x] ตรวจ diagnostics ของไฟล์ที่ refactor แล้วไม่พบ error

## P0: งานถัดไปที่ต้องทำก่อนขยาย feature

### 1. เขียน tests ให้ slice ที่เพิ่ง refactor

- [x] Makeup booking ใช้ credit ของ student คนเดียวกันเท่านั้น
- [/] Credit หมดอายุหรือไม่ available ต้องจองไม่ได้ (มี test ฝั่ง unavailable; ยังขาดเคสหมดอายุโดยตรง)
- [x] Slot เต็มต้องคืน `409` และห้ามเพิ่ม `booked_count`
- [x] Cancel booking คืน credit และลด `booked_count` ใน transaction เดียวกัน
- [x] Cancel slot คืน credit ให้ booking ที่ยัง reserved ทุกคน
- [x] No-show เปลี่ยน booking เป็น `no_show` และ consume credit โดยไม่คืนกลับ
- [x] Pickup authorization ที่ถูก revoke ใช้ checkout ไม่ได้
- [x] Checkout ซ้ำไม่ได้ และ checkout ก่อน check-in ไม่ได้

### 2. ปิด Leave Request ให้ครบตาม Target API

- [x] ปรับ `CreateLeaveRequestRequest` และ response ให้ตรง contract ใหม่
- [x] ให้ backend คำนวณประเภทการลาเองจากเวลายื่นกับเวลาเริ่ม session
- [/] เพิ่ม upload attachment และตรวจชนิด/ขนาดไฟล์ (ยังติด schema ไม่มี `attachment_url` หรือ attachment table)
- [x] Approve leave ต้องสร้าง `makeup_credit` ใน transaction เดียวกัน
- [x] ป้องกัน approve/reject ซ้ำด้วย state transition และ `409`
- [x] ผูก reference ใน credit ledger กับ leave request
- [x] เพิ่ม tests สำหรับ create/type rule, pending -> approved/rejected และการสร้าง credit ซ้ำ

### 3. ทำ Current API กับ Target API ให้ตรวจได้อัตโนมัติ

- [x] เพิ่ม script ตรวจ route/type ของ `api-target.json` เทียบกับ current Swagger snapshot (`Objective/validate-api-contract.ps1`)
- [/] ใช้ `x-implementation-status=implemented|partial|new` ให้ครบทุก target operation (target ใหม่/partial มี metadata; current baseline ที่ยังไม่มี metadata ถูก infer เป็น `implemented`)
- [ ] ห้ามติดสถานะ `implemented` หากยังไม่มี controller/service จริง
- [x] ตรวจ `$ref`, operationId, security และ role ทุกครั้งก่อน merge (security/role ที่ขาดถูกแจ้งเป็น warning)

## P1: ปิด workflow ที่ผู้ใช้เห็นจริง

### 4. Parent LIFF Leave & Make-up

- [/] หน้าสร้าง leave request เลือก session และ reason ได้แล้ว; แนบหลักฐานยังรอ schema attachment
- [x] หน้าแสดง leave status และ makeup credit ของลูก
- [x] หน้าแสดง slot ที่ว่างและจองด้วย credit ของลูก
- [/] หน้ายืนยัน booking ทำแล้ว; ยกเลิก booking รอ parent-scoped booking list/ownership contract
- [x] แสดง error เมื่อ slot เต็ม, credit หมดอายุ หรือ booking ซ้ำ

### 5. Admin Attendance/Pickup

- [x] เพิ่ม UI checkout พร้อมเลือก authorized pickup
- [x] แสดงเฉพาะ authorization ที่ active และเป็นของ student คนปัจจุบัน
- [/] แสดง audit detail ว่าใคร checkout เมื่อใดและใครเป็นผู้รับ (หน้าแสดงเวลาจาก server และผู้รับแล้ว; audit log ถาวรยังรอ notification/audit workflow)

### 6. ปรับ test infrastructure ที่ล้มอยู่เดิม

- [ ] แยก test failures ที่เกิดจาก EF global tenant filter/fixture setup
- [ ] แก้ test ที่ใช้ relational-only SQL บน InMemory หรือเปลี่ยน fixture เป็น relational provider
- [ ] แก้ seed/tenant setup ของ Student, Course และ Payment repository tests
- [ ] รัน full test suite ใหม่หลังแยก baseline failures ออกจาก feature tests

## P2: งาน SRS หลัง core workflow เสถียร

- [ ] สร้าง PDF receipt จริง
- [ ] สร้าง student card PDF
- [ ] เพิ่ม CSV/XLSX export นักเรียนและการเงิน
- [ ] เพิ่ม payment slip verification
- [ ] เพิ่ม revenue report และ teacher timesheet
- [ ] เพิ่ม notification log และ background jobs
- [ ] เพิ่ม quota-low notification เมื่อเหลือไม่เกิน 3 ครั้ง
- [ ] เพิ่ม admin inactivity timeout 30 นาที
- [ ] เพิ่ม CI build/test และ k6 load test สำหรับ attendance

## Definition of Done ของรอบถัดไป

- [ ] Contract ใน `api-target.json` ตรงกับ DTO และ route ที่ implement จริง
- [ ] Controller ไม่มี EF query หรือ business transaction โดยตรง
- [ ] Service คุม business rule และ state transition
- [ ] Repository คุม query/persistence/transaction ตาม ownership ที่ชัดเจน
- [ ] มี unit/integration tests สำหรับ success, validation, conflict และ authorization
- [ ] API build ผ่าน
- [ ] Test result ถูกแยกเป็น pass, feature failure และ pre-existing failure อย่างตรวจสอบได้
- [ ] เอกสาร `Objective/process.md` อัปเดตจากหลักฐานจริงหลังจบรอบ

## ลำดับลงมือถัดไป

1. เขียน tests สำหรับ Makeup, Pickup และ Checkout
2. Implement Leave Request service/repository/controller ให้ตรง target contract
3. รัน tests เฉพาะ Leave & Make-up และแก้จนผ่าน
4. เชื่อม Parent LIFF กับ leave/credit/slot/booking
5. อัปเดต implementation status ใน target spec และ process report
