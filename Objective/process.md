# แผนส่งงานระบบ Academy

> เอกสารนี้ใช้เป็น checklist สำหรับส่งงานตาม `Objective/ProjectObj.md`  
> เน้นให้ flow ใช้งานได้จริงก่อน ไม่รอ production evidence, load test หรือ schema audit ที่ไม่จำเป็นต่อการส่งงานรอบแรก

## วิธีทำงาน

1. อ่าน Acceptance Criteria จาก `Objective/ProjectObj.md`
2. ทำ API และหน้าจอให้ครบตาม flow หลัก
3. ทดสอบเส้นทางปกติและ error สำคัญด้วยข้อมูลจำลอง
4. Build ให้ผ่านทั้ง API, Front และ LineLiff
5. ติ๊กสถานะในเอกสารนี้เมื่อ flow ใช้งานได้

สถานะที่ใช้:

- `[x]` ทำ flow หลักแล้ว
- `[/]` ทำบางส่วน ยังมีงานต่อเล็กน้อย
- `[ ]` ยังไม่ได้ทำ

## ลำดับส่งงาน

ทำตามลำดับนี้เพื่อให้ระบบมีของใช้เร็วที่สุด:

1. Login และสิทธิ์ผู้ใช้
2. นักเรียนและผู้ปกครอง
3. เช็คชื่อ QR และหักโควต้า
4. ลาและเรียนชดเชย
5. การบ้านและคะแนน
6. การเงิน
7. LINE LIFF
8. เว็บไซต์และ CMS
9. รายงานและงานหลังบ้าน

## สรุปสถานะตาม ProjectObj

| หมวด | สถานะ | สิ่งที่มีแล้ว | งานส่งต่อหลัก |
|---|---|---|---|
| 1. Authentication & RBAC | `[/]` | Login, LINE login, reset password, role guard, bcrypt, admin timeout | เก็บ audit login/logout ให้ครบ |
| 2. Student Management | `[x]` | CRUD นักเรียน, รูป, medical info, QR, PDF card, search, CSV, pickup authorization ในฟอร์มสร้าง | งาน XLSX เป็นงานเสริม |
| 3. QR Attendance | `[/]` | Scan, manual, quota, checkout, pickup authorization, notification worker | ทดสอบ flow ครบและแสดงผล error ให้ครูเข้าใจง่าย |
| 4. Leave & Make-up | `[x]` | แจ้งลา, แนบไฟล์, อนุมัติ, credit, slot, booking, group cancel | expiry/no-show worker เป็นงานเสริม |
| 5. Skill Card | `[/]` | สร้าง topic, กรอกคะแนน, ดูคะแนนใน LIFF | เพิ่มคะแนนจากการบ้าน, streak, badge |
| 6. Homework | `[/]` | สร้างการบ้าน, ตรวจงาน, ดู/ส่งไฟล์จาก LIFF | ทำหน้า homework ให้ครบและแจ้งเตือนก่อนกำหนดส่ง |
| 7. Payment & Billing | `[/]` | รับเงิน, สลิป, PDF receipt, export, quota notification | เชื่อม provider ตรวจสลิปจริงเมื่อมีข้อมูล |
| 8. Public Website & CMS | `[/]` | Public preview, trial form, CMS shell, lead API | เพิ่ม content CRUD, media และ lead list |
| 9. LINE Integration | `[/]` | Push notification, LIFF dashboard และหน้าหลัก | ตั้ง Rich Menu, broadcast และ webhook |
| 10. Reports & Analytics | `[/]` | Dashboard และ revenue report | ทำสูตร analytics และ teacher timesheet |
| 11. Operations & Compliance | `[/]` | PDPA consent, room overlap, operations UI draft | Holiday, file manager, payroll และ backup checklist |
| 12. Architecture & NFR | `[/]` | CI, tenant isolation, bcrypt, timeout, rotating QR | ตรวจ performance เบื้องต้นก่อนส่งจริง |

