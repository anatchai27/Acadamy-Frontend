# Task Plan: แผนส่งงาน Academy แบบใช้งานจริง

> อ้างอิงหลัก: `Objective/ProjectObj.md`  
> สถานะล่าสุด: **35 / 67 AC = 52% แบบส่งจริง**  
> เป้าหมาย: ปิด flow ตาม requirement ให้ครบก่อนทำงานเสริมด้าน production

## กติกาคะแนน

- `[x]` = flow ครบ มี source และมี test/build หรือหลักฐานการใช้งาน
- `[/]` = ทำบางส่วน ยังส่งเป็น flow เต็มไม่ได้
- `[ ]` = ยังไม่ได้ทำ
- ไม่นับ UI draft, mock data หรือเอกสารแทน feature ที่ยังไม่มี flow จริง
- ไม่เพิ่ม table/API/feature ใหม่ ถ้าไม่มี requirement หรือยังไม่มี contract ที่ชัดเจน

## สถานะภาพรวม

| หมวด | ผ่านส่งจริง | ทั้งหมด | เปอร์เซ็นต์ | งานถัดไป |
|---|---:|---:|---:|---|
| 1. Authentication & RBAC | 6 | 6 | 100% | audit runtime เป็นงานเสริม |
| 2. Student Management | 6 | 7 | 86% | เชื่อมผู้รับเด็กในฟอร์มเพิ่มนักเรียน |
| 3. QR Attendance | 3 | 7 | 43% | ปิด flow notification/offline ที่จำเป็น |
| 4. Leave & Make-up | 5 | 5 | 100% | งานเสริม: expiry/no-show worker |
| 5. Skill Card | 2 | 5 | 40% | แสดง LIFF และเชื่อมคะแนนการบ้าน |
| 6. Homework | 2 | 5 | 40% | ปิด LIFF status/badge/reminder |
| 7. Payment & Billing | 3 | 5 | 60% | provider ตรวจสลิปจริงเป็นงานต่อ |
| 8. Public Website & CMS | 2 | 5 | 40% | CMS CRUD/media และ lead list |
| 9. LINE Integration | 2 | 6 | 33% | Rich Menu และ broadcast |
| 10. Reports & Analytics | 1 | 5 | 20% | analytics/timesheet |
| 11. Operations & Compliance | 2 | 6 | 33% | holiday/file/payroll/backup |
| 12. Architecture & NFR | 2 | 5 | 40% | deploy/load test เป็นงานเสริม |
| **รวม** | **35** | **67** | **52%** | **เหลือ 32 AC** |

## ลำดับทำงานต่อ

ทำตามลำดับนี้เพื่อเพิ่มคะแนนเร็วและได้ของที่ผู้ใช้จับต้องได้:

1. **Student Management:** เชื่อม pickup authorization ตอนเพิ่มนักเรียน ปิด `7/7`
2. **Leave & Make-up:** ปิด group cancel และตรวจคืน credit ปิด `5/5`
3. **Homework + Skill Card:** ทำหน้า LIFF ให้เห็น status, score และ feedback ครบ
4. **QR Attendance:** ปิดข้อความ notification/offline ที่ผู้ใช้เห็นจริง
5. **LINE Integration:** ทำ Rich Menu และ broadcast แบบใช้งานได้
6. **CMS:** ทำ content/lead management เมื่อมี backend contract ที่พร้อม
7. **Reports/Operations:** ทำเฉพาะรายงานที่ owner ยืนยันสูตรและข้อมูล

## Task 1: Student Registration + Pickup Authorization

สถานะ: `[x]` ปิด flow เพิ่มนักเรียนพร้อมผู้ปกครองและผู้รับเด็กแล้ว

- [x] ฟอร์มเพิ่มนักเรียนรับข้อมูลพื้นฐาน รูป และ medical info
- [x] API สร้างนักเรียนและคืน QR
- [x] API pickup authorization รองรับการเพิ่ม/แก้ไข/ลบ
- [x] เพิ่มส่วนผู้ปกครองแบบ dynamic ในฟอร์มเดียวกับการเพิ่มนักเรียน
- [x] เพิ่มส่วนรายชื่อผู้รับเด็กแบบ dynamic ในฟอร์มเดียวกัน
- [x] บันทึกนักเรียนและผู้รับเด็กตามลำดับที่ผู้ใช้เข้าใจได้
- [x] แสดง error หากข้อมูลผู้รับเด็กไม่ครบหรือบันทึกไม่สำเร็จ

เกณฑ์จบ: แอดมินเพิ่มนักเรียนหนึ่งคน พร้อมผู้ปกครองและผู้รับเด็กได้จาก flow เดียว แล้วเปิดหน้า profile เห็นข้อมูลครบ

## Task 2: Leave & Make-up Group Cancel

สถานะ: `[x]` group cancel คืน credit และปิด booking ใน transaction แล้ว

