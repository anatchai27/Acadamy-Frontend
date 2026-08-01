# แผนปรับปรุงฐานข้อมูล TiDB MySQL สำหรับ Epic Review

**วันที่:** 2026-08-01  
**เป้าหมาย:** ปรับ schema ให้รองรับฟีเจอร์ใน [EpicReview/epic-review-and-coverage-report-TH.md](epic-review-and-coverage-report-TH.md)  
**ฐานข้อมูล:** TiDB MySQL (Distributed SQL)  
**อัปเดตล่าสุดจาก:** `API\Data\results-2026-08-01-131843.csv`  
**สถานะ:** หยุดการปรับ schema ที่นี่ แล้วไปต่อ **Phase 2 — อัปเดต EF Core / C# Models**

---

## 1. สถานะปัจจุบัน (อัปเดตล่าสุด)

### ✅ อะไรเสร็จแล้ว

| งาน | ตาราง | หมายเหตุ |
|------|--------|----------|
| Rebuild เป็น queue table | `notifications` | `BIGINT` พร้อม payload/retry/scheduled |
| Rebuild รองรับ PromptPay & slip verify | `payments` | `BIGINT` พร้อม QR/verification columns |
| Rebuild เป็น ledger ที่ชัดเจน | `wallet_transactions` | `BIGINT` พร้อม running_balance/reference |
| Rebuild รองรับ high-throughput | `attendances` | `BIGINT` แล้ว |
| Rebuild ตาราง moderate-write | `homework_submissions`, `skill_scores`, `leave_requests`, `makeup_credits` | `BIGINT` แล้ว |
| เพิ่ม audit + CHECK constraint | `student_wallets` | มี `created_at`, `version` |
| เพิ่ม multi-tenant + flags | `parents` | มี `institute_id`, `is_primary`, `is_active` |
| เพิ่ม QR token v2 | `students` | มี `qr_token_expires_at`, `qr_token_version`, `qr_token(512)` |
| เพิ่ม reference types | `pdpa_consents` | มี `reference_type`, `reference_id`, `consent_document_version` |
| Room overlap constraint | `sessions` | มี `uq_sessions_room_overlap` |
| สร้าง gamification tables | `badges`, `student_badges`, `streak_counters` | พร้อมใช้งาน |
| สร้าง lead/trial table | `leads` | พร้อมใช้งาน |
| สร้าง public CMS table | `public_website_contents` | พร้อมใช้งาน |
| สร้าง payroll table | `teacher_payroll_periods` | พร้อมใช้งาน |
| สร้าง resource allocation table | `room_bookings` | พร้อมใช้งาน |

### ⚠️ ตาราง `_old` ที่ยังเหลือต้อง cleanup

> ℹ️ `attendances_old`, `notifications_old`, `wallet_transactions_old` ถูกลบไปแล้วตาม CSV ล่าสุด

```sql
-- รันหลังตรวจสอบข้อมูลถูกต้องแล้วเท่านั้น
DROP TABLE IF EXISTS homework_submissions_old;
DROP TABLE IF EXISTS skill_scores_old;
DROP TABLE IF EXISTS leave_requests_old;
DROP TABLE IF EXISTS makeup_credits_old;
```

### ❌ อะไรยังไม่เสร็จ

| Priority | งาน | ตาราง |
|----------|------|--------|
| P1 | Cleanup ตาราง `_old` ที่เหลือ | `homework_submissions_old`, `skill_scores_old`, `leave_requests_old`, `makeup_credits_old` |
| ~~P2~~ | ~~แก้ `institute_id` เป็น `NOT NULL`~~ | ~~`sessions`, `enrollments`~~ |
| P2 | Verify CHECK constraint | `student_wallets` |

### สรุปความพร้อมต่อ Epic Review

