# Task Plan: QR Attendance จาก Implementation จริง

> ขอบเขต: หมวด 3 QR Attendance ตาม `Objective/ProjectObj.md`
> วันที่ปรับแผน: 13 กันยายน 2026
> Source of truth: source ใน `API/`, `Front/`, `API/Models/`, `API/Data/TutoringDbContext.cs` และ SQL verification ใน `Objective/sql_script.md`
> หลักการ: ไม่ถือ build/unit test/schema เป็น production acceptance และไม่เพิ่ม DDL จนกว่าจะตรวจ metadata ของฐานข้อมูลจริง

## 1. ผลลัพธ์ที่พบจากระบบปัจจุบัน

### 1.1 API ที่มีจริง

| Method | Route | Source | ผลลัพธ์ปัจจุบัน |
|---|---|---|---|
| GET | `/api/attendance/daily` | `API/Controllers/AttendanceEndpoints.cs` | คืน `DailyAttendanceResponse`; รับ `session_id`, `date` |
| POST | `/api/attendance/scan` | `AttendanceEndpoints`, `AttendanceService` | รับ `qrToken`, `sessionId`, optional `Idempotency-Key`; สร้าง present และหัก quota ตาม course type |
| POST | `/api/attendance/manual` | `AttendanceEndpoints`, `AttendanceService` | รับ `sessionId`, `studentId`, `status`; status ที่ service รับคือ `present`, `late`, `absent`, `leave` |
| POST | `/api/attendance/{attendanceId}/checkout` | `AttendanceEndpoints`, `AttendanceService` | รับ `pickedUpBy` หรือ `pickupAuthorizationId`; บันทึก audit และ dispatch checkout notification |
| GET | `/api/attendance/{attendanceId}/audit` | `AttendanceEndpoints` | คืน checkout audit ล่าสุด |
| GET | `/api/students/{studentId}/pickup-authorizations` | student pickup endpoint | UI ใช้โหลดรายชื่อผู้รับเด็ก |

### 1.2 Frontend ที่มีจริง

- `Front/src/pages/admin/attendance-page.jsx` มีแท็บ scan/manual, mode `check-in`/`check-out`, scan confirmation และ checkout จากรายการนักเรียนที่ check-in แล้ว
- `Front/src/components/ui/scanner-camera.jsx` ใช้ `jsQR`, camera permission และ manual QR input
- `Front/src/services/attendance-service.js` เรียก scan/manual/daily/checkout และสร้าง `Idempotency-Key` ฝั่ง client
- `Front/src/services/attendance-offline-queue.js` ใช้ IndexedDB store `pending_attendance_events`, เก็บ event expiry 5 นาที และ sync เมื่อ online
- Offline queue ปัจจุบัน queue เฉพาะ check-in; checkout ยังไม่ถูก queue

### 1.3 Worker และ notification ที่มีจริง

- `API/Services/BackgroundNotificationJobs.cs` มี `LateAttendanceNotificationJob`
- `API/Repositories/BackgroundNotificationRepository.cs` query late candidate จาก session ที่เกิน 20 นาทีและยังไม่มี attendance
- `API/Services/BackgroundNotificationService.cs` มี pending/sent/retrying/failed และ retry สูงสุด 3 ครั้ง
- check-in ใช้ `attendance_checkin:{sessionId}:{studentId}:{parentId}`
- checkout ใช้ `attendance_checkout:{attendanceId}:{parentId}`
- `notifications` ยังค้น idempotency จาก JSON payload และยังไม่มี unique database constraint

## 2. Gaps ที่ยืนยันจาก source

รายการเหล่านี้เป็น task จริง ไม่ใช่สมมติฐานจาก SRS:

