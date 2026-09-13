# Task Plan: QR Attendance

> แผนงานสำหรับหมวดที่ 3: ระบบเช็คชื่อ หักโควต้า และแจ้งเตือน
> วันที่จัดแผน: 13 กันยายน 2026
> แหล่งอ้างอิง: `Objective/ProjectObj.md` หมวด Attendance, `Objective/process.md` หมวดที่ 3, `Objective/specAPI.md` หัวข้อ Attendance, `Objective/sql_script.md` และ `Objective/erProjec.md`
> สถานะรวม: `[/]` มี backend transaction, manual attendance, checkout, late worker และ notification flow แล้ว แต่ยังขาด scanner mode ที่ครบ, runtime evidence และ offline queue/sync

## 1. เป้าหมายการส่งมอบ

ให้ครูสามารถเปิดกล้องมือถือ สแกน QR เพื่อเช็คเข้า/ออกได้ภายใน 3 ขั้นตอน พร้อมบันทึก attendance, หักโควต้าคอร์สอย่างถูกต้อง, ป้องกันการสแกนซ้ำ, ตรวจผู้รับเด็ก, แจ้งผู้ปกครองผ่าน LINE และรองรับการทำงานต่อเมื่ออินเทอร์เน็ตขัดข้องโดยไม่สร้างข้อมูลซ้ำหรือหักโควต้าซ้ำ

Definition of Done ของหมวดนี้ต้องมีทั้ง:

- code และ API contract ที่ตรงกับ SRS
- focused/unit/integration tests ของ success และ failure path
- Front และ API build ผ่าน
- runtime evidence ของ worker, LINE provider, database transaction และ offline sync ใน environment ที่ระบุ
- performance evidence ของ scan endpoint ตาม NFR-P-02

## 2. Acceptance Criteria ที่ต้องปิด

| AC | Requirement | หลักฐานปัจจุบัน | งานที่เหลือ |
|---|---|---|---|
| AC-1 | เปิดกล้องสแกน QR สำหรับ check-in และ check-out | `attendance-page.jsx` มี `jsQR` และ checkout modal แต่ยังไม่เป็น scanner mode เดียวที่ครบ | ทำ mode switch, camera lifecycle, scan confirmation และ checkout จาก QR |
| AC-2 | Manual attendance: present/late/leave/absent | มี UI และ API แล้ว | ตรวจ contract, permission, duplicate/edit rule และเพิ่ม runtime evidence |
| AC-3 | หักโควต้าเมื่อเช็คชื่อสำเร็จ | `ScanCheckinWithTransactionAsync` และ manual conditional deduction มีแล้ว | พิสูจน์ atomicity, no-negative quota, idempotency และ database integration |
| AC-4 | บันทึกผู้รับเด็กตอน checkout | API/UI, pickup authorization และ audit log มีแล้ว | ทดสอบสิทธิ์/อายุ authorization, snapshot และ cross-tenant denial |
| AC-5 | แจ้งเตือนเมื่อเกิน 20 นาทีแล้วยังไม่เช็คชื่อ | `LateAttendanceNotificationJob` มีแล้ว | รัน hosted worker กับ clock/database จริง, กันส่งซ้ำและตรวจวันหยุด/ยกเลิก |
| AC-6 | Push LINE หลัง check-in/check-out | dispatcher/logging และ notification factory มีแล้ว | ยืนยัน provider runtime, retry/failure/idempotency และ checkout notification |
| AC-7 | Offline queue และ sync เมื่อกลับมา online | ยังไม่มี Service Worker/IndexedDB sync | ออกแบบ queue, signed payload/expiry, replay protection และ conflict UI |

## 3. กติกาที่ห้ามเปลี่ยนโดยเดา