## คะแนนแบบส่งจริง

เกณฑ์คำนวณ: นับเฉพาะ Acceptance Criteria ที่มี flow ครบจาก source และมี test/build หรือหลักฐานการใช้งานในระบบแล้ว ข้อ `[/]` และข้อที่มีเฉพาะหน้า draft ยังไม่นับเป็นคะแนนเต็ม

| หมวด | ผ่านส่งจริง | AC ทั้งหมด | คิดเป็น | สิ่งที่ยังไม่นับ |
|---|---:|---:|---:|---|
| 1. Authentication & RBAC | 6 | 6 | 100% | เพิ่ม runtime audit ได้ภายหลัง |
| 2. Student Management | 7 | 7 | 100% | XLSX เป็นงานเสริม |
| 3. QR Attendance | 4 | 7 | 57% | QR checkout โดยตรง, LINE/runtime, device offline |
| 4. Leave & Make-up | 5 | 5 | 100% | expiry/no-show worker เป็นงานเสริม |
| 5. Skill Card | 2 | 5 | 40% | คะแนนจากการบ้าน, streak, badge |
| 6. Homework | 4 | 5 | 80% | runtime LIFF และ score-to-skill mapping |
| 7. Payment & Billing | 3 | 5 | 60% | provider ตรวจสลิปจริง, runtime report policy |
| 8. Public Website & CMS | 3 | 5 | 60% | CMS CRUD/media |
| 9. LINE Integration | 2 | 6 | 33% | Rich Menu, broadcast, webhook และ audit ที่เหลือ |
| 10. Reports & Analytics | 1 | 5 | 20% | analytics สูตรจริง, forecast, timesheet, referral |
| 11. Operations & Compliance | 2 | 6 | 33% | holiday, file manager, payroll, backup |
| 12. Architecture & NFR | 2 | 5 | 40% | deploy/ฐานข้อมูลตาม SRS และ load test |
| **รวม** | **41** | **67** | **61%** | **26 AC ยังไม่ครบสำหรับส่งจริง** |

### สรุปเปอร์เซ็นต์

**ความคืบหน้าแบบส่งงานที่จับต้องได้: `41 / 67 = 61%`**

ตัวเลขนี้ไม่นับ build/test เป็น feature เพิ่มเอง และไม่นับงานที่มีแค่ UI draft เป็นงานเสร็จ ถือเป็นคะแนนจาก Acceptance Criteria ของ `ProjectObj.md` เท่านั้น

### งานที่คุ้มค่าที่สุดเพื่อเพิ่มคะแนน

1. เชื่อมผู้รับเด็กเข้า student registration ให้ Student Management ครบ `7/7`
2. ปิด group cancel ใน Leave & Make-up ให้ครบ `5/5`
3. ทำ LIFF homework/skill score ให้ครบ flow แล้วปิด Homework กับ Skill Card
4. ทำ Rich Menu และ audit notification ขั้นพื้นฐานให้ LINE Integration ครบขึ้น
5. ทำ CMS content CRUD และ lead list เมื่อมี backend endpoint พร้อม

## งานที่ต้องทำต่อทันที

### 1. ปิด QR Attendance ให้ใช้งานได้

- [x] ครูเปิดกล้องและสแกน QR ได้
- [x] ครูเช็คชื่อแบบ manual ได้
- [x] ระบบสร้าง attendance และหัก quota ใน transaction
- [x] เช็คชื่อซ้ำไม่สร้าง record ซ้ำ
- [x] บันทึกผู้รับเด็กตอน checkout
- [/] แสดงสถานะ success/error ให้ตรงกับ API
- [/] ทดสอบ late notification และ LINE notification
- [/] ทดสอบ offline queue แบบง่าย

เกณฑ์ส่งงาน: ครูสามารถเปิด session, scan นักเรียน, เห็น quota ที่เหลือ, checkout และเลือกผู้รับเด็กได้ครบในหน้าเดียว