1. `ScanAttendanceRequest.IdempotencyKey` ถูกอ่านจาก request/header แต่ยังไม่มี persistence/replay lookup ฝั่ง attendance; ส่ง key เดิมจึงไม่ได้ replay response อย่าง deterministic
2. `AttendanceService.ScanAsync` มี pre-check duplicate แยกจาก transaction จึงยังมี race ก่อน unique constraint; database exception ถูก map ใน service บางกรณี แต่ endpoint ยังต้อง map constraint ให้ contract คงที่
3. scan response กำหนด `NotificationStatus = "queued"` แต่ไม่ได้ส่งผล dispatch จริงกลับมา และ `sessionsRemaining` เป็นค่าหลัง query แยกจาก transaction
4. scan/manual transaction สร้าง attendance ก่อนหรือระหว่าง validation บางจุด และ manual ใช้ `FirstAsync` หาก session หาย ซึ่งอาจกลายเป็น 500 แทน `SESSION_NOT_FOUND`
5. quota แบบ `group/private` โหลด enrollment ที่ `sessions_remaining > 0` แล้วลด entity; ยังไม่มี conditional `UPDATE ... WHERE sessions_remaining > 0` หรือ row-lock evidence ที่พิสูจน์ concurrent deduction
6. manual record ไม่มี audit event เฉพาะ attendance และไม่มี endpoint สำหรับแก้ไข/ยกเลิก attendance; ต้องตัดสิน policy ว่า immutable หรือมี correction workflow
7. checkout มี mode ใน UI แต่ไม่ใช่ QR checkout โดยตรง; ไม่มี endpoint ที่รับ QR เพื่อ resolve attendance และ session
8. checkout authorization query ตรวจ active/revoked/date/student แต่ต้องมี SQL ตรวจ tenant consistency ระหว่าง authorization, student และ attendance
9. late worker ไม่ได้แสดง policy holiday ใน source และต้องตรวจว่า leave/absent/cancelled/completed ถูก suppress ตาม owner rule หรือไม่
10. notification idempotency เป็น application-level JSON lookup; multi-instance race ยังไม่ถูกป้องกันด้วย unique key
11. offline queue ไม่มี service worker, backoff metadata ที่ใช้งานจริง, queue count/failed state UI, logout cleanup และ server-side offline event persistence
12. scan QR token ใน model เป็น token string + expiry; source ยังไม่มี cryptographic signature verification ต้องตัดสินว่า token rotation/expiry เพียงพอหรือเพิ่ม signed format

## 3. กติกาที่ใช้ตัดสินผล

- Tenant มาจาก authenticated context/`TenantMiddleware` เท่านั้น ห้ามรับ `institute_id` จาก client
- Server เป็น authority ของ QR validity, session eligibility, actor, current time และ quota
- หนึ่ง attendance ต่อ `(session_id, student_id)` โดยใช้ `uq_attendance_session_student` เป็น database boundary
- `present` และ `late` หัก quota; `leave` และ `absent` ไม่หัก เว้นแต่ owner อนุมัติกฎใหม่
- no quota ต้องไม่สร้าง attendance สำเร็จบางส่วน
- notification ต้องเกิดหลัง attendance persistence commit และ provider failure ห้าม rollback attendance
- offline replay ต้องใช้ client event ID/idempotency key แต่ห้าม trust client timestamp หรือ cached quota
- timestamp ใน API ใช้ UTC ISO 8601; timezone ของ institute ใช้ตอนแสดงผลและ worker policy
- schema evidence จาก CSV/SQL ไม่เท่ากับ runtime evidence

## 4. ลำดับงานใหม่

```text
P0 Contract freeze
  -> P1 SQL/schema/data audit
  -> P2 Transaction + idempotency hardening
  -> P3 Scanner/manual/checkout contract
  -> P4 Worker + notification
  -> P5 Offline queue
  -> P6 Runtime/performance acceptance
```

ห้ามเริ่ม P5 จนกว่า P2 จะกำหนด server idempotency และ conflict response เสร็จ เพราะ offline queue ปัจจุบันยังไม่สามารถรับประกัน replay ที่ server ได้