1. `institute_id` ต้องมาจาก authenticated context เท่านั้น ห้ามรับจาก request body/query เพื่อเลือก tenant
2. QR token ต้องตรวจ signature/expiry และนักเรียนต้องอยู่ใน institute เดียวกับผู้เรียก API
3. attendance หนึ่งรายการต่อ `(session_id, student_id)` เท่านั้น ตาม `uq_attendance_session_student`
4. check-in ที่เป็น `present` หรือ `late` หัก `enrollments.sessions_remaining` ใน transaction เดียวกับการสร้าง attendance; `leave` และ `absent` ไม่หัก
5. โควต้าต้องไม่ติดลบ หากไม่มีโควต้าให้คืน business error และไม่สร้าง attendance สำเร็จบางส่วน
6. checkout ต้องอ้าง pickup authorization ที่ active และอยู่ในช่วงวันที่อนุญาต ถ้าเลือก authorization; `picked_up_by` ต้องเก็บ snapshot สำหรับประวัติ
7. notification ต้อง dispatch หลัง persistence commit และต้องไม่ทำให้ transaction attendance ล้มเหลวเมื่อ provider ขัดข้อง
8. offline event ต้องมี client event ID/idempotency key, timestamp, actor/session/student binding และหมดอายุได้; server ต้องเป็นผู้ตัดสินเวลาจริงและ quota
9. ทุก timestamp ที่ส่งผ่าน API ใช้ ISO 8601 UTC; UI แปลงเป็น timezone ของ institute
10. ห้ามประกาศ AC ผ่านจาก schema, build หรือ unit test เพียงอย่างเดียว ต้องระบุ runtime gap แยกชัดเจน

## 4. Contract ที่ต้องยึดเป็น baseline

### Existing endpoints

- `POST /api/attendance/scan`: QR check-in, atomic attendance + quota deduction
- `POST /api/attendance/manual`: manual status และ conditional deduction
- `GET /api/attendance/daily`: รายชื่อประจำวันแบบ tenant-scoped
- `POST /api/attendance/{attendanceId}/checkout`: บันทึก checkout, `pickedUpBy`, `pickupAuthorizationId`
- `GET /api/students/{studentId}/pickup-authorizations`: รายชื่อผู้รับเด็กที่ active

### Contract ที่ต้องตรวจ/เติมก่อน implementation

- error code ที่คงที่: `INVALID_QR`, `DUPLICATE_SCAN`, `NO_QUOTA`, `SESSION_NOT_FOUND`, `FORBIDDEN`, `PICKUP_NOT_AUTHORIZED`, `ALREADY_CHECKED_OUT`
- รูปแบบ success/error envelope ให้ตรง `specAPI.md`
- scan request รองรับ `Idempotency-Key` หรือ field ที่เทียบเท่าสำหรับ offline replay โดยไม่สร้าง endpoint ซ้ำซ้อน
- response ต้องคืน `attendanceId`, `studentId`, `sessionId`, `status`, `checkinAt`, `checkoutAt`, `sessionsRemaining` และ notification status ที่ไม่เปิดเผย secret
- ระบุว่า manual record แก้ไขได้หรือไม่ ใครแก้ได้ และการแก้ quota ย้อนหลังทำอย่างไร
- ระบุ late threshold, institute timezone, holiday/cancelled-session suppression และ retry window ของ late worker

## 5. Dependency และลำดับทำงาน

`P0 Contract & Data Audit` → `P1 Attendance Transaction Hardening` → `P2 Scanner UX` → `P3 Worker & Notification Runtime` → `P4 Offline Queue/Sync` → `P5 Performance/Security` → `P6 E2E Acceptance`

ห้ามเริ่ม P4 ก่อน P0 ระบุ idempotency, conflict และ clock policy ครบ เพราะ offline sync ที่ไม่มี policy จะเสี่ยงหักโควต้าซ้ำและสร้าง attendance ย้อนหลังผิดคาบ

## 6. Task Board

### P0-01 Contract, schema และ decision record

สถานะ: `[ ]` blocker สำหรับงาน offline และ runtime acceptance

งาน:

- [ ] inventory endpoint/service/repository/UI/worker ที่เกี่ยวข้องกับ attendance และบันทึก path จริง
- [ ] ยืนยัน DTO/request/response/error code ของ scan, manual, daily และ checkout ให้ตรง `specAPI.md`
- [ ] ยืนยันสถานะ attendance ที่อนุญาตและ mapping กับ quota (`present`, `late`, `leave`, `absent`, `pending`)
- [ ] ยืนยัน no-quota behavior, duplicate behavior และกฎการแก้ attendance หลังบันทึก
- [ ] ยืนยัน QR expiry, server clock, institute timezone และ session eligibility
- [ ] ยืนยัน pickup authorization rule: active, valid date, tenant, student ownership และ free-text fallback
- [ ] ยืนยัน late worker window 20 นาที, วันหยุด, cancelled session, absent/leave exclusion และ notification repeat policy
- [ ] เลือก offline storage: IndexedDB เป็น source queue; Service Worker/online event เป็น trigger ไม่ใช่ authority
- [ ] กำหนด offline payload, max age, retry/backoff, conflict response, device logout cleanup และ replay protection
- [ ] บันทึก decision record ใน `Objective/taskPlan.md` หรือเอกสารอ้างอิงที่ owner ใช้ยืนยันได้

