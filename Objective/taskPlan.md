# Task Plan: Academy Delivery 15P

> อ้างอิง requirement: `Objective/ProjectObj.md`  
> สถานะล่าสุด: **40 / 67 AC = 60% แบบส่งจริง**  
> วิธีทำงาน: ทำ flow ที่ผู้ใช้จับต้องได้ก่อน, ไม่ทำ mock แทน API จริง และไม่เพิ่ม schema/feature ที่ไม่มี contract

## เกณฑ์สถานะ

- `[x]` flow ครบ มี source และผ่าน test/build หรือมีหลักฐานการใช้งาน
- `[/]` มีบางส่วน แต่ยังส่งเป็น flow เต็มไม่ได้
- `[ ]` ยังไม่เริ่มหรือยังไม่มีหลักฐานพอ

## แผน 15P

### P1: Baseline และ Scope Lock

สถานะ: `[x]`

- [x] อ่าน AC ทั้ง 67 ข้อจาก `ProjectObj.md`
- [x] แยกงานที่ส่งจริงออกจากงาน draft/งานเสริม
- [x] ล็อก contract หลักของ attendance, error, role และ tenant
- [x] กำหนดคะแนนล่าสุด `39/67 = 58%`

เกณฑ์จบ: ทุกงานถัดไปอ้าง requirement และไม่ขยาย scope เอง

### P2: Authentication และ RBAC

สถานะ: `[x]`

- [x] Login/logout และ password reset
- [x] bcrypt password hashing
- [x] Role guard สำหรับ admin/teacher/parent/student
- [x] Session timeout และ route authorization
- [x] LINE parent binding flow

เกณฑ์จบ: ผู้ใช้ login ได้และทำได้เฉพาะ action ตาม role/tenant

### P3: Student Registration

สถานะ: `[x]`

- [x] เพิ่ม/แก้ไข/ค้นหานักเรียน
- [x] รูป, medical info, QR และ student card
- [x] เพิ่มผู้ปกครองในฟอร์มเดียว
- [x] เพิ่ม pickup authorization ในฟอร์มเดียว
- [x] Export CSV

เกณฑ์จบ: แอดมินเพิ่มนักเรียนพร้อมผู้ปกครองและผู้รับเด็กได้จาก flow เดียว

### P4: QR Attendance Core

สถานะ: `[/]`

- [x] Scan QR และ manual attendance
- [x] Validate session, tenant, quota และ duplicate
- [x] Atomic quota update ใน transaction
- [x] Checkout แบบ list-assisted พร้อม pickup authorization
- [x] Error mapping และกัน double click
- [ ] QR checkout โดยตรง ถ้า owner ยืนยันว่าจำเป็น

เกณฑ์จบ: ครูเช็คเข้า/ออกได้และ attendance/quota ไม่ซ้ำ

### P5: Attendance Notification และ Offline

สถานะ: `[/]`

- [x] Check-in/checkout dispatcher
- [x] Late worker 20 นาที และ suppress cancelled/completed
- [x] Notification status `sent/skipped/failed`
- [x] Offline queue พร้อม attempts/error/expiry/sync lock
- [x] แสดง queue conflict ในหน้าครูให้ครบ
- [ ] ทดสอบ LINE/device runtime จริง

เกณฑ์จบ: ผู้ใช้รู้ว่ารายการถูกส่ง, รอ sync หรือผิดพลาด และไม่มี notification ซ้ำแบบง่าย

### P6: Leave Request

สถานะ: `[x]`

- [x] ผู้ปกครองแจ้งลา
- [x] แนบไฟล์
- [x] ครูอนุมัติ/ปฏิเสธ
- [x] สร้าง makeup credit หลังอนุมัติ

เกณฑ์จบ: แจ้งลาและอนุมัติได้โดยไม่แก้ฐานข้อมูลเอง

### P7: Make-up Booking

สถานะ: `[x]`

- [x] ครูสร้าง slot
- [x] ผู้ปกครองดู credit และจอง slot
- [x] กัน slot เต็ม/credit หมด/booking ซ้ำ
- [x] ยกเลิก booking และคืน credit
- [x] Group cancel คืน credit ทุก booking ที่ active