## 5. Task Board

### P0: Freeze contract จาก API ที่มีจริง

สถานะ: `[x]` contract freeze `attendance-v1` เสร็จแล้ว; implementation gaps ถูกส่งต่อไป P2-P5

งาน:

- [x] สร้าง contract map จาก endpoint จริง 6 routes ในข้อ 1.1
- [x] เลือก error casing เดียว: `errorCode` หรือ `error_code`; ปรับ DTO, endpoint, spec และ Front mapping ให้ตรงกัน
- [x] กำหนด HTTP status ของ `INVALID_QR`, `DUPLICATE_SCAN`, `NO_QUOTA`, `SESSION_NOT_FOUND`, `FORBIDDEN`, `INVALID_PICKUP_AUTHORIZATION`, `ALREADY_CHECKED_OUT`
- [x] กำหนด scan response ให้คืน `attendanceId`, `sessionId`, `studentId`, `status`, `checkinAt`, `checkoutAt`, `sessionsRemaining`, `notificationStatus`
- [x] กำหนด manual policy: record immutable หรือมี correction endpoint; ห้ามเพิ่ม UI แก้ย้อนหลังจนกว่าจะมี quota reversal rule
- [x] ตัดสิน QR policy จาก model จริง: token expiry/rotation หรือ signed token; ห้ามเขียน signed verification ใหม่โดยไม่มี format/secret policy
- [x] ตัดสิน checkout policy: ใช้ attendance ID จาก daily list หรือเพิ่ม QR checkout endpoint; ถ้าต้องการ AC-1 แบบ QR ต้องเพิ่ม contract ก่อน
- [x] กำหนด late worker policy: 20 นาที, timezone, cancelled/completed/holiday, leave/absent และ repeat notification
- [x] กำหนด offline conflict: duplicate, expired session, no quota, revoked pickup และ logged-out device

ผลลัพธ์ที่ต้องได้:

- [x] `Objective/attendance-contract.md` หรือส่วน decision record ในไฟล์นี้ระบุ request/response/error/role/tenant/time policy ครบ
- [x] ทุก task ถัดไปอ้าง contract version เดียวกัน

### P1: SQL verification และ data audit

สถานะ: `[/]` มี SQL verification/runbook แล้ว แต่ยังรันฐานข้อมูลเป้าหมายไม่ได้เพราะไม่มี test DB environment variables

มีสคริปต์แบบ read-only สำหรับรันชุดตรวจหลักที่ `API/Database/verify-attendance-p1.ps1`

ก่อนแก้ schema ให้รันและเก็บผลลัพธ์ตาม `Objective/sql_script.md`:

- [ ] `SELECT DATABASE(), VERSION()`
- [ ] `SHOW CREATE TABLE attendances`, `sessions`, `students`, `enrollments`, `notifications`, `audit_logs`, `student_pickup_authorizations`
- [ ] ตรวจ `information_schema.COLUMNS` ของ attendance/session/student/enrollment/notification/pickup/audit
- [ ] ตรวจ `information_schema.TABLE_CONSTRAINTS` และ `STATISTICS`
- [ ] ยืนยัน `uq_attendance_session_student` มีจริงและ column order เป็น `(session_id, student_id)`
- [ ] ตรวจ duplicate attendance ตาม `session_id, student_id`
- [ ] ตรวจ orphan attendance ที่ไม่มี session/student
- [ ] ตรวจ attendance tenant mismatch ระหว่าง attendance/session/student
- [ ] ตรวจ enrollment tenant/course/student mismatch และ `sessions_remaining < 0`
- [ ] ตรวจ attendance ที่ `pickup_authorization_id` ชี้ไม่พบ record
- [ ] ตรวจ pickup authorization tenant/student mismatch, revoked/expired records ที่ถูกอ้างใน attendance
- [ ] ตรวจ audit events `scan`, `manual`, `checkout` และ notification records ที่ trace กลับ attendance ได้
- [ ] ตรวจ notifications ที่มี idempotency key ซ้ำจาก JSON payload
- [ ] ห้ามเพิ่ม DDL จนผล metadata ยืนยันว่าขาดจริง และต้องมี backup/evidence ก่อน migration