- **Epic 1-3 พร้อมทำงานต่อได้เลย** — DB รองรับแล้ว
- **Epic 4.1-4.2 พร้อมแล้ว** — `parents` + `students` มี columns ที่จำเป็น
- **Epic 5.3 พร้อมแล้ว** — `badges`, `student_badges`, `streak_counters` ถูกสร้างแล้ว
- **Epic 6 พร้อมแล้ว** — `leads`, `public_website_contents`, `teacher_payroll_periods`, `room_bookings` ถูกสร้างแล้ว
- **DB พร้อมสำหรับ Epic Review ทั้งหมดแล้ว** — เหลือแค่ cleanup `_old` tables บางตัว + verify CHECK constraint
- **จุดหยุด Phase 1** — schema ล่าสุดถูกต้องแล้ว ไปต่อ **Phase 2: อัปเดต EF Core C# Models + Migration**

---

## 2. สรุปเข้าใจเร็ว

### อะไรดีอยู่แล้ว
- ทุกตารางหลักมี `institute_id`
- `courses` มี polymorphic columns ครบ
- มี `student_wallets`, `wallet_transactions`, `makeup_slots`, `leave_requests`, `pdpa_consents` แล้ว

### อะไรต้องแก้
| # | ปัญหา | วิธีแก้ | สถานะ |
|---|-------|---------|--------|
| 1 | ~~`sessions.institute_id` ยังเป็น `YES` (nullable)~~ | ~~`ALTER TABLE sessions MODIFY COLUMN institute_id INT NOT NULL;`~~ | ✅ เสร็จแล้ว |
| 2 | ~~`enrollments.institute_id` ยังเป็น `YES` (nullable)~~ | ~~`ALTER TABLE enrollments MODIFY COLUMN institute_id INT NOT NULL;`~~ | ✅ เสร็จแล้ว |
| 3 | ตาราง `_old` ค้างจากการ rebuild | `DROP TABLE IF EXISTS ...` | ⚠️ ยังเหลือ 4 ตาราง |
| 4 | ต้อง verify CHECK constraint `student_wallets.balance >= 0` | `SHOW CREATE TABLE student_wallets;` หรือ `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS` | ❌ ยังไม่ทำ |

---

## 2. กฎสำคัญของ TiDB ที่ต้องจำ

ก่อนอ่าน query ทุกอัน ต้องเข้าใจกฎนี้ก่อน:

1. **`AUTO_RANDOM` ใช้ได้กับ `BIGINT` เท่านั้น** ไม่ใช่ `INT`
2. **`AUTO_RANDOM` สร้างได้จาก `auto_increment clustered primary key` เท่านั้น**
3. **ถ้า PK ปัจจุบันเป็น `INT PRIMARY KEY` บน TiDB มักจะเป็น `NONCLUSTERED`** → `ALTER TABLE MODIFY COLUMN` ไม่ได้
4. **วิธีที่ถูกต้องคือ rebuild table**: `CREATE TABLE _new` → `INSERT` → `RENAME` → `DROP ของเก่า`
5. **ห้าม `AUTO_RANDOM(5)`** — shard น้อยเกินไป ให้ใช้ `AUTO_RANDOM(8)` ขึ้นไป
6. **ห้าม `ORDER BY id`** หลังใช้ AUTO_RANDOM — ต้อง sort ด้วย `created_at` หรือ timestamp อื่น
7. **EF Core ต้องเปลี่ยน `int` → `long`** และใส่ `ValueGeneratedOnAdd()`

### Pre-Check ก่อนเริ่ม

```sql
-- ดูว่า TiDB ใช้ clustered index หรือไม่
SELECT @@global.tidb_enable_clustered_index;
SELECT @@session.tidb_enable_clustered_index;

-- ดู PK type ของแต่ละตาราง
SELECT TABLE_NAME, TIDB_PK_TYPE
FROM information_schema.tables
WHERE TABLE_SCHEMA = 'your_database_name';
```

ถ้า `TIDB_PK_TYPE = 'NONCLUSTERED'` → ต้อง rebuild table

---

## 3. Pattern มาตรฐานสำหรับ Rebuild Table

ทุกตารางที่ต้องเปลี่ยนเป็น `AUTO_RANDOM` หรือมีปัญหา `Duplicate column name` ให้ใช้ pattern นี้:

