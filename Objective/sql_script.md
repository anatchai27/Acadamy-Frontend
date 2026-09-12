# TiDB v8.5.3 Schema Verification และ SRS Reconciliation

> เอกสารนี้ปรับตาม CSV ล่าสุด `Objective/results-2026-09-12-164548.csv` วันที่ 2026-09-12
>
> CSV ยืนยันโครงสร้างตารางและ constraint ที่ export ออกมาได้ แต่ไม่ยืนยันจำนวนข้อมูล, production runtime, API/UI flow หรือ transaction behavior ตาม SRS
>
> **สำคัญ:** ตาราง `makeup_bookings`, `makeup_credit_transactions`, `audit_logs` และ `student_pickup_authorizations` มีอยู่ใน CSV ล่าสุดแล้ว จึงไม่ควรรัน `CREATE TABLE` ของตารางเหล่านี้ซ้ำ

## 0. สถานะ schema ที่ยืนยันได้

จาก CSV ล่าสุดยืนยันว่า:

- `makeup_slots` มี `institute_id` และ FK `fk_makeup_slots_institute`
- `makeup_slots` ยังไม่มี `course_id` และ `status`
- `makeup_credits` มี `status`, `used_at`, `expired_at`
- `makeup_bookings` มีอยู่จริง พร้อม FK ไป `institutes`, `makeup_slots`, `students`, `makeup_credits`, `users`
- `makeup_credit_transactions` มีอยู่จริง พร้อม FK ไป `institutes`, `makeup_credits`, `students`, `users`
- `audit_logs` มีอยู่จริง พร้อม FK ไป `institutes`, `users`
- `student_pickup_authorizations` มีอยู่จริง พร้อม FK ไป `institutes`, `students`, `users`
- `attendances` มี `pickup_authorization_id`, `updated_at`, `updated_by` และ FK ที่เกี่ยวข้อง
- `attendances` มี unique constraint `uq_attendance_session_student`

สิ่งเหล่านี้เป็น **schema evidence** ไม่ใช่หลักฐานว่า SRS ผ่านครบทุก acceptance criteria

## 1. ตรวจ version และโครงสร้างจริง

รันก่อนแก้ไขใดๆ และเก็บผลลัพธ์ไว้เป็น evidence:

```sql
SELECT DATABASE() AS database_name, VERSION() AS tidb_version;

SHOW CREATE TABLE makeup_slots;
SHOW CREATE TABLE makeup_credits;
SHOW CREATE TABLE makeup_bookings;
SHOW CREATE TABLE makeup_credit_transactions;
SHOW CREATE TABLE audit_logs;
SHOW CREATE TABLE student_pickup_authorizations;
SHOW CREATE TABLE attendances;
```

ตรวจว่าตาราง/คอลัมน์ที่ CSV ระบุมีอยู่จริงในฐานข้อมูลเป้าหมาย:

```sql
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE,
       IS_NULLABLE, EXTRA, COLUMN_KEY
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'makeup_slots', 'makeup_credits', 'makeup_bookings',
    'makeup_credit_transactions', 'audit_logs',
    'student_pickup_authorizations', 'attendances'
  )
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

## 2. ตรวจ constraint และ index ก่อน rerun

```sql
SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'attendances', 'makeup_slots', 'makeup_bookings',
    'makeup_credit_transactions', 'audit_logs',
    'student_pickup_authorizations'
  )
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'attendances', 'makeup_slots', 'makeup_credits',
    'makeup_bookings', 'makeup_credit_transactions',
    'audit_logs', 'student_pickup_authorizations'
  )
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
```

ห้ามรัน `CREATE TABLE`, `ADD COLUMN`, `ADD CONSTRAINT` หรือ `CREATE INDEX` ซ้ำเพียงเพราะคำสั่งอยู่ในเอกสารเก่า ต้องตรวจ metadata ของฐานข้อมูลจริงก่อนเสมอ

## 3. ตรวจข้อมูลที่ SRS ต้องพึ่งพา

### 3.1 Attendance ซ้ำและ orphan

```sql
SELECT session_id, student_id, COUNT(*) AS duplicate_count
FROM attendances
GROUP BY session_id, student_id
HAVING COUNT(*) > 1;