- [x] ครูสร้าง makeup slot
- [x] ผู้ปกครองจอง slot ด้วย credit
- [x] ครูยกเลิก slot แบบ group cancel
- [x] คืน credit ให้ทุก booking ที่ยัง active
- [x] เปลี่ยนสถานะ booking และปิด slot ตาม schema ปัจจุบัน
- [x] แสดง error กรณี cancel ซ้ำหรือ slot ไม่มี booking

เกณฑ์จบ: group cancel หนึ่งครั้งคืน credit ครบ และผู้ปกครองเห็นสิทธิ์กลับมาโดยไม่ต้องแก้ฐานข้อมูลเอง

## Task 3: Homework + Skill Card LIFF

สถานะ: `[/]` backend และหน้าหลักมีแล้ว แต่ยังไม่ครบ parent journey

- [x] ครูสร้างการบ้านและตรวจงาน
- [x] ผู้ปกครองดูโจทย์และส่งไฟล์
- [x] ครูสร้าง skill topic และให้คะแนน
- [x] LIFF แสดงสถานะส่งงาน คะแนน และ feedback จาก submission จริง
- [x] แสดงสถานะการบ้านค้างส่ง/ส่งแล้วให้ผู้ปกครองเห็นชัด
- [ ] เชื่อมคะแนนจาก homework submission เข้า skill score
- [ ] เพิ่ม streak และ badge ในหน้าเด็ก

เกณฑ์จบ: ผู้ปกครองเปิด LIFF แล้วเห็นการบ้าน คะแนน feedback และสถานะของลูกได้ใน flow เดียว

## Task 4: QR Attendance ที่ผู้ใช้เห็นจริง

สถานะ: `[/]` check-in/manual/checkout พร้อมแล้ว; notification/offline มี implementation พื้นฐาน

- [x] scan QR และ manual attendance
- [x] หัก quota และกัน attendance ซ้ำ
- [x] checkout พร้อมเลือกผู้รับเด็ก
- [x] error mapping และกันกดซ้ำ
- [ ] แสดง notification status ที่ผู้ใช้เข้าใจได้
- [ ] offline queue แสดง pending/failed/expired ให้ครูเห็น
- [ ] ทดสอบ late notification กับข้อมูลตัวอย่าง

เกณฑ์จบ: ครูเช็คเข้า/ออกได้ เห็นผลสำเร็จหรือ error ชัดเจน และไม่เกิด attendance/quota ซ้ำ

## Task 5: LINE และ Notification

สถานะ: `[/]` push และ dispatcher มีแล้ว

- [x] check-in/checkout ส่งผ่าน dispatcher
- [x] late worker suppress session ที่ไม่ควรแจ้ง
- [x] retry และ notification status พื้นฐาน
- [ ] ตั้ง Rich Menu ให้เข้า LIFF ได้
- [ ] ทำ broadcast สำหรับห้องเรียนที่เลือก
- [ ] ตรวจข้อความและ recipient จาก flow จริง

## Task 6: CMS และ Trial Lead

สถานะ: `[/]` public website/trial flow พร้อม, CMS ยังเป็น local draft

- [x] public preview และ responsive pages
- [x] trial form ส่ง `POST /api/public/leads`
- [x] CMS draft editor ไม่แสดงข้อมูลปลอม
- [ ] เพิ่ม content CRUD เมื่อมี API
- [ ] เพิ่ม media upload เมื่อมี storage contract
- [ ] เพิ่มหน้า lead list/status สำหรับแอดมิน

## Task 7: Reports และ Operations

สถานะ: `[ ]` ทำหลัง flow หลักด้านบน

- [ ] ยืนยันสูตร Renewal Rate, Churn Risk และ Revenue Forecast
- [ ] ทำ Teacher Timesheet และ export
- [ ] ทำ Holiday Calendar ที่ worker ใช้จริง
- [ ] ทำ File Manager และสิทธิ์ไฟล์
- [ ] ทำ Payroll ตามสูตรที่ owner ยืนยัน
- [ ] ตรวจ backup schedule

## ตรวจสอบก่อนปิดแต่ละ task

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

## สิ่งที่ไม่ทำตอนนี้

- ไม่เพิ่ม server idempotency table เพื่อปิดคะแนนแบบเอกสาร
- ไม่เพิ่ม QR checkout endpoint ถ้า list-assisted checkout ยังตอบ requirement ได้
- ไม่เพิ่ม signed QR, holiday table หรือ analytics formula โดยไม่มี owner decision
- ไม่ถือ load test, schema export หรือ unit test เพียงอย่างเดียวว่า feature ผ่าน
- ไม่ทำ mock data แทน API จริง

## Definition of Done

Task หนึ่งข้อจบเมื่อ:

- Flow ตาม `ProjectObj.md` ใช้ได้ตั้งแต่ต้นจนจบ
- API/UI ใช้ route และ field ตรงกัน
- มี loading, empty, validation และ error state
- ผ่าน test/build ที่เกี่ยวข้อง
- ผู้ใช้ทำงานได้โดยไม่ต้องแก้ฐานข้อมูลเอง
- อัปเดตสถานะและคะแนนใน `Objective/process.md`