ปิด task เมื่อ:

- [ ] มี contract map ครบทุก endpoint และ event
- [ ] มี sequence diagram/checklist ของ online และ offline flow
- [ ] owner ยืนยันกฎที่กระทบ quota, time และ notification แล้ว

### P1-01 Attendance transaction และ authorization hardening

สถานะ: `[/]` มี implementation หลักแล้ว ต้องปิด boundary และ integration evidence

งาน:

- [ ] ตรวจ scan transaction ให้สร้าง attendance, deduct quota และเขียน audit อย่าง atomic
- [ ] ป้องกัน quota ติดลบด้วย conditional update/row lock ที่เหมาะกับ TiDB/MySQL
- [ ] รองรับ duplicate concurrent scan ให้คืนผล deterministic โดยไม่หักซ้ำ
- [ ] ตรวจ session/student/enrollment/course/institute ownership ทุกจุด
- [ ] ตรวจ manual attendance ว่าไม่ bypass session eligibility, tenant หรือ role
- [ ] กำหนดและทดสอบการเปลี่ยนสถานะจาก pending เป็น present/late/leave/absent
- [ ] ตรวจ checkout ว่าเช็ค attendance มีอยู่, ยังไม่ checkout, อยู่ใน session ที่ถูกต้อง และ actor มีสิทธิ์
- [ ] ตรวจ pickup authorization และบันทึก `picked_up_by` เป็น snapshot พร้อม `pickup_authorization_id`
- [ ] เพิ่ม audit event สำหรับ scan/manual/checkout และการแก้ไข attendance สำคัญ
- [ ] เพิ่ม relational tests สำหรับ duplicate, no quota, cross-tenant, cross-student pickup และ transaction rollback
- [ ] รัน schema verification จาก `Objective/sql_script.md` ก่อน/หลัง migration ใดๆ ห้าม apply SQL ซ้ำจากเอกสารเก่า

ปิด task เมื่อ:

- [ ] transaction tests ผ่านบน database จริงหรือ test container ที่ระบุ
- [ ] concurrent duplicate scan ไม่ทำให้ quota ลดเกินหนึ่งครั้ง
- [ ] role, tenant และ pickup ownership มีหลักฐานทั้ง allow และ deny

### P2-01 Teacher Scanner UX: check-in/check-out

สถานะ: `[/]` มีหน้า attendance และ camera reader บางส่วน

งาน:

- [ ] เพิ่ม mode ชัดเจน `Check-in` / `Check-out` ในหน้า `Front/src/pages/admin/attendance-page.jsx`
- [ ] จัดการ camera permission, camera unavailable, HTTPS requirement และ stop/restart stream เมื่อเปลี่ยน mode
- [ ] จำกัด flow ไม่เกิน 3 ขั้นตอน: เปิด → สแกน → ยืนยัน
- [ ] หลัง scan แสดง student/session/สถานะ/โควต้าคงเหลือ และปุ่มยืนยันที่ป้องกัน double submit
- [ ] check-in mode เรียก scan endpoint เดิมและแสดง success, duplicate, invalid/expired QR, no quota และ network error
- [ ] check-out mode เรียก checkout flow จาก attendance ที่ตรงกับ session และแสดงรายชื่อ pickup authorization ที่ active
- [ ] รองรับ manual tab สำหรับ present/late/leave/absent โดยไม่ทำให้ scanner state ค้าง
- [ ] disable ปุ่มระหว่าง request และ reset scanner หลัง success หรือ explicit cancel
- [ ] เพิ่ม responsive/accessibility states: focus, keyboard fallback, readable error, offline indicator และ retry
- [ ] เพิ่ม Front service/component tests สำหรับ mode switch, camera error, response mapping, duplicate click และ checkout validation
- [ ] ทดสอบมือถือจริงอย่างน้อย Android Chrome และ iOS Safari ใน environment ที่ระบุ