SELECT COUNT(*) AS orphan_attendances
FROM attendances AS a
LEFT JOIN sessions AS s ON s.id = a.session_id
LEFT JOIN students AS st ON st.id = a.student_id
WHERE s.id IS NULL OR st.id IS NULL;
```

### 3.2 เครดิตผิดเจ้าของหรือ tenant

```sql
SELECT mc.id, mc.student_id, mc.course_id, mc.institute_id,
       st.institute_id AS student_institute_id,
       c.institute_id AS course_institute_id
FROM makeup_credits AS mc
LEFT JOIN students AS st ON st.id = mc.student_id
LEFT JOIN courses AS c ON c.id = mc.course_id
WHERE st.id IS NULL
   OR c.id IS NULL
   OR st.institute_id <> mc.institute_id
   OR c.institute_id <> mc.institute_id;
```

### 3.3 Booking ผิดความสัมพันธ์

```sql
SELECT mb.id, mb.institute_id, mb.slot_id, mb.student_id, mb.credit_id,
       ms.institute_id AS slot_institute_id,
       st.institute_id AS student_institute_id,
       mc.institute_id AS credit_institute_id
FROM makeup_bookings AS mb
LEFT JOIN makeup_slots AS ms ON ms.id = mb.slot_id
LEFT JOIN students AS st ON st.id = mb.student_id
LEFT JOIN makeup_credits AS mc ON mc.id = mb.credit_id
WHERE ms.id IS NULL
   OR st.id IS NULL
   OR mc.id IS NULL
   OR ms.institute_id <> mb.institute_id
   OR st.institute_id <> mb.institute_id
   OR mc.institute_id <> mb.institute_id;
```

### 3.4 ตรวจ booking ที่ active ซ้ำเชิงธุรกิจ

ข้อจำกัด unique ที่มี `active_marker` ไม่ได้แปลว่า application เปลี่ยน marker ถูกต้องทุกครั้ง จึงต้องตรวจข้อมูลจริงด้วย:

```sql
SELECT slot_id, student_id, COUNT(*) AS active_booking_count
FROM makeup_bookings
WHERE active_marker = 1
GROUP BY slot_id, student_id
HAVING COUNT(*) > 1;

SELECT credit_id, COUNT(*) AS active_booking_count
FROM makeup_bookings
WHERE active_marker = 1
GROUP BY credit_id
HAVING COUNT(*) > 1;
```

## 4. ตรวจ SRS Leave & Make-up

SRS ระบุ flow ที่ต้องตรวจใน application service ไม่ใช่แค่มี schema:

1. อนุมัติ `leave_requests` แล้วสร้าง `makeup_credits` ใน transaction เดียวกัน
2. จอง slot ต้องตรวจ `booked_count < capacity` และป้องกัน concurrent overbooking
3. ใช้เครดิต active ได้ไม่เกินหนึ่ง booking
4. group cancel ต้องคืนเครดิตให้ booking ที่ active ตาม rule
5. no-show ต้องใช้/ยึดเครดิต และห้ามคืนตาม FR-LV-09

ตรวจข้อมูลที่ช่วยจับความไม่ตรงกัน:

```sql
SELECT lr.id, lr.student_id, lr.session_id, lr.status,
       mc.id AS credit_id
FROM leave_requests AS lr
LEFT JOIN makeup_credits AS mc
  ON mc.student_id = lr.student_id
WHERE lr.status = 'approved'
  AND mc.id IS NULL;

SELECT mb.slot_id, ms.capacity, COUNT(*) AS active_booking_count,
       ms.booked_count
FROM makeup_bookings AS mb
JOIN makeup_slots AS ms ON ms.id = mb.slot_id
WHERE mb.active_marker = 1
GROUP BY mb.slot_id, ms.capacity, ms.booked_count
HAVING COUNT(*) > ms.capacity
    OR ms.booked_count <> COUNT(*);