```sql
-- Step 1: สร้างตารางใหม่
CREATE TABLE <table>_new (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY CLUSTERED,
  -- columns ใหม่ + เก่า รวมกันที่นี่
  ...
);

-- Step 2: ย้ายข้อมูล
INSERT INTO <table>_new (...)
SELECT ... FROM <table>;

-- Step 3: ปิด FK check ชั่วคราว
SET FOREIGN_KEY_CHECKS = 0;

-- Step 4: สลับชื่อตาราง (atomic)
RENAME TABLE <table> TO <table>_old, <table>_new TO <table>;

SET FOREIGN_KEY_CHECKS = 1;

-- Step 5: ตรวจสอบข้อมูลถูกต้องแล้วค่อย drop
-- DROP TABLE <table>_old;
```

> **เหตุผลที่ต้อง rebuild ไม่ใช่ ALTER**: หลีกเลี่ยงปัญหา `Duplicate column name`, `auto_random can only be converted from auto_increment clustered primary key`, และทำให้ได้ schema ใหม่ที่สะอาดในครั้งเดียว

---

## 4. แผนปฏิบัติงาน (Runbook)

### Phase 1: Cleanup ตาราง `_old` ทั้งหมด

รันหลังตรวจสอบข้อมูลเรียบร้อยแล้ว:

```sql
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS attendances_old;
DROP TABLE IF EXISTS notifications_old;
DROP TABLE IF EXISTS wallet_transactions_old;
DROP TABLE IF EXISTS homework_submissions_old;
DROP TABLE IF EXISTS skill_scores_old;
DROP TABLE IF EXISTS leave_requests_old;
DROP TABLE IF EXISTS makeup_credits_old;
SET FOREIGN_KEY_CHECKS = 1;
```

### Phase 2: แก้ `institute_id` ที่ยังเป็น NULL ให้เป็น NOT NULL

```sql
-- อัปเดตค่า NULL เป็น 0 ก่อน (ถ้ามี)
UPDATE sessions SET institute_id = 0 WHERE institute_id IS NULL;
UPDATE enrollments SET institute_id = 0 WHERE institute_id IS NULL;

-- จากนั้นค่อยเปลี่ยนเป็น NOT NULL
ALTER TABLE sessions MODIFY COLUMN institute_id INT NOT NULL;
ALTER TABLE enrollments MODIFY COLUMN institute_id INT NOT NULL;
```

### Phase 3: Verify CHECK constraint

```sql
-- ตรวจสอบว่า CHECK constraint มีอยู่จริง
SELECT CONSTRAINT_NAME
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'student_wallets'
  AND CONSTRAINT_TYPE = 'CHECK';

-- หรือดูจาก SHOW CREATE TABLE
SHOW CREATE TABLE student_wallets;
```

### Phase 4: อัปเดต EF Core

- เปลี่ยน `int Id` → `long Id` ในตารางที่ใช้ AUTO_RANDOM
- เพิ่ม properties ใหม่ใน models ที่มีการเปลี่ยนแปลง
- สร้าง models ใหม่
- รัน `Add-Migration EpicReviewSchemaUpdates`

---

## 5. Query รายตาราง

### 5.1 Cleanup ตาราง `_old` ที่เหลือ

> ⚠️ รันหลังจากตรวจสอบว่าข้อมูลในตารางใหม่ถูกต้องครบถ้วนแล้วเท่านั้น

```sql
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS attendances_old;
DROP TABLE IF EXISTS notifications_old;
DROP TABLE IF EXISTS wallet_transactions_old;
DROP TABLE IF EXISTS homework_submissions_old;
DROP TABLE IF EXISTS skill_scores_old;
DROP TABLE IF EXISTS leave_requests_old;
DROP TABLE IF EXISTS makeup_credits_old;
SET FOREIGN_KEY_CHECKS = 1;
```

---

### 5.2 แก้ `institute_id` ที่ยังเป็น NULL ให้เป็น NOT NULL