เกณฑ์จบ: leave ถึง booking makeup ได้ครบตั้งแต่ต้นจนจบ

### P8: Homework

สถานะ: `[/]`

- [x] ครูสร้างการบ้าน
- [x] ผู้ปกครองดูโจทย์
- [x] ส่งไฟล์จาก LIFF
- [x] แสดง submitted status, score และ feedback
- [x] แจ้งเตือนก่อนกำหนดส่งจากข้อมูลจริง: worker ใช้ `due_at`, `submitted_at` และ idempotency key
- [/] เชื่อม score เข้า skill score: เพิ่ม EF model, official mapping, mapping API และ Admin UI แล้ว เหลือ migration/runtime data

เกณฑ์จบ: ผู้ปกครองเห็นโจทย์ ส่งงาน และเห็นผลตรวจในหน้าเดียว

### P9: Skill Card และ Progress

สถานะ: `[/]`

- [x] ครูสร้าง skill topic
- [x] ครูกรอก score/note
- [x] ผู้ปกครองดู score และ feedback ใน LIFF
- [/] รวม score จาก homework: grade จะ update mapped `skill_scores`; เหลือ populate mapping และ runtime verification
- [/] เพิ่ม streak และ badge จากข้อมูลจริง: model/schema มีแล้ว แต่ยังต้องกำหนด event และ badge criteria

เกณฑ์จบ: คะแนนทักษะของเด็กแสดงจาก API จริงและติดตามพัฒนาการได้

### P10: Payment และ Billing

สถานะ: `[/]`

- [x] รับ payment และอัปโหลด slip
- [x] ออก receipt PDF
- [x] Revenue report และ CSV export
- [x] Payment notification dispatcher
- [ ] เชื่อม slip provider จริงเมื่อมี contract/credentials

เกณฑ์จบ: แอดมินบันทึก ตรวจ และออกหลักฐานการเงินได้

### P11: Public Website และ Trial Lead

สถานะ: `[/]`

- [x] Public institute preview
- [x] Responsive pages
- [x] Trial class form
- [x] `POST /api/public/leads` พร้อม validation/rate limit
- [/] Lead list และ follow-up status สำหรับแอดมิน: API พร้อมแล้ว เหลือ CMS admin UI

เกณฑ์จบ: ลูกค้าเห็นเว็บไซต์และส่ง lead เข้า API จริงได้

### P12: CMS Content และ Media

สถานะ: `[/]`

- [x] Local draft editor ไม่แสดงข้อมูลปลอม
- [x] Preview public content
- [ ] Content CRUD API
- [ ] Media upload/storage
- [ ] Tenant/permission/signed-link policy

เกณฑ์จบ: แอดมินแก้ content แล้ว publish ไป public page ผ่าน API จริง

### P13: LINE Integration

สถานะ: `[/]`

- [x] Parent LINE binding
- [x] Push ผ่าน notification dispatcher
- [x] LIFF dashboard/homework/score/leave flows
- [ ] Rich Menu พร้อม URL และ provider config จริง
- [ ] Broadcast กลุ่มพร้อม recipient/consent/audit
- [ ] Webhook และ retry evidence

เกณฑ์จบ: ผู้ปกครองเข้า LIFF จาก LINE และรับข้อความจาก flow จริง

### P14: Reports และ Operations

สถานะ: `[/]`

- [x] Revenue report จาก API
- [ ] Renewal rate/churn risk/forecast พร้อมสูตรที่ owner ยืนยัน
- [ ] Teacher timesheet/export
- [/] Holiday calendar ที่ worker ใช้จริง: official CSV ยังไม่พบตาราง `holidays`
- [/] File manager แบบ tenant-scoped: official CSV ยังไม่พบตาราง `file_assets`
- [ ] Payroll จาก actual hours/rate ที่อนุมัติ
- [ ] Backup schedule/checklist

เกณฑ์จบ: รายงานที่ส่งให้ owner มีสูตร, source และช่วงเวลาอ้างอิงชัดเจน

### P15: Release Acceptance

สถานะ: `[/]`