ปิด task เมื่อ:

- [ ] ครูทำ check-in และ checkout ได้จริงจาก QR โดยไม่ต้องสลับหน้า
- [ ] ทุก error code จาก API มีข้อความและ recovery path ที่ถูกต้อง
- [ ] ไม่มีการยิง mutation ซ้ำจากการกดซ้ำหรือการสแกน QR เดิมติดกัน

### P3-01 Late attendance worker

สถานะ: `[/]` มี `LateAttendanceNotificationJob` แต่ยังขาด runtime evidence

งาน:

- [ ] ตรวจ query หา enrolled students ที่ยังไม่มี attendance หลัง session start + 20 นาที
- [ ] exclude session ที่ cancelled, holiday, completed ตาม policy ที่ยืนยัน
- [ ] exclude student ที่มี `leave` หรือ attendance ที่ไม่ควรเตือนตาม business rule
- [ ] กำหนด idempotency key สำหรับ late notification ต่อ `session/student/notification window`
- [ ] ตรวจ dispatcher ให้ pending/sent/retrying/failed ถูกบันทึก และ retry ไม่ส่งซ้ำเกิน policy
- [ ] เพิ่ม structured log, metric และ correlation ID ให้ trace session/student/notification โดยไม่ log PII เกินจำเป็น
- [ ] เพิ่ม worker tests: boundary ก่อน/ตรง/หลัง 20 นาที, timezone, duplicate run, provider failure และ cancellation
- [ ] รัน hosted worker กับ database จริงหรือ staging และเก็บ evidence ว่ามีการสร้าง/ส่ง notification

ปิด task เมื่อ:

- [ ] worker แจ้งเฉพาะผู้ที่ยังไม่เช็คชื่อหลังครบ 20 นาที
- [ ] rerun worker แล้วไม่สร้างหรือส่ง late notification ซ้ำตาม idempotency policy
- [ ] มี runtime log/result และ known limitation ใน `Objective/process.md`

### P3-02 Check-in/check-out LINE notification

สถานะ: `[/]` มี background dispatcher และ attendance message factory แล้ว

งาน:

- [ ] ตรวจ notification event แยก check-in และ checkout รวมถึงข้อมูลเวลา/สถานะที่ส่ง
- [ ] ยืนยัน parent recipient resolution และกรณีไม่มี LINE binding ว่าบันทึกเป็น skipped/failed อย่างไร
- [ ] ตรวจ notification dispatch หลัง commit เท่านั้น และ request cancellation ไม่ตัด audit/log
- [ ] เพิ่ม/ตรวจ idempotency key ของ check-in, checkout และ offline replay
- [ ] เพิ่ม tests สำหรับ success, no recipient, provider timeout, retry, permanent failure และ duplicate event
- [ ] ทดสอบกับ LINE provider credential ใน staging โดยไม่ใส่ secret ใน source/client
- [ ] ตรวจ database `notifications` และ audit record หลัง provider success/failure
- [ ] แก้ race ของ idempotency ใน multi-instance หาก acceptance ต้องรองรับ concurrent API instances; ห้ามถือ application-level check เป็น database guarantee

ปิด task เมื่อ:

- [ ] check-in และ checkout สำเร็จแล้วมี notification record ที่ trace กลับ attendance ได้
- [ ] provider failure ไม่ rollback attendance และมี retry/failure status ที่ตรวจสอบได้
- [ ] runtime evidence ระบุ provider, environment, เวลา และผลทดสอบโดยไม่เปิด credential

### P4-01 Offline queue และ sync

สถานะ: `[ ]` ยังไม่มี implementation

งาน:

