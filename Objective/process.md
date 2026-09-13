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
| 2. Student Management | `[/]` | CRUD นักเรียน, รูป, medical info, QR, PDF card, search, CSV | เชื่อมผู้รับเด็กในฟอร์มเพิ่มนักเรียน |
| 3. QR Attendance | `[/]` | Scan, manual, quota, checkout, pickup authorization, notification worker | ทดสอบ flow ครบและแสดงผล error ให้ครูเข้าใจง่าย |
| 4. Leave & Make-up | `[/]` | แจ้งลา, แนบไฟล์, อนุมัติ, credit, slot, booking, cancel | เก็บ flow group cancel ให้เรียบร้อย |
| 5. Skill Card | `[/]` | สร้าง topic, กรอกคะแนน, ดูคะแนนใน LIFF | เพิ่มคะแนนจากการบ้าน, streak, badge |
| 6. Homework | `[/]` | สร้างการบ้าน, ตรวจงาน, ดู/ส่งไฟล์จาก LIFF | ทำหน้า homework ให้ครบและแจ้งเตือนก่อนกำหนดส่ง |
| 7. Payment & Billing | `[/]` | รับเงิน, สลิป, PDF receipt, export, quota notification | เชื่อม provider ตรวจสลิปจริงเมื่อมีข้อมูล |
| 8. Public Website & CMS | `[/]` | Public preview, trial form, CMS shell, lead API | เพิ่ม content CRUD, media และ lead list |
| 9. LINE Integration | `[/]` | Push notification, LIFF dashboard และหน้าหลัก | ตั้ง Rich Menu, broadcast และ webhook |
| 10. Reports & Analytics | `[/]` | Dashboard และ revenue report | ทำสูตร analytics และ teacher timesheet |
| 11. Operations & Compliance | `[/]` | PDPA consent, room overlap, operations UI draft | Holiday, file manager, payroll และ backup checklist |
| 12. Architecture & NFR | `[/]` | CI, tenant isolation, bcrypt, timeout, rotating QR | ตรวจ performance เบื้องต้นก่อนส่งจริง |

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
- [/] เพิ่มรายชื่อผู้รับเด็กในฟอร์มสร้างนักเรียน
- [x] ค้นหาและ export CSV

เกณฑ์ส่งงาน: แอดมินเพิ่มนักเรียนหนึ่งคนแล้วได้ข้อมูลพร้อม QR, ผู้ปกครอง และผู้รับเด็กในขั้นตอนเดียว

### 3. ปิด Leave & Make-up

- [x] ผู้ปกครองแจ้งลาและแนบเอกสาร
- [x] ครูอนุมัติ/ปฏิเสธคำลา
- [x] ระบบสร้าง credit เมื่ออนุมัติ
- [x] ครูสร้าง slot
- [x] ผู้ปกครองจองและยกเลิก slot
- [/] group cancel คืน credit ให้ครบ

เกณฑ์ส่งงาน: ตั้งแต่แจ้งลาจนถึงจองคลาสชดเชยได้ โดยไม่ต้องทำรายการในฐานข้อมูลเอง

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

### 5. ปิด Payment และ Public Website

- [x] รับเงินและเลือกวิธีชำระ
- [x] อัปโหลดสลิป
- [x] ออกใบเสร็จ PDF
- [x] ดูรายรับและ export CSV
- [x] มีหน้า public website และ trial form
- [/] CMS แก้ไข content แบบ draft ได้
- [ ] เชื่อม CMS content/media API จริง
- [ ] ทำ lead list สำหรับแอดมิน

เกณฑ์ส่งงาน: ลูกค้าเห็นเว็บไซต์ ส่ง trial lead ได้ และแอดมินบันทึก/ตรวจการชำระเงินได้

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
- P1 มีสคริปต์ตรวจแบบ read-only ที่ `API/Database/verify-attendance-p1.ps1`; รันเมื่อมี `TEST_MYSQL_HOST`, `TEST_MYSQL_USER`, `TEST_MYSQL_PASSWORD` และ `TEST_MYSQL_DATABASE`
- ยังไม่มี production database, LINE provider และ device runtime test ในรอบนี้ แต่ไม่ใช้เป็น blocker สำหรับการส่ง flow หลักรอบแรก

## Definition of Done

งานหนึ่งหมวดถือว่าส่งได้เมื่อ:

- Flow หลักตาม `ProjectObj.md` ใช้ได้ตั้งแต่ต้นจนจบ
- API และหน้าจอใช้ field/route เดียวกัน
- มี validation และข้อความ error ที่ผู้ใช้เข้าใจได้
- ผ่าน build และ test ที่เกี่ยวข้อง
- ไม่มี mock data ในผลลัพธ์ที่ผู้ใช้คิดว่าเป็นข้อมูลจริง