ผลลัพธ์ที่ต้องได้:

- [ ] SQL output artifact ระบุ database/version/time/environment
- [ ] รายการ anomaly แยกเป็น `data-fix-needed`, `code-fix-needed`, `no-issue`
- [ ] ไม่มีการแก้ข้อมูลด้วยค่าเดาหรือรัน `CREATE TABLE/INDEX` ซ้ำ

### P2: Transaction และ server idempotency

สถานะ: `[/]` เพิ่ม atomic quota update และ duplicate mapping แล้ว; ใช้ database unique constraint เป็น simple duplicate policy ส่วน server replay ถูก defer

- [ ] ย้าย session existence/status/tenant/student/enrollment validation ให้อยู่ใน transaction boundary ที่ deterministic
- [x] แก้ manual missing session ให้คืน `SESSION_NOT_FOUND` ไม่ใช่ `FirstAsync`/500
- [x] ใช้ conditional quota update หรือ `FOR UPDATE` ที่รองรับ TiDB/MySQL และตรวจ affected rows
- [ ] ตรวจว่า no quota, expired subscription, insufficient credit และ invalid ownership rollback attendance/wallet/quota ทั้งหมด
- [x] ตัดสิน policy แบบง่าย: ใช้ database unique constraint กัน duplicate และเก็บ `Idempotency-Key` เป็น client event reference; server replay persistence defer
- [ ] key เดิม + payload เดิมต้อง replay ผลลัพธ์เดิม; key เดิม + payload ต่างต้องคืน conflict
- [ ] duplicate concurrent scan ต้องคืน deterministic result และ quota ลดครั้งเดียว
- [ ] เพิ่ม audit event ของ scan/manual พร้อม attendance ID หลัง commit
- [ ] checkout ต้องตรวจ tenant, session/student relation, check-in, duplicate checkout และ actor role
- [ ] ทำ relational integration tests กับ MySQL/TiDB/test container สำหรับ commit/rollback/concurrency

ปิด P2 เมื่อ:

- [ ] database state ยืนยันว่า no quota ไม่เกิด attendance
- [ ] concurrent scan สอง request มี attendance ได้หนึ่งรายการและ quota ลดหนึ่งครั้ง
- [ ] idempotency replay ไม่สร้าง attendance/notification ซ้ำ

### P3: API และ Scanner UX ให้ตรงผลลัพธ์จริง

สถานะ: `[/]` มี UI และ list-assisted checkout ตาม policy; ปรับ scanner/error mapping แล้ว แต่ยังไม่มี component/runtime evidence ครบ

- [x] แก้ Front service ให้ใช้ field/header ตาม P0 และ map response/error casing เดียว
- [x] check-in flow: เปิดกล้อง -> scan -> แสดง student/session/quota -> ยืนยัน -> แสดง attendance ID/status
- [x] ป้องกัน scan ซ้ำ, double click, request ซ้อน และ reset camera หลัง success/cancel
- [ ] แสดง camera permission denied, insecure context/HTTPS, unavailable camera และ keyboard/manual fallback
- [ ] ตัดสินและ implement QR checkout endpoint หาก owner ต้องการ check-out จาก QR โดยตรง
- [x] ถ้าใช้ attendance list checkout ต่อ ให้ระบุชัดว่า AC-1 เป็น list-assisted checkout ไม่ใช่ QR checkout
- [x] manual UI ต้อง disable record ที่มี attendance แล้วตาม immutable policy และไม่ optimistic toggle ก่อน server success
- [ ] เพิ่ม checkout UI แสดง active pickup authorization, expired/revoked denial และ audit result
- [ ] เพิ่ม unit/component tests สำหรับ response mapping, error recovery, mode switch และ duplicate click