- [x] API full tests ผ่าน
- [x] Front/LineLiff/CMS build ผ่าน
- [x] ไม่มี mock data ใน flow ที่ประกาศว่าส่งได้
- [x] Release validation ล่าสุดรัน API/Front/LineLiff/CMS แล้ว
- [ ] Run smoke test ตาม user journey จริง
- [ ] ตรวจ database metadata กับ test DB
- [ ] ทดสอบ device/LINE provider จริง
- [ ] owner sign-off รายการ AC ที่เหลือ

เกณฑ์จบ: ส่งมอบได้โดยมีรายการ known gaps และ owner ยอมรับอย่างชัดเจน

## ลำดับลงมือรอบถัดไป

1. ปิด P5 offline conflict UI และ late notification sample
2. ปิด P8 homework reminder หรือเชื่อม score เข้า P9
3. ปิด P9 score จาก homework
4. ปิด P11 lead list ถ้ามี admin endpoint พร้อม
5. ทำ P13 Rich Menu เมื่อมี LINE provider config
6. ทำ P14 reports/operations เฉพาะสูตรที่ owner อนุมัติ
7. ปิด P15 smoke test และ owner acceptance

## คำสั่งตรวจสอบ

```powershell
dotnet test .\API\academy-API.Tests\academy-API.Tests.csproj
dotnet build .\API\academy-API.csproj

Push-Location .\Front
npm.cmd test -- --run
npm.cmd run build
Pop-Location

Push-Location .\LineLiff
npm.cmd test -- --run
npm.cmd run build
Pop-Location

Push-Location .\CMS
npm.cmd run build
Pop-Location
```

## Definition of Done

P หนึ่งข้อจะปิดได้เมื่อ:

- Flow ตาม `ProjectObj.md` ใช้ได้ตั้งแต่ต้นจนจบ
- API/UI ใช้ route และ field ตรงกัน
- มี validation, loading, empty และ error state
- ผ่าน test/build ที่เกี่ยวข้อง
- ไม่ใช้ mock data แทนข้อมูลจริง
- ผู้ใช้ทำงานได้โดยไม่ต้องแก้ database เอง
- อัปเดตคะแนนใน `Objective/process.md`

## Official SQL Mapping Blockers

อ้างอิง `Objective/sql_script.md`, `Objective/erProjec.md` และ schema CSV ล่าสุด ห้ามแก้ด้วยการเดา mapping:

| งาน | สิ่งที่ official schema มี | สิ่งที่ยังขาด | วิธีปลดล็อก |
|---|---|---|---|
| Homework -> Skill Score | `homeworks.course_id`, `skill_topics.course_id`, `skill_scores.topic_id` | ไม่มี `homeworks.topic_id` หรือ homework-skill mapping table | Owner เลือก `topic_id` ใน homework หรืออนุมัติ mapping table |
| Holiday worker | `sessions`, `notifications` | ไม่พบ `holidays` | Owner ยืนยัน source วันหยุดหรืออนุมัติ table |
| File manager | upload flow และ URL บาง entity | ไม่พบ `file_assets` official | Owner ยืนยัน storage table/provider และ signed-link policy |
| LINE Rich Menu/Broadcast | `users.line_user_id`, `notifications` | ไม่มี provider contract/recipient consent/audit rule ครบ | ให้ LINE channel config และ broadcast contract |
| Payroll | มี `teachers.hourly_rate`, payroll model | ยังไม่มี approved actual-hours source/period rule | Owner ยืนยันสูตรและ source ของเวลาสอน |

สิ่งที่ห้ามทำเพื่อปิด task แบบหลอก:

- ห้ามใช้ `course_id` เป็น `topic_id` แทน mapping ของ homework
- ห้ามสร้างวันหยุดจาก hardcode ใน worker
- ห้ามสร้าง file URL โดยไม่มี storage object และ permission policy
- ห้ามแสดง payroll/analytics ตัวอย่างเป็นข้อมูลจริง

เมื่อมี mapping/contract แล้ว ให้เพิ่ม model + EF `HasColumnName`/relation ให้ตรง official schema ก่อนเขียน service/query และเพิ่ม test ที่พิสูจน์ tenant กับ ownership ทุกครั้ง