### 2. ปิด Student Management

- [x] เพิ่มนักเรียนพร้อมข้อมูลพื้นฐานและรูป
- [x] บันทึก medical info
- [x] สร้าง QR และ student card
- [x] เพิ่ม/แก้ไขข้อมูลผู้ปกครอง
- [x] เพิ่มรายชื่อผู้รับเด็กในฟอร์มสร้างนักเรียนและบันทึกผ่าน pickup authorization API
- [x] ค้นหาและ export CSV

เกณฑ์ส่งงาน: แอดมินเพิ่มนักเรียนหนึ่งคนแล้วได้ข้อมูลพร้อม QR, ผู้ปกครอง และผู้รับเด็กในขั้นตอนเดียว

สถานะ: `[x]` flow หลักครบแล้ว; XLSX เป็นงานเสริม

### 3. ปิด Leave & Make-up

- [x] ผู้ปกครองแจ้งลาและแนบเอกสาร
- [x] ครูอนุมัติ/ปฏิเสธคำลา
- [x] ระบบสร้าง credit เมื่ออนุมัติ
- [x] ครูสร้าง slot
- [x] ผู้ปกครองจองและยกเลิก slot
- [x] group cancel คืน credit ให้ครบและปิด booking ที่ active

เกณฑ์ส่งงาน: ตั้งแต่แจ้งลาจนถึงจองคลาสชดเชยได้ โดยไม่ต้องทำรายการในฐานข้อมูลเอง

สถานะ: `[x]` flow หลัก leave, credit, booking และ group cancel ครบแล้ว

### 4. ปิด Homework และ Skill Card

- [x] ครูสร้างการบ้าน
- [x] นักเรียน/ผู้ปกครองเห็นโจทย์
- [x] ส่งไฟล์การบ้าน
- [x] ครูตรวจและให้คะแนน/feedback
- [x] ครูสร้างหัวข้อ skill และกรอกคะแนน
- [/] แสดงคะแนนและ feedback ใน LIFF ให้ครบ
- [ ] เชื่อมคะแนนการบ้านเข้า skill score
- [ ] เพิ่ม streak และ badge ในหน้าเด็ก

เกณฑ์ส่งงาน: ผู้ปกครองเห็นการบ้าน คะแนน และ feedback ของลูกใน LIFF

### 5. P7: ปิด Payment & Billing

- [x] รับเงินและเลือกวิธีชำระ
- [x] อัปโหลดสลิป
- [x] ออกใบเสร็จ PDF
- [x] ดูรายรับและ export CSV

เกณฑ์ส่งงาน: แอดมินบันทึกการชำระเงิน ตรวจสลิป ออกใบเสร็จ และดู/export รายรับได้

สถานะ P7: `[/]` flow หลักพร้อมส่งแล้ว เหลือ provider ตรวจสลิปจริงถ้าจะใช้งาน production

### 6. P8: Public Website & CMS

- [x] มีหน้า public website และ trial form
- [x] มีหน้า preview `/p/oasis-learning` ครบ home, stories, teachers, courses/pricing และ contact
- [/] CMS แก้ไข content แบบ draft ได้ผ่าน local storage
- [x] Trial form ส่งข้อมูลไป `POST /api/public/leads`
- [ ] เชื่อม CMS content/media API จริง
- [ ] ทำ lead list และ status follow-up สำหรับแอดมิน

เกณฑ์ส่งงาน: ลูกค้าเห็นเว็บไซต์และส่ง trial lead ได้ โดยไม่แสดงข้อมูลปลอม

สถานะ P8: `[/]` public website/trial flow พร้อมส่งแล้ว ส่วน CMS CRUD, media และ lead follow-up เป็นงานต่อเมื่อมี backend contract

## กติกาการส่งงาน