ปิด P3 เมื่อ:

- [ ] UI ใช้ route/field ที่มีจริงและแสดงผล server ไม่สร้าง quota/status เอง
- [ ] มีหลักฐาน allow/deny ของ role, tenant, QR, duplicate และ pickup

### P4: Late worker และ LINE notification

สถานะ: `[/]` มี implementation และ policy หลักแล้ว; ยังไม่มี LINE/runtime evidence

- [x] แก้ late candidate query ให้ suppress cancelled/completed และตรวจ tenant; holiday ยัง defer เพราะยังไม่มี source
- [ ] ทดสอบเวลา 19:59, 20:00, 20:01 ด้วย clock ที่ควบคุมได้
- [ ] ทดสอบ cancelled/completed session, leave/absent และ student ที่ไม่มี LINE binding
- [ ] เพิ่ม correlation/event reference ที่ trace `session_id`, `student_id`, `attendance_id` โดยไม่ log PII เกินจำเป็น
- [x] check-in/checkout notification ต้องสร้าง record หลัง commitและไม่ rollback attendance เมื่อ LINE timeout
- [ ] เพิ่ม notification idempotency constraint เฉพาะหลัง P1 SQL metadata ตรวจแล้ว; ถ้าแก้ไม่ได้ให้ทำ atomic insert/claim ใน repository
- [x] ทดสอบ pending/sent/retrying/failed, retry limit, permanent failure และ duplicate dispatcher ด้วย focused unit tests
- [ ] รัน hosted worker และ LINE sandbox/staging จริง เก็บ timestamp/environment/result โดยไม่เก็บ secret

ปิด P4 เมื่อ:

- [ ] rerun worker ไม่ส่ง late notification ซ้ำตาม policy
- [ ] check-in/checkout มี notification record trace กลับ attendance
- [ ] provider failure ไม่ rollback attendance และตรวจ retry ได้

### P5: Offline queue/sync ที่ไม่หลอกผลลัพธ์

สถานะ: `[/]` มี IndexedDB check-in queue และ sync lock แบบง่ายแล้ว; ยังไม่มี device evidence

- [ ] รักษา IndexedDB เป็น queue source; ไม่เก็บ JWT, LINE secret หรือ quota ที่เชื่อถือได้
- [x] เพิ่ม queue status, attempt count และ last error ใน IndexedDB event
- [ ] ใช้ client event ID/idempotency key ที่ server รับและ persist จริงตาม P2
- [x] sync ต้อง lock ไม่ให้หลาย trigger ยิง event เดียวพร้อมกัน
- [ ] ใช้ retry/backoff และแสดง queue count/pending/synced/failed/expired state ให้ครูเห็น
- [ ] server validate QR/session/actor/quota ใหม่ทุก replay; client timestamp ใช้สำหรับ audit เท่านั้น
- [x] duplicate replay = linked/success, expired/no-quota = rejected/manual review, ห้ามลบ error เงียบๆ
- [ ] checkout offline ให้ reject หรือ manual review ตาม P0; ห้าม queue authorization ที่อาจหมดอายุโดยไม่มี policy
- [ ] เพิ่ม IndexedDB tests: create, reload, ordering, retry, expiry, duplicate, storage error และ logout
- [ ] ทดสอบจริง online -> offline -> queue -> reload -> online -> sync บน Android Chrome/iOS Safari

ปิด P5 เมื่อ:

- [ ] replay ไม่สร้าง attendance ซ้ำและไม่หัก quota ซ้ำ
- [ ] failed/conflict event แสดงให้ครูแก้ได้
- [ ] มี browser/device evidence และ unsupported browser list

### P6: Runtime, performance และ final acceptance