- [ ] สร้าง IndexedDB schema สำหรับ `pending_attendance_events`, queue metadata, status และ last error
- [ ] เก็บเฉพาะข้อมูลที่จำเป็นต่อการ sync; ห้ามเก็บ JWT/LINE secret หรือ QR token ที่หมดอายุเกิน policy
- [ ] สร้าง client event ID/UUID และ idempotency key ต่อ mutation พร้อมผูกกับ user/device/session/student
- [ ] แสดง offline banner, queue count, pending/synced/failed state และ retry/discard action ที่ปลอดภัย
- [ ] queue เฉพาะ event ที่อนุญาตตาม policy; ต้องแยก scan/check-in ออกจาก checkout ที่อาจหมดสิทธิ์ตามเวลา
- [ ] เพิ่ม sync เมื่อ online, app resume และ manual retry โดยมี exponential backoff และไม่ยิงพร้อมกันซ้ำ
- [ ] ให้ server validate QR/session/actor/quota ใหม่ทุกครั้ง ไม่ trust client timestamp หรือ cached quota
- [ ] กำหนดผล conflict: duplicate = replay success/linked record, expired session = rejected, quota changed = rejected/manual review
- [ ] ถ้า server contract ต้องเพิ่ม idempotency field/header ให้ update `specAPI.md`, validator และ API tests
- [ ] เพิ่ม IndexedDB/service tests สำหรับ offline create, reload recovery, ordering, retry, conflict, logout cleanup และ storage full
- [ ] ทดสอบ network transition จริง: online → offline → queue → online → sync และ kill/reopen browser
- [ ] พิจารณา retention/cleanup ของ queue และแจ้งครูเมื่อมี failed event ค้าง

ปิด task เมื่อ:

- [ ] offline event ถูกส่งกลับได้โดยไม่สร้าง duplicate attendance หรือหัก quota ซ้ำ
- [ ] conflict และ failed sync แสดงผลให้ครูแก้ไขได้ ไม่เงียบหาย
- [ ] มี evidence บนอุปกรณ์/เบราว์เซอร์ที่รองรับจริง และระบุ unsupported browser

### P5-01 Performance, security และ observability

สถานะ: `[/]` มี performance target และอ้างถึง load script แต่ยังไม่มี runtime result

งาน:

- [ ] ตรวจ QR scan endpoint ให้ p95 ไม่เกิน 2 วินาทีตาม NFR-P-02 ใน environment ที่อนุมัติ
- [ ] รัน `load-tests/attendance.js` จำลอง 100 concurrent users และบันทึก p50/p95/p99/error rate
- [ ] ตรวจ query/index ของ `attendances(session_id, student_id)`, tenant filter และ enrollment deduction
- [ ] ทดสอบ concurrent scan ของนักเรียนเดียวกันและนักเรียนหลายคนใน session เดียว
- [ ] ตรวจ QR token expiry/replay, authorization bypass, cross-tenant data access และ sensitive log exposure
- [ ] เพิ่ม correlation ID ระหว่าง API, database transaction, notification และ offline sync
- [ ] ตรวจ alert สำหรับ worker failure, notification backlog, failed sync และ quota transaction error
- [ ] สรุปผล performance/security gap โดยไม่ประกาศผ่านหากวัดจาก local machine เท่านั้น

ปิด task เมื่อ:

- [ ] ผล load test ผ่าน threshold ที่ owner อนุมัติ พร้อม environment/test data ชัดเจน
- [ ] security negative tests ผ่านสำหรับ token replay, role และ tenant boundary
- [ ] มี dashboard/log query หรือ runbook สำหรับ incident สำคัญ

### P6-01 End-to-end acceptance และ rollout

สถานะ: `[ ]`

งาน:

- [ ] เตรียม test data อย่างน้อย 2 institutes, 2 roles, 2 sessions, students ที่มี/ไม่มี quota และ parents ที่มี/ไม่มี LINE
- [ ] ทดสอบ QR check-in สำเร็จ, duplicate, expired QR, wrong institute และ no quota
- [ ] ทดสอบ manual present/late/leave/absent และตรวจ quota ตาม mapping
- [ ] ทดสอบ checkout ด้วย authorized pickup, expired/revoked pickup, wrong student และ checkout ซ้ำ
- [ ] ทดสอบ late worker ที่เวลา 19:59, 20:00 และ 20:01 พร้อม rerun job
- [ ] ทดสอบ LINE check-in/checkout success, no recipient, retry และ provider outage
- [ ] ทดสอบ offline queue, browser reload, reconnect, replay, conflict และ failed retry
- [ ] รัน API tests, Front tests, LineLiff tests ที่เกี่ยวข้อง และ builds
- [ ] รัน contract validator ให้ `Errors = 0` หลังมี API change
- [ ] ตรวจ schema/constraint จริงด้วย SQL verification และบันทึกผล
- [ ] บันทึก runtime environment, versions, test data, result, screenshots/log references และ known limitations ใน `Objective/process.md`
- [ ] จัดทำ rollback plan สำหรับ frontend, API contract, worker และ database change ก่อนเปิดใช้งานจริง