> ✅ รันไปแล้วตาม CSV `results-2026-08-01-131843.csv` ทั้ง `sessions` และ `enrollments` เป็น `NOT NULL` แล้ว

```sql
-- อัปเดตค่า NULL เป็น 0 ก่อน (ถ้ามี)
UPDATE sessions SET institute_id = 0 WHERE institute_id IS NULL;
UPDATE enrollments SET institute_id = 0 WHERE institute_id IS NULL;

-- เปลี่ยนเป็น NOT NULL
ALTER TABLE sessions MODIFY COLUMN institute_id INT NOT NULL;
ALTER TABLE enrollments MODIFY COLUMN institute_id INT NOT NULL;
```

---

### 5.3 Rebuild ตารางที่เหลือเป็น AUTO_RANDOM (รันไปแล้วตาม state ล่าสุด)

> ℹ️ ส่วนนี้รันไปแล้วทั้งหมด เก็บไว้เป็น reference

#### `homework_submissions`

```sql
CREATE TABLE homework_submissions_new (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY CLUSTERED,
  homework_id INT NOT NULL,
  student_id INT NOT NULL,
  institute_id INT NOT NULL,
  submitted_at DATETIME NULL,
  file_url VARCHAR(255) NULL,
  score DECIMAL(5,2) NULL,
  feedback TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_homework_submissions_homework (homework_id),
  INDEX idx_homework_submissions_student (student_id),
  INDEX idx_homework_submissions_tenant (institute_id, homework_id, student_id)
);

INSERT INTO homework_submissions_new (
  id, homework_id, student_id, institute_id, submitted_at, file_url, score, feedback
)
SELECT
  id, homework_id, student_id, COALESCE(institute_id, 0), submitted_at, file_url, score, feedback
FROM homework_submissions;

SET FOREIGN_KEY_CHECKS = 0;
RENAME TABLE homework_submissions TO homework_submissions_old, homework_submissions_new TO homework_submissions;
SET FOREIGN_KEY_CHECKS = 1;

-- DROP TABLE homework_submissions_old;
```

#### `skill_scores`

```sql
CREATE TABLE skill_scores_new (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY CLUSTERED,
  student_id INT NOT NULL,
  topic_id INT NOT NULL,
  institute_id INT NOT NULL,
  score DECIMAL(5,2) NULL,
  note TEXT NULL,
  updated_by INT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_skill_scores_student (student_id),
  INDEX idx_skill_scores_topic (topic_id),
  INDEX idx_skill_scores_tenant (institute_id, student_id, topic_id)
);

INSERT INTO skill_scores_new (
  id, student_id, topic_id, institute_id, score, note, updated_by, updated_at
)
SELECT
  id, student_id, topic_id, COALESCE(institute_id, 0), score, note, updated_by, updated_at
FROM skill_scores;

SET FOREIGN_KEY_CHECKS = 0;
RENAME TABLE skill_scores TO skill_scores_old, skill_scores_new TO skill_scores;
SET FOREIGN_KEY_CHECKS = 1;

-- DROP TABLE skill_scores_old;
```

#### `leave_requests`

```sql
CREATE TABLE leave_requests_new (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY CLUSTERED,
  student_id INT NOT NULL,
  session_id INT NOT NULL,
  institute_id INT NOT NULL,
  reason TEXT NULL,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_at DATETIME NULL,
  approved_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leave_requests_student (student_id),
  INDEX idx_leave_requests_session (session_id),
  INDEX idx_leave_requests_tenant (institute_id, status, requested_at)
);

INSERT INTO leave_requests_new (
  id, student_id, session_id, institute_id, reason, type, status, requested_at, approved_by
)
SELECT
  id, student_id, session_id, COALESCE(institute_id, 0), reason, type, status, requested_at, approved_by
FROM leave_requests;

SET FOREIGN_KEY_CHECKS = 0;
RENAME TABLE leave_requests TO leave_requests_old, leave_requests_new TO leave_requests;
SET FOREIGN_KEY_CHECKS = 1;

-- DROP TABLE leave_requests_old;
```