```

ผล query เหล่านี้เป็นสัญญาณให้ตรวจ service/transaction ต่อ ไม่ควรแก้ด้วยการ update ค่าเดาโดยไม่มี business evidence

## 5. ตรวจ SRS Attendance และ Pickup

```sql
SELECT a.id, a.session_id, a.student_id, a.status,
       a.checkin_at, a.checkout_at, a.picked_up_by,
       a.pickup_authorization_id
FROM attendances AS a
LEFT JOIN student_pickup_authorizations AS p
  ON p.id = a.pickup_authorization_id
WHERE a.pickup_authorization_id IS NOT NULL
  AND p.id IS NULL;
```

Schema รองรับการอ้างอิงผู้รับเด็กแล้ว แต่ SRS ยังต้องตรวจว่ามี UI check-out, การตรวจสิทธิ์ผู้รับ, LINE notification และ audit event จริงหรือไม่

## 6. ตรวจ SRS Audit

ตาราง `audit_logs` มีอยู่จริงตาม CSV แต่ต้องตรวจว่ามี event ถูกเขียนจริง:

```sql
SELECT action, entity_type, COUNT(*) AS event_count,
       MIN(created_at) AS first_event, MAX(created_at) AS last_event
FROM audit_logs
GROUP BY action, entity_type
ORDER BY last_event DESC;

SELECT id, institute_id, user_id, action, entity_type,
       entity_id, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;
```

SRS ต้องการ audit สำหรับ login/logout และการเปลี่ยนข้อมูลสำคัญ การมี table หรือ interceptor อย่างเดียวไม่พอจะสรุปว่าผ่าน requirement

## 7. สิ่งที่ยังไม่ควรเพิ่มจากหลักฐานปัจจุบัน

- ไม่เพิ่ม `makeup_slots.course_id` เพราะ CSV ไม่มีและ SRS ไม่ได้ยืนยัน mapping ที่ใช้ได้
- ไม่เพิ่ม `makeup_slots.status` จนกว่าจะมี business lifecycle ที่อนุมัติ
- ไม่สร้างตาราง `*_new` หรือสร้างตาราง 4 กลุ่มซ้ำ เพราะมีอยู่ใน CSV ล่าสุดแล้ว
- ไม่เพิ่ม index ที่ใช้คอลัมน์ไม่มีจริง
- ไม่ใช้ `booked_count` เป็นหลักฐานแทน booking rows โดยไม่ตรวจ concurrency และ consistency
- ไม่ถือว่า schema มีอยู่แล้วหมายความว่า LIFF, API, worker, transaction และ notification ผ่าน SRS แล้ว

## 8. ถ้าต้องแก้ schema รอบถัดไป

ก่อน DDL ทุกครั้ง:

1. Backup ตารางที่เกี่ยวข้อง และบันทึกชื่อ backup ไม่ให้ชนรอบเดิม
2. รันข้อ 1-3 และแก้เฉพาะข้อมูลที่มีหลักฐานรองรับ
3. ตรวจ `information_schema` ว่าคอลัมน์/constraint/index ยังไม่มีจริง
4. เขียน EF Core model และ migration ให้ตรงกับ schema ก่อน deploy API
5. รันข้อ 4-6 หลัง deploy เพื่อยืนยัน business invariant
6. เก็บผล query และ `SHOW CREATE TABLE` เป็น evidence

DDL ของ TiDB ทำ implicit commit; การตรวจ runbook นี้จึงไม่ใช่ transaction ครอบคลุมทั้งเอกสาร

## 9. สรุปสถานะตามหลักฐาน

- **Schema:** ตารางหลักของ Leave & Make-up, Audit และ Pickup มีอยู่ตาม CSV ล่าสุด
- **SRS:** ยังสรุปผ่านครบไม่ได้จาก CSV; ต้องยืนยัน service transaction, endpoint, UI, worker, notification และข้อมูล runtime
- **Migration:** ไม่มี DDL สร้างตารางเดิมซ้ำในเอกสารฉบับนี้
- **ข้อมูลที่ต้องตรวจต่อ:** orphan, tenant mismatch, active booking ซ้ำ, capacity mismatch, leave-to-credit consistency และ audit events