ปิด task เมื่อ:

- [ ] AC-1 ถึง AC-7 มี evidence ครบ หรือมี deferred decision ที่ owner อนุมัติเป็นลายลักษณ์อักษร
- [ ] ไม่มี mock, local-only state หรือ unit-only evidence ถูกนับเป็น production acceptance
- [ ] มี rollout/rollback owner และ monitoring หลัง deploy

## 7. Test Matrix ขั้นต่ำ

| Area | Success | Failure/edge | Evidence |
|---|---|---|---|
| QR scan | valid token, correct session, quota deducted once | expired, invalid, duplicate, no quota, cross-tenant | API integration + DB state |
| Manual | all four statuses and correct quota mapping | invalid status, unauthorized teacher, duplicate record | service/API tests |
| Checkout | authorized pickup and audit snapshot | revoked/expired/wrong student/already checked out | API integration + audit query |
| Late worker | exactly after 20 minutes | before threshold, cancelled/holiday, rerun | worker test + staging log |
| LINE | check-in/checkout delivered and logged | no recipient, timeout, retry, duplicate | provider sandbox/staging evidence |
| Offline | queue, reload, reconnect, idempotent replay | conflict, expired session, storage full, logout | browser/device run |
| Performance | 100 concurrent users under threshold | database contention and duplicate concurrency | k6 result/artifact |

## 8. Definition of Done ต่อ Slice

- [ ] ระบุไฟล์, route, endpoint, worker และ schema ที่เปลี่ยน
- [ ] request/response/error/role/tenant/ownership contract อ้างอิงได้
- [ ] UI มี loading, empty, validation, error, success และ offline state ตามความเหมาะสม
- [ ] transaction และ idempotency behavior มี test ที่ตรวจ database state จริง
- [ ] focused tests ผ่านทั้ง success และ failure สำคัญ
- [ ] build ที่เกี่ยวข้องผ่าน และ API contract validator มี `Errors = 0` เมื่อมี API change
- [ ] ไม่มี secret หรือ PII ที่ไม่จำเป็นใน client/log
- [ ] runtime/integration/performance evidence ระบุ environment และ limitation
- [ ] `Objective/process.md` อัปเดตเฉพาะหลักฐานล่าสุด ไม่เลื่อนสถานะจาก static evidence อย่างเดียว

## 9. Deferred / ห้ามทำก่อนมี Decision

- [ ] Offline sync แบบ optimistic ที่หัก quota ฝั่ง client ก่อน server ยืนยัน
- [ ] การให้ client ส่ง `sessionsRemaining` หรือเวลาที่เชื่อถือได้มา override server
- [ ] การส่ง LINE notification จาก request ก่อน transaction commit
- [ ] การเพิ่ม table/constraint ซ้ำจาก SQL เอกสารโดยไม่ตรวจ metadata ฐานข้อมูลจริง
- [ ] การเพิ่ม fallback pickup แบบ free-text หาก owner ยังไม่ยืนยันความปลอดภัยและ audit rule
- [ ] การประกาศ worker, LINE provider, offline sync หรือ NFR ผ่านจาก unit test/build เพียงอย่างเดียว

## 10. Next Action

เริ่ม `P0-01` โดยทำ contract/decision record ให้จบก่อน จากนั้นทำ `P1-01` hardening และ relational integration tests ของ transaction เดิม แล้วจึงทำ `P2-01` scanner mode ให้ครบ AC-1. งาน `P3` ต้องปิดด้วย runtime evidence ส่วน `P4` ต้องรอ idempotency/conflict policy ที่ยืนยันแล้วจึงเริ่ม implementation. เมื่อทุก slice ผ่านให้รัน `P6-01` และอัปเดต `Objective/process.md` เป็นหลักฐานรอบใหม่.