#### `makeup_credits`

```sql
CREATE TABLE makeup_credits_new (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY CLUSTERED,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  institute_id INT NOT NULL,
  granted_at DATETIME NULL,
  expires_at DATE NOT NULL,
  used_session_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_makeup_credits_student (student_id),
  INDEX idx_makeup_credits_course (course_id),
  INDEX idx_makeup_credits_tenant (institute_id, student_id, expires_at)
);

INSERT INTO makeup_credits_new (
  id, student_id, course_id, institute_id, granted_at, expires_at, used_session_id
)
SELECT
  id, student_id, course_id, COALESCE(institute_id, 0), granted_at, expires_at, used_session_id
FROM makeup_credits;

SET FOREIGN_KEY_CHECKS = 0;
RENAME TABLE makeup_credits TO makeup_credits_old, makeup_credits_new TO makeup_credits;
SET FOREIGN_KEY_CHECKS = 1;

-- DROP TABLE makeup_credits_old;
```

---

### 5.4 แก้ไขตารางเดิมด้วย ALTER TABLE (รันไปแล้วตาม state ล่าสุด)

> ℹ️ ส่วนนี้รันไปแล้วสำหรับ DB ปัจจุบัน เก็บไว้เป็น reference หรือกรณีต้อง rollback/redo
>
> ⚠️ หมายเหตุ: TiDB ไม่รองรับ **partial index** (`WHERE ...`) และไม่รองรับการเพิ่ม **generated stored column** ผ่าน `ALTER TABLE` ให้ใช้ทางเลือก A แล้ว handle edge case ใน code

```sql
-- ทางเลือก A: unique constraint บน room_id (แนะนำ)
-- ใน MySQL/TiDB, หลาย row ที่ room_id = NULL จะถือว่า distinct กัน ไม่ conflict
-- แต่ถ้าอยากปลอดภัย ให้ใช้ empty string หรือ 'N/A' แทน NULL ใน code
ALTER TABLE sessions
  ADD CONSTRAINT uq_sessions_room_overlap
    UNIQUE (institute_id, room_id, scheduled_at, duration_min);

-- ทางเลือก B: partial index (ไม่รองรับใน TiDB บางเวอร์ชัน)
-- CREATE INDEX idx_sessions_room_time ON sessions(institute_id, room_id, scheduled_at, duration_min)
--   WHERE room_id IS NOT NULL;

-- ทางเลือก C: generated column (ไม่รองรับผ่าน ALTER TABLE ใน TiDB บางเวอร์ชัน)
-- ถ้าจะใช้ ต้องสร้างตารางใหม่ด้วย CREATE TABLE ...
```

**การจัดการ NULL ใน code:**

```csharp
// ถ้าไม่มีห้อง ให้เก็บค่าว่างแทน NULL เพื่อให้ unique constraint ทำงานถูกต้อง
entity.RoomId = string.IsNullOrWhiteSpace(entity.RoomId) ? "__NO_ROOM__" : entity.RoomId;
```

หรือถ้าต้องการป้องกัน room ซ้อนจริง ๆ แนะนำให้ validate ใน code ก่อน insert/update:

```csharp
var exists = await dbContext.Sessions.AnyAsync(s =>
    s.InstituteId == session.InstituteId &&
    s.RoomId == session.RoomId &&
    s.ScheduledAt < session.ScheduledAt.AddMinutes(session.DurationMin) &&
    s.ScheduledAt.AddMinutes(s.DurationMin) > session.ScheduledAt);

if (exists) throw new InvalidOperationException("ห้องถูกจองในช่วงเวลานี้แล้ว");
```

---

## 6. ตารางใหม่

### 6.1 `leads` — Trial Booking