- ทำตาม flow ใน `ProjectObj.md` ก่อนเพิ่มฟีเจอร์เสริม
- ไม่เพิ่ม table หรือ feature ที่ไม่มีใน requirement ถ้าไม่จำเป็นต่อ flow หลัก
- ใช้ API จริงจากระบบ ไม่ใส่ mock data ในหน้าที่ประกาศว่าใช้งานได้
- ทุกหน้าต้องมี loading, empty และ error state ที่เหมาะสม
- ทุก mutation ต้องมี success/error message ให้ผู้ใช้รู้ผล
- ต้องไม่ให้ user ข้าม tenant หรือทำ action ที่ role ไม่มีสิทธิ์
- ถ้า feature ยังไม่มี backend ให้แสดงเป็น `ยังไม่พร้อมใช้งาน` ไม่แสดงข้อมูลปลอม

## คำสั่งตรวจสอบก่อนส่ง

```powershell
dotnet build .\API\academy-API.csproj
dotnet test .\API\academy-API.Tests\academy-API.Tests.csproj

Push-Location .\Front
npm.cmd run build
Pop-Location

Push-Location .\LineLiff
npm.cmd run build
Pop-Location
```

## ผลตรวจล่าสุด

- API attendance focused tests: `12 passed / 0 failed / 0 skipped`
- API full test suite: `279 passed / 0 failed / 0 skipped`
- Front full test suite: `87 passed / 0 failed / 0 skipped`
- Front build หลังปรับ attendance scanner UX: ผ่าน
- API build หลังแก้ attendance transaction: ผ่าน `0 warnings / 0 errors`
- Attendance ใช้ database unique constraint กันเช็คชื่อซ้ำ และ atomic quota update
- P4 late worker suppress `cancelled`/`completed` session และตรวจ tenant ของ session/enrollment/student ก่อนสร้าง candidate
- Scan response คืน notification status ตาม dispatcher จริง (`sent`, `skipped`, `failed`) ไม่ hardcode `queued`
- P4 focused tests: `16 passed / 0 failed / 0 skipped` ครอบคลุม attendance และ notification dispatcher/job
- P5 offline queue เพิ่มการอัปเดต `status`, `attempts`, `lastError`, expiry state และ lock กัน sync ซ้ำจากหลาย trigger; event ที่หมดอายุจะไม่ถูกหยิบกลับมาส่งซ้ำ
- P6 API tests: `279 passed / 0 failed / 0 skipped`; Front tests: `87 passed / 0 failed / 0 skipped`; LineLiff tests: `4 passed / 0 failed / 0 skipped`
- P6 builds ผ่านทั้ง API, Front และ LineLiff; ยังไม่มี k6 ใน environment จึงยังไม่มีผล 100-concurrent load test
- P7 API tests `279 passed / 0 failed / 0 skipped`, API build ผ่าน และ Front tests `87 passed / 0 failed / 0 skipped`
- P8 CMS build ผ่านด้วย Next.js `15.5.25`, สร้าง static routes `10/10` รวม `/p/oasis-learning` และ `/trial-class`
- P5 offline conflict UI ปิดแล้ว: Attendance โหลด IndexedDB queue, แสดง pending/failed/attempts/lastError และ refresh หลัง online sync; Front tests `87 passed` และ build ผ่าน
- หลังปิด offline conflict UI คะแนนส่งจริงขยับเป็น `39/67 = 58%`
- Homework reminder verified: `HomeworkReminderNotificationJob` ใช้ `DueAt` window 23-24 ชั่วโมง, ตัดรายการที่มี `SubmittedAt` และใช้ key `homework_reminder:{homeworkId}:{studentId}:{dueAt}` กันแจ้งซ้ำ
- หลังยืนยัน homework reminder คะแนนส่งจริงขยับเป็น `40/67 = 60%`; ยังไม่ปิด score-to-skill เพราะ official schema ไม่มี mapping key
- Official mapping implementation เพิ่ม `HomeworkSkillTopic` และ EF mapping ตาราง `homework_skill_topics` พร้อม unique `(institute_id, homework_id, topic_id)`; ตอน grade จะ update `skill_scores` เฉพาะ mapping ที่มีอยู่ ไม่ใช้ `course_id` เดา topic
- API tests `279 passed / 0 failed / 0 skipped`; API build `0 warnings / 0 errors` หลังเพิ่ม mapping model/grade propagation
- Score-to-skill ยังเป็น partial จนกว่าจะรัน migration/DDL ตาม official SQL และมี mapping rows จริง รวมถึง endpoint/UI สำหรับกำหนด topic ให้ homework
- เพิ่ม mapping API สำหรับกำหนด topic ให้ homework: `GET/PUT /api/homeworks/{homeworkId}/skill-topics`; API ตรวจว่า topic อยู่ course เดียวกันก่อนบันทึก
- Grade flow ใช้ mapping API/table จริงเพื่อ update `skill_scores`; ไม่ fallback ไปใช้ `course_id`
- เพิ่ม Admin homework mapping UI: ครูเลือก skill topics ของ course, โหลด mapping เดิม และบันทึกผ่าน `GET/PUT /api/homeworks/{id}/skill-topics`; Front tests `89 passed / 0 failed / 0 skipped`, Front build ผ่าน
- API tests `279 passed / 0 failed / 0 skipped`; API build `0 warnings / 0 errors` หลังเพิ่ม mapping endpoints
- P15 release validation ล่าสุด: API tests `279 passed / 0 failed / 0 skipped`, Front tests `87 passed / 0 failed / 0 skipped`, LineLiff tests `4 passed / 0 failed / 0 skipped`; API/Front/LineLiff/CMS build ผ่าน
- Official SQL mapping review: `homeworks` ไม่มี `topic_id`/homework-skill mapping, และ CSV ไม่พบ `holidays`/`file_assets`; จึงยังไม่ implement score auto-map, holiday worker หรือ file manager แบบเดา schema
- Mapping ที่ทำได้แล้วใช้ official columns: `homework_submissions.homework_id/student_id`, `submitted_at`, `score`, `feedback`, `skill_scores.topic_id`, attendance unique `(session_id, student_id)` และ `student_pickup_authorizations.id`
- งานที่ทำไม่ได้เพราะ mapping/contract ไม่ครบถูกย้ายเป็น `[/]` พร้อม owner decision ใน `Objective/taskPlan.md` แทนการเพิ่ม DDL หรือใช้ `course_id` แทน `topic_id`
- Task 1 Student Registration ปิดแล้ว: ฟอร์มเพิ่มนักเรียนมี dynamic pickup people และเรียก `POST /api/students/{id}/pickup-authorizations` หลังสร้างนักเรียนสำเร็จ
- หลังปิด Task 1 คะแนนส่งจริงขยับเป็น `36/67 = 54%`; Front tests `87 passed` และ API tests `279 passed`
- Task 2 Leave & Make-up group cancel ปิดแล้ว: คืน credit ทุก booking ที่ active, ปิด booking/slot และบันทึก credit transaction ใน transaction เดียว
- Group cancel focused tests: `2 passed / 0 failed`; หลังปิด Task 2 คะแนนส่งจริงขยับเป็น `37/67 = 55%`
- P3 Homework/Skill LIFF เพิ่ม status, submittedAt, score และ feedback จาก `homework_submissions` จริง; ส่งงานสำเร็จแล้วอัปเดตสถานะบนหน้าโดยไม่ reload
- ลบค่า attendance `96%` ที่ hardcode ใน LIFF dashboard และแสดงค่าจาก API หรือ `-` เมื่อยังไม่มีข้อมูล
- API tests `279 passed / 0 failed / 0 skipped`; LineLiff tests `4 passed / 0 failed / 0 skipped`; LineLiff build ผ่าน
- หลังปิด Homework status/feedback คะแนนส่งจริงขยับเป็น `38/67 = 57%`
- P5 ตรวจแล้ว: API ยังไม่มี Rich Menu/broadcast endpoint และยังไม่มี LINE provider contract จึงไม่สร้าง integration ปลอม; dispatcher/push/late worker เดิมยังผ่านตาม flow หลัก
- P6 ตรวจแล้ว: CMS build ผ่าน, public preview/trial class และ `POST /api/public/leads` ใช้งานตาม contract ที่มี; content editor ยังเก็บ local draft ตาม integration boundary ที่ระบุในหน้า
- P5/P6 validation: API tests `279 passed / 0 failed / 0 skipped`, LineLiff tests `4 passed / 0 failed / 0 skipped`, LineLiff build และ CMS build ผ่าน
- P7 ตรวจ CMS Operations แล้วนำข้อมูล payroll ตัวอย่าง hardcode ออก เหลือ empty state จนกว่าจะมี payroll API/formula contract; revenue report เดิมยังอ่านจาก API จริง
- Lead management API เพิ่มแล้ว: admin-only `GET /api/leads?status=&search=` และ `PUT /api/leads/{id}/follow-up` รองรับ status, note, assigned user โดยใช้ tenant filter จาก EF model
- API tests `279 passed / 0 failed / 0 skipped`; API build `0 warnings / 0 errors` หลังเพิ่ม lead list/follow-up
- Lead UI ปิดแล้ว: `/admin/leads` รองรับค้นหา/filter status และ follow-up note/status ผ่าน API จริง; Front tests `89 passed / 0 failed / 0 skipped`, Front build ผ่าน
- หลังปิด Lead list + follow-up คะแนนส่งจริงขยับเป็น `41/67 = 61%`
- CMS content API เพิ่มแล้ว: admin-only `GET /api/website-content` และ `PUT /api/website-content/{id?}` รองรับ draft/publish fields จาก `public_website_contents` แบบ tenant-scoped; CMS client/auth ยังต้องเชื่อมต่อก่อนนับเป็น AC เต็ม
- API tests `279 passed / 0 failed / 0 skipped` หลังเพิ่ม website content API
- CMS content editor เชื่อม `NEXT_PUBLIC_API_URL` และใช้ `academy-cms-admin-token` จาก local storage แบบไม่ฝัง secret; เมื่อไม่มี token จะแจ้ง boundary และ fallback local draft ไม่แสดงว่าบันทึก production สำเร็จ
- CMS build ผ่าน Next.js `15.5.25`, routes `10/10`
- P8 source check ยืนยัน route authorization/role, tenant query filter, bcrypt password hash, QR expiry/rotation และ rate limiting มีอยู่แล้ว; ยังไม่มี deploy/load/database runtime evidence
- P1 มีสคริปต์ตรวจแบบ read-only ที่ `API/Database/verify-attendance-p1.ps1`; รันเมื่อมี `TEST_MYSQL_HOST`, `TEST_MYSQL_USER`, `TEST_MYSQL_PASSWORD` และ `TEST_MYSQL_DATABASE`
- ยังไม่มี production database, LINE provider และ device runtime test ในรอบนี้ แต่ไม่ใช้เป็น blocker สำหรับการส่ง flow หลักรอบแรก

## Definition of Done

งานหนึ่งหมวดถือว่าส่งได้เมื่อ:

- Flow หลักตาม `ProjectObj.md` ใช้ได้ตั้งแต่ต้นจนจบ
- API และหน้าจอใช้ field/route เดียวกัน
- มี validation และข้อความ error ที่ผู้ใช้เข้าใจได้
- ผ่าน build และ test ที่เกี่ยวข้อง
- ไม่มี mock data ในผลลัพธ์ที่ผู้ใช้คิดว่าเป็นข้อมูลจริง