สถานะ: `[/]` API/Front/LineLiff validation ผ่านแล้ว; ยังไม่มี k6/device/database runtime result

- [ ] เตรียม test data อย่างน้อย 2 institutes, teacher/admin, sessions active/cancelled/completed, students quota/no-quota และ parents LINE/no-LINE
- [ ] รัน SQL verification ใน P1 ก่อนและหลัง test run
- [x] รัน API/Front/LineLiff tests และ build พร้อมบันทึกผล
- [ ] รัน `load-tests/attendance.js` ที่ 100 concurrent users; เก็บ p50/p95/p99/error rate และ environment (environment นี้ไม่มี k6)
- [ ] ตรวจ p95 scan ไม่เกิน 2 วินาทีใน environment ที่ owner อนุมัติ
- [ ] ทำ negative tests: expired/invalid QR, replay, cross-tenant, wrong student pickup, revoked pickup, unauthorized role
- [ ] เก็บ worker log, notification record, API correlation ID และ database state
- [ ] อัปเดต `Objective/process.md` เฉพาะผลที่รันจริง พร้อม limitation และ rollback plan

## 6. Test matrix ที่ต้องทำจริง

| Area | Success | Failure/edge | ต้องตรวจจาก |
|---|---|---|---|
| Scan | valid QR, active session, quota ลดหนึ่งครั้ง | invalid/expired, duplicate, no quota, cross-tenant, concurrent | API + DB rows/quota |
| Manual | present/late หัก, leave/absent ไม่หัก | invalid status, missing session, duplicate, unauthorized | API + DB + audit |
| Checkout | authorized active pickup, snapshot, audit, LINE event | revoked/expired/wrong student/already checkout | API + pickup/attendance/audit SQL |
| Late worker | exactly at 20 minutes, no attendance | before threshold, cancelled, leave, rerun | worker log + notifications SQL |
| Notification | check-in/checkout sent and recorded | no recipient, timeout, retry, duplicate | provider result + notifications SQL |
| Offline | queue/reload/reconnect/idempotent replay | expired, no quota, conflict, storage error, logout | browser/device + API/DB |
| Performance | 100 concurrent under p95 target | contention, duplicate concurrent scan | k6 artifact + DB state |

## 7. Current status and next executable action

สถานะหมวด QR Attendance ตอนปรับแผน:

- Code/build/unit evidence: มีบางส่วนในทุก AC
- Database runtime evidence: ยังไม่มีผลรันจากฐานข้อมูลเป้าหมาย
- Worker/LINE/device/load evidence: ยังไม่มีผล runtime ที่ใช้ปิด acceptance
- คะแนนห้ามขยับจากเอกสารนี้จนกว่าจะมี evidence ตาม P1/P2/P4/P5/P6

ลำดับลงมือถัดไป:

1. ทำ P0 ให้ contract/error/idempotency/checkout policy ปิดก่อน
2. รัน SQL ใน P1 และเก็บผลจริงจาก database เป้าหมาย
3. แก้ P2 โดยเฉพาะ server idempotency, manual missing-session และ conditional quota
4. จึงค่อยตัดสินว่า UI ต้องเพิ่ม QR checkout endpoint หรือใช้ list-assisted checkout
5. ปิดด้วย runtime worker/LINE/offline/load evidence แล้วอัปเดต `Objective/process.md`

## 8. สิ่งที่ห้ามทำ

- ห้ามเพิ่ม table/index/constraint จากเอกสารเก่าโดยไม่ดู `information_schema`
- ห้ามถือ client offline queue, unit test, build หรือ schema ว่า attendance สำเร็จใน production
- ห้ามให้ client ส่ง quota/time มา override server
- ห้ามส่ง LINE ก่อน persistence commit
- ห้าม queue checkout offline จนกว่า pickup authorization conflict policy จะได้รับการยืนยัน
- ห้ามเพิ่ม signed QR format หรือ holiday table โดยไม่มี owner-approved contract