```sql
CREATE TABLE leads (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY,
  institute_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NULL,
  grade VARCHAR(50) NULL,
  interested_subjects VARCHAR(500) NULL,
  source VARCHAR(50) NULL DEFAULT 'website',
  status VARCHAR(50) NOT NULL DEFAULT 'new' COMMENT 'new, contacted, trial_scheduled, enrolled, lost',
  assigned_to INT NULL,
  notes TEXT NULL,
  trial_session_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leads_tenant_status (institute_id, status, created_at),
  INDEX idx_leads_phone (phone, institute_id),
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (trial_session_id) REFERENCES sessions(id) ON DELETE SET NULL
);
```

### 6.2 `public_website_contents` — Public CMS

```sql
CREATE TABLE public_website_contents (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY,
  institute_id INT NOT NULL,
  section_key VARCHAR(100) NOT NULL COMMENT 'hero_banner, about_us, teachers, portfolio, contact',
  content_type VARCHAR(50) NOT NULL DEFAULT 'text' COMMENT 'text, image, html, json',
  content_value TEXT NULL,
  metadata JSON NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_public_content_section (institute_id, section_key),
  INDEX idx_public_content_active (institute_id, is_active, sort_order)
);
```

### 6.3 `teacher_payroll_periods` — Payroll

```sql
CREATE TABLE teacher_payroll_periods (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY,
  institute_id INT NOT NULL,
  teacher_id INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' COMMENT 'draft, approved, paid',
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_period (institute_id, teacher_id, period_start, period_end),
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);
```

### 6.4 `badges`, `student_badges`, `streak_counters` — Gamification

```sql
CREATE TABLE badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  institute_id INT NOT NULL,
  badge_key VARCHAR(100) NOT NULL COMMENT 'perfect_attendance_5, homework_hero, etc.',
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  icon_url VARCHAR(1000) NULL,
  criteria_type VARCHAR(50) NOT NULL COMMENT 'attendance_streak, homework_count, skill_score',
  criteria_value INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_badges_key (institute_id, badge_key),
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
);

CREATE TABLE student_badges (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY,
  institute_id INT NOT NULL,
  student_id INT NOT NULL,
  badge_id INT NOT NULL,
  awarded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  awarded_by_session_id INT NULL,
  UNIQUE KEY uq_student_badge (institute_id, student_id, badge_id),
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

CREATE TABLE streak_counters (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY,
  institute_id INT NOT NULL,
  student_id INT NOT NULL,
  streak_type VARCHAR(50) NOT NULL COMMENT 'attendance, homework',
  current_count INT NOT NULL DEFAULT 0,
  longest_count INT NOT NULL DEFAULT 0,
  last_awarded_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_streak (institute_id, student_id, streak_type),
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

### 6.5 `room_bookings` — Resource Allocation

```sql
CREATE TABLE room_bookings (
  id BIGINT AUTO_RANDOM(8) PRIMARY KEY,
  institute_id INT NOT NULL,
  room_id VARCHAR(50) NOT NULL,
  session_id INT NULL,
  booked_start_at DATETIME NOT NULL,
  booked_end_at DATETIME NOT NULL,
  purpose VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_bookings_time (institute_id, room_id, booked_start_at, booked_end_at),
  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);
```

---

## 7. Indexes สำหรับ Multi-Tenant Queries

> ℹ️ ใช้ `DROP INDEX IF EXISTS` ก่อน `CREATE INDEX` เพื่อให้รันได้ซ้ำโดยไม่ error แต่ระวังว่าการ drop + recreate อาจ lock table ในช่วงสั้นบน production

```sql
DROP INDEX IF EXISTS idx_students_tenant_search ON students;
CREATE INDEX idx_students_tenant_search ON students(institute_id, deleted_at, full_name);

DROP INDEX IF EXISTS idx_courses_tenant_type ON courses;
CREATE INDEX idx_courses_tenant_type ON courses(institute_id, course_type, status);

DROP INDEX IF EXISTS idx_sessions_tenant_time ON sessions;
CREATE INDEX idx_sessions_tenant_time ON sessions(institute_id, scheduled_at, room_id);

DROP INDEX IF EXISTS idx_payments_tenant_date ON payments;
CREATE INDEX idx_payments_tenant_date ON payments(institute_id, paid_at, status);

DROP INDEX IF EXISTS idx_attendances_tenant_session ON attendances;
CREATE INDEX idx_attendances_tenant_session ON attendances(institute_id, session_id, student_id);

DROP INDEX IF EXISTS idx_enrollments_tenant_student ON enrollments;
CREATE INDEX idx_enrollments_tenant_student ON enrollments(institute_id, student_id, course_id);

DROP INDEX IF EXISTS idx_homework_submissions_tenant ON homework_submissions;
CREATE INDEX idx_homework_submissions_tenant ON homework_submissions(institute_id, homework_id, student_id);
```

---

## 8. EF Core / C# ที่ต้องเปลี่ยน

### เปลี่ยน `int` → `long` ในตาราง AUTO_RANDOM

```csharp
public class Attendance
{
    public long Id { get; set; }
    // ...
}
```

### บอก EF Core ไม่ต้องส่ง Id ไปเอง

```csharp
modelBuilder.Entity<Attendance>(entity =>
{
    entity.Property(e => e.Id).ValueGeneratedOnAdd();
});
```

### อัปเดต Models

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `API/Models/Notification.cs` | เพิ่ม queue properties |
| `API/Models/Payment.cs` | เพิ่ม QR/verification properties |
| `API/Models/StudentWallet.cs` | เพิ่ม `CreatedAt`, `Version` |
| `API/Models/WalletTransaction.cs` | เพิ่ม ledger properties |
| `API/Models/Parent.cs` | เพิ่ม `InstituteId`, `IsPrimary`, `IsActive` |
| `API/Models/Student.cs` | เพิ่ม `QrTokenExpiresAt`, `QrTokenVersion` |
| `API/Models/PdpaConsent.cs` | เพิ่ม reference properties |
| `API/Data/TutoringDbContext.cs` | เพิ่ม `DbSet<T>` และ configuration |

### Models ใหม่

- `Lead`
- `PublicWebsiteContent`
- `TeacherPayrollPeriod`
- `Badge`
- `StudentBadge`
- `StreakCounter`
- `RoomBooking`

### Migration

```bash
dotnet ef migrations add EpicReviewSchemaUpdates --project API
dotnet ef database update --project API
```

---

## 9. ลำดับความสำคัญ (อัปเดต)

| Priority | งาน | เหตุผล | สถานะ |
|----------|------|---------|--------|
| ~~P0~~ | ~~เพิ่ม `institute_id` ให้ `parents`~~ | ~~Multi-tenant~~ | ✅ เสร็จแล้ว |
| ~~P0~~ | ~~CHECK `student_wallets.balance >= 0`~~ | ~~ป้องกันติดลบ~~ | ✅ เสร็จแล้ว |
| ~~P0~~ | ~~Rebuild `notifications` เป็น queue~~ | ~~LINE worker~~ | ✅ เสร็จแล้ว |
| ~~P1~~ | ~~Rebuild `payments`~~ | ~~PromptPay + verification~~ | ✅ เสร็จแล้ว |
| ~~P1~~ | ~~สร้าง `badges`, `student_badges`, `streak_counters`~~ | ~~Gamification~~ | ✅ เสร็จแล้ว |
| ~~P1~~ | ~~สร้าง `leads`~~ | ~~Trial booking~~ | ✅ เสร็จแล้ว |
| ~~P1~~ | ~~Rebuild `homework_submissions`, `skill_scores`, `leave_requests`, `makeup_credits` เป็น AUTO_RANDOM~~ | ~~TiDB performance~~ | ✅ เสร็จแล้ว |
| ~~P2~~ | ~~สร้าง `teacher_payroll_periods`~~ | ~~Payroll~~ | ✅ เสร็จแล้ว |
| ~~P2~~ | ~~สร้าง `public_website_contents`~~ | ~~Public CMS~~ | ✅ เสร็จแล้ว |
| ~~P2~~ | ~~สร้าง `room_bookings`~~ | ~~Resource allocation~~ | ✅ เสร็จแล้ว |
| P1 | Cleanup `_old` tables ที่เหลือ | ลบตารางขยะ | ⚠️ ยังเหลือ 4 ตาราง |
| ~~P2~~ | ~~แก้ `institute_id` เป็น `NOT NULL`~~ | ~~`sessions`, `enrollments`~~ | ✅ เสร็จแล้ว |
| P2 | Verify CHECK constraint | `student_wallets.balance >= 0` | ❌ ยังไม่ทำ |

---

## 10. Checklist ก่อน Deploy

- [x] Run pre-check SQL ดู `TIDB_PK_TYPE`
- [x] Backup database ก่อน rebuild ทุกตาราง
- [x] Rebuild ทีละตาราง ตรวจ row count ก่อน/หลัง
- [x] ตรวจสอบ `COALESCE` ไม่ได้ทำ data หาย
- [ ] Cleanup `_old` tables ที่เหลือ (`homework_submissions_old`, `skill_scores_old`, `leave_requests_old`, `makeup_credits_old`)
- [x] แก้ `institute_id` เป็น `NOT NULL` สำหรับ `sessions`, `enrollments`
- [ ] Verify CHECK constraint `student_wallets.balance >= 0`
- [x] Rebuild ตาราง moderate-write ที่เหลือ
- [x] สร้างตารางใหม่ให้ครบ
- [x] อัปเดต C# models ให้ครบ (พร้อม DTOs ที่ใช้งาน)
- [ ] สร้าง migration ใหม่
- [ ] รัน integration tests บน TiDB
- [ ] ตรวจสอบไม่มี `ORDER BY id` ในที่ที่ใช้ AUTO_RANDOM

---

## 11. จุดหยุด Phase 1 → ไปต่อ Phase 2

**Schema ปัจจุบันพร้อมสำหรับ Epic Review แล้ว** ตาม CSV `API\Data\results-2026-08-01-131843.csv`

### สิ่งที่ทำสำเร็จใน Phase 1
- ทุกตาราง rebuild เป็น `BIGINT AUTO_RANDOM(8)` เรียบร้อย
- ตารางใหม่ทั้งหมดถูกสร้างแล้ว (`leads`, `public_website_contents`, `teacher_payroll_periods`, `badges`, `student_badges`, `streak_counters`, `room_bookings`)
- `sessions.institute_id` และ `enrollments.institute_id` เป็น `NOT NULL` แล้ว
- `attendances_old`, `notifications_old`, `wallet_transactions_old` ถูก cleanup ไปแล้ว

### สิ่งที่ยังค้างก่อนเริ่ม Phase 2 (ทำได้ทันทีหรือคู่กันไป)
1. **Cleanup `_old` tables ที่เหลือ 4 ตาราง** — `homework_submissions_old`, `skill_scores_old`, `leave_requests_old`, `makeup_credits_old`
2. **Verify CHECK constraint** บน `student_wallets.balance >= 0`

### Phase 2: อัปเดต EF Core / C# Models
หลังจากนี้ให้โฟกัสที่:

1. แก้ `int Id` → `long Id` ในทุก model ที่ตารางเป็น `AUTO_RANDOM`
2. เพิ่ม properties ใหม่ใน models เดิม (`Notification`, `Payment`, `StudentWallet`, `WalletTransaction`, `Parent`, `Student`, `PdpaConsent`, `Session`)
3. สร้าง models ใหม่ 7 ตัว
4. เพิ่ม `DbSet<T>` และ configuration ใน `TutoringDbContext`
5. สร้าง migration:
   ```bash
   dotnet ef migrations add EpicReviewSchemaUpdates --project API
   dotnet ef database update --project API
   ```

> 📝 ถ้าต้องการให้ช่วยเริ่ม Phase 2 ให้บอกว่าจะให้เริ่มจากไฟล์ไหนก่อน (เช่น `TutoringDbContext.cs` หรือ models)
