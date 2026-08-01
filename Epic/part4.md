📐 TiwHub Work Breakdown - Part 4: Digital Gateway, Academics & School Operations

Author: System Architecture Lead

Target: Product Owners, Engineering Leads, Full-Stack Developers, DBAs, QA Leads

Stack Alignment: TiDB (Distributed SQL) + C# .NET 9.0 + Preact / React (LINE LIFF Compatible)

🎯 EPIC 4: Parent & Student Digital Experience Gateway

ระบบประตูทางเข้าดิจิทัลแบบ Zero-Friction Access สำหรับผู้ปกครองผ่าน LINE Official Account (LINE LIFF) โดยไม่ต้องจำ Password และการสร้างตัวตนดิจิทัล (Digital Identity) ให้แก่นักเรียน

🚀 [Feature 4.1] 📱 Zero-Password Parent Portal (LINE LIFF)

📝 Level 3: User Story 4.1.1

As a: ผู้ปกครอง (Parent)

I want to: ผูกบัญชี LINE เข้ากับข้อมูลลูกในสถาบันโดยการกรอกเบอร์โทรศัพท์เพียงครั้งเดียว

So that: ในการใช้งานครั้งต่อไป ฉันสามารถเปิดดูข้อมูลลูกได้ทันทีจาก Rich Menu ใน LINE โดยไม่ต้องจำ Password

Acceptance Criteria (DoD):

เมื่อเปิด LINE LIFF ครั้งแรก ระบบอ่าน line_user_id และให้กรอกเบอร์โทรศัพท์เพื่อยืนยันตัวตน

เมื่อ Backend ตรวจพบเบอร์โทรศัพท์ตรงกับตาราง parents ระบบบันทึก line_user_id ผูกเข้ากับ Record ทันที

ผู้ปกครองที่มีลูกมากกว่า 1 คน สามารถกดสลับดูข้อมูลน้อง A หรือน้อง B ได้ผ่าน Header Child Switcher โดยไม่ต้อง Logout

การเปิดใช้งานครั้งต่อไป ระบบตรวจสอบ line_user_id และเข้าสู่หน้า Parent Dashboard โดยอัตโนมัติ (Zero-Password)

🛠️ Level 4: Technical Tasks (Dev Tasks)

[FE-010] [P0] Integrate LINE LIFF SDK in Preact/React Web App (4.0 hrs)

Detail: ติดตั้ง @line/liff เรียกใช้ liff.init() ดึง liff.getDecodedIDToken() ส่ง line_user_id ให้ Backend พร้อมจัดการ State Loading/Error

[BE-021] [P0] Implement Parent Line Binding API (POST /api/parents/bind-line) (4.0 hrs)

Detail: รับ phone และ line_user_id ค้นหาข้อมูลในตาราง parents หากพบ ให้ Update line_user_id และออก JWT Token สำหรับ Parent Session

[FE-011] [P1] Build Child Switcher Component in Parent Portal (3.0 hrs)

Detail: UI Dropdown บน Header สำหรับผู้ปกครองที่มีลูกหลายคน สลับ Active student_id ใน Global Context เพื่อดึงข้อมูลลูกคนนั้นๆ

[BE-024] [P1] Implement Multi-Child Dashboard Aggregation API (GET /api/parents/me/dashboard) (4.5 hrs)

Detail: Query ข้อมูลเด็กทุกคนที่ผูกกับ line_user_id ผู้ปกครอง รวบยอด enrollments, attendances ล่าสุด และ homework_submissions ค้างส่งใน Payload เดียว

🚀 [Feature 4.2] 🆔 Student Digital Identity & QR Pass Generator

📝 Level 3: User Story 4.2.1

As a: นักเรียน (Student)

I want to: มีบัตรนักเรียนดิจิทัลที่มี QR Code บนมือถือ หรือพิมพ์เป็นบัตรแข็งได้

So that: ฉันนำไปสแกนเข้าเรียนหน้าประตูได้อย่างสะดวกรวดเร็ว

Acceptance Criteria (DoD):

ระบบ Auto-generate qr_token ฝัง HMAC-SHA256 Hash ประจำตัวเด็กเมื่อถูกเพิ่มเข้าสู่ระบบ

มีหน้าจอ Student Digital Pass บน Web/LIFF แสดงรูป ชื่อ รหัส และ QR Code ประจำตัว

สามารถกดพิมพ์บัตรนักเรียนออกมาเป็นไฟล์ PDF (ขนาดมาตรฐาน CR80) สำหรับสั่งพิมพ์บัตรแข็ง

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-022] [P0] Implement HMAC-SHA256 Signed Token QR Generator Service (3.0 hrs)

Detail: คำนวณ HMAC-SHA256 Token จาก student_id + institute_id + secret_key บันทึกลง students.qr_token เพื่อใช้ Validate ตอน Offline/Online

[BE-023] [P2] Implement PDF Printable Student ID Card Generator Service (QuestPDF) (4.0 hrs)

Detail: Render สเปกบัตรนักเรียนขนาด CR80 ($85.60 \times 53.98\text{ mm}$) เป็น PDF รวม QR Code, รูปโปรไฟล์ และโลโก้สถาบัน

[FE-012] [P1] Build Student Digital Pass UI Component (3.0 hrs)

Detail: UI การ์ดบัตรนักเรียนสไตล์ Modern Solid สลับหน้า-หลัง แสดง QR Code ข้อมูลวิชาเรียน และรูปถ่ายโปรไฟล์

🎯 EPIC 5: Academics, Gamification & Skill Analytics

ยกระดับคุณภาพการเรียนการสอนด้วยการบันทึกพัฒนาการรายบุคคล การส่งการบ้านออนไลน์ และระบบสร้างแรงจูงใจด้วย Gamification

🚀 [Feature 5.1] 📊 Skill Card & Multi-Dimensional Radar Progress

📝 Level 3: User Story 5.1.1

As a: ครูผู้สอน และ ผู้ปกครอง (Teacher & Parent)

I want to: บันทึกและดูการประเมินพัฒนาการของนักเรียนแยกตามหัวข้อบทเรียนเป็นเปอร์เซ็นต์ (Radar Chart)

So that: ครูรู้จุดอ่อนของเด็กรายบุคคล และผู้ปกครองเห็นพัฒนาการการเรียนได้อย่างชัดเจนเป็นรูปธรรม

Acceptance Criteria (DoD):

ครูสามารถสร้างหัวข้อบทเรียน (skill_topics) และกรอกคะแนนความเข้าใจ (skill_scores $0-100\%$) พร้อม Feedback

หน้า Parent Portal แสดงผลคะแนนเป็นกราฟเรดาร์ (Radar Chart / Spider Chart) สวยงาม

ระบบคำนวณคะแนนเฉลี่ยรวมหมวดวิชาให้อัตโนมัติ

🛠️ Level 4: Technical Tasks (Dev Tasks)

[DB-006] [P1] Create skill_topics and skill_scores Tables on TiDB (2.0 hrs)

Detail: สร้างตารางเก็บหัวข้อและคะแนนทักษะ พร้อม UNIQUE INDEX uq_student_topic (student_id, topic_id); บน TiDB

[BE-025] [P1] Implement Batch Skill Scoring API (POST /api/skill-scores/batch) (4.5 hrs)

Detail: รับ Payload คะแนนเด็กยกคลาส บันทึก/อัปเดต (Upsert) ลงตาราง skill_scores ภายใน 1 Transaction

[FE-014] [P1] Build Multi-Dimensional Radar Chart Component using Recharts (4.5 hrs)

Detail: Component แสดงกราฟเรดาร์ความเข้าใจ 5 มิติบน React / LINE LIFF Responsive View

[FE-015] [P1] Build Fast Batch Scoring Input Table for Teachers (3.5 hrs)

Detail: UI ตารางประเมินผลสำหรับครู สามารถกด Tab คีย์บอร์ดเลื่อนกรอกคะแนนเด็กคนถัดไปได้อย่างรวดเร็ว

🚀 [Feature 5.2] 📝 Digital Homework Submission & Review Engine

📝 Level 3: User Story 5.2.1

As a: นักเรียน และ ครู (Student & Teacher)

I want to: ถ่ายรูปส่งการบ้านผ่านมือถือ และให้ครูตรวจพร้อมให้คะแนน/ข้อเสนอแนะกลับมาในระบบได้

So that: ไม่เกิดปัญหาการบ้านหาย และการติดตามงานระหว่างครูกับเด็กทำได้ราบรื่น

Acceptance Criteria (DoD):

ครูสั่งการบ้าน ใส่แนบไฟล์ และกำหนดวันส่ง (due_at)

นักเรียน/ผู้ปกครองถ่ายรูปแนบไฟล์ส่งการบ้านผ่าน LIFF

ครูตรวจงาน ใส่คะแนน คอมเมนต์ และระบบยิง LINE เตือนผลการตรวจกลับหาผู้ปกครอง

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-026] [P1] Implement Digital Homework Assignment & Review Engine APIs (5.5 hrs)

Detail: CRUD APIs สำหรับ homeworks และ homework_submissions พร้อมระบบ Cloud Storage Upload สื่อการสอน/รูปการบ้าน

[FE-016] [P1] Build Homework Camera Capture & Attachment Component (LIFF) (3.5 hrs)

Detail: Component เรียกกล้องมือถือ ถ่ายรูปการบ้าน ทำ Crop/Rotate Compress รูปภาพ แล้วอัปโหลดขึ้น S3/R2

[FE-017] [P1] Build Teacher Grading & Feedback Modal UI (3.5 hrs)

Detail: หน้าต่างสำหรับครูเปิดดูรูปงานที่เด็กส่ง ซูมรูปภาพ ใส่คะแนน และพิมพ์ Feedback

🚀 [Feature 5.3] 🏆 Gamification Engine (Badges & Streaks)

📝 Level 3: User Story 5.3.1

As a: นักเรียน (Student)

I want to: ได้รับเหรียญความสำเร็จ (Badges) และนับจำนวนวันที่มาเรียนตรงเวลาต่อเนื่อง (Streaks)

So that: ฉันเกิดความสนุกสนาน มีแรงจูงใจในการเข้าเรียนตรงเวลาและส่งการบ้านครบ

Acceptance Criteria (DoD):

เมื่อเด็กเช็คชื่อตรงเวลาติดต่อกันครบ 5 ครั้ง ระบบแจก Badge "Perfect Attendance"

แสดงจำนวนวัน Streak ปัจจุบันบนการ์ดนักเรียนใน Student/Parent Portal

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-027] [P2] Implement Streak Counter & Badge Evaluator Logic (4.0 hrs)

Detail: ตรวจสอบประวัติ attendances ล่าสุดเมื่อสแกนเช็คชื่อ หากตรงเวลาติดต่อกัน คำนวณเพิ่ม streak_count และมอบ Badge

[FE-018] [P2] Build Gamification Badges Gallery & Streak Flame UI (3.0 hrs)

Detail: UI แสดงไอคอนเปลวไฟนับ Streak และกล่องเก็บ Badge ความสำเร็จแบบปลดล็อก (Color vs Grayscale)

🎯 EPIC 6: Public Acquisition & School Operations Management

เว็บไซต์ประชาสัมพันธ์สถาบันเพื่อดึงดูดนักเรียนใหม่ พร้อมระบบบริหารจัดการทรัพยากรภายในโรงเรียน

🚀 [Feature 6.1] 🌐 Dynamic Public Website & CMS

📝 Level 3: User Story 6.1.1

As a: เจ้าของสถาบัน (Institute Owner)

I want to: มีเว็บไซต์หน้าบ้านประชาสัมพันธ์สถาบัน แสดงตารางคอร์ส แนะนำครู และผลงานนักเรียน

So that: ผู้ปกครองที่สนใจสามารถค้นพบสถาบันผ่าน Google (SEO) และติดต่อสมัครเรียนได้ง่าย

Acceptance Criteria (DoD):

เว็บไซต์หน้าบ้านแสดงผลสวยงาม รองรับ Responsive Mobile และ SEO Friendly

แอดมินสามารถแก้ไขข้อความ แบนเนอร์ และจัดการผลงานนักเรียนผ่าน Admin CMS ได้

🛠️ Level 4: Technical Tasks (Dev Tasks)

[FE-019] [P1] Build Dynamic Public Landing Page with SSR/SSG (6.0 hrs)

Detail: พัฒนาหน้าเว็บสาธารณะ (/p/[institute_slug]) แสดงแบนเนอร์ แนะนำครู ตารางคอร์ส และแผนที่ Google Maps

[BE-028] [P1] Implement Public Website Content Management APIs (4.0 hrs)

Detail: APIs สำหรับจัดการข้อมูลหน้าบ้าน (CMS) ดึงเฉพาะคอร์สที่มีสถานะ published ออกมาแสดง

🚀 [Feature 6.2] 🎯 Trial Class Booking & Lead Acquisition Pipeline

📝 Level 3: User Story 6.2.1

As a: ผู้ปกครองที่สนใจ (Prospective Parent / Lead)

I want to: กรอกฟอร์มลงทะเบียนขอทดลองเรียนฟรีผ่านเว็บไซต์หน้าบ้านได้

So that: เจ้าหน้าที่สถาบันติดต่อกลับมาแนะนำคอร์สและจัดรอบทดลองเรียนให้ลูกฉันได้

Acceptance Criteria (DoD):

ฟอร์มลงทะเบียนทดลองเรียนบนหน้าเว็บ รับชื่อ เบอร์โทร ชั้นเรียน และวิชาที่สนใจ

ข้อมูลถูกบันทึกเข้าสู่ระบบ Lead Management ใน Admin Dashboard พร้อมแจ้งเตือนแอดมินทาง LINE

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-029] [P1] Implement Public Trial Booking API with Rate Limiting (4.0 hrs)

Detail: API POST /api/public/trial-booking กั้นด้วย Rate Limiter ป้องกัน Spam บันทึก Lead และยิงแจ้งเตือนแอดมิน

[FE-020] [P1] Build Trial Booking Form & Admin Lead Pipeline Kanban Board (4.5 hrs)

Detail: ฟอร์มลงทะเบียนหน้าบ้าน และหน้าบอร์ด Kanban ติดตามสถานะ Lead (New -> Contacted -> Trial -> Enrolled) ใน Admin Panel

🚀 [Feature 6.3] 🏫 Room Booking, Resource Allocation & Payroll

📝 Level 3: User Story 6.3.1

As a: เจ้าของสถาบัน (Institute Owner)

I want to: จัดสรรห้องเรียน/เครื่องคอมพิวเตอร์ และคำนวณค่าตอบแทนครู (Payroll) อัตโนมัติจากชั่วโมงสอนจริง

So that: ป้องกันปัญหาการจัดตารางสอนชนกัน และคิดเงินค่าสอนครูได้อย่างถูกต้องแม่นยำ

Acceptance Criteria (DoD):

ระบบแจ้งเตือนทันทีหากจัดตารางสอนใน room_id เดียวกัน ณ ช่วงเวลาซ้ำซ้อน

ระบบสรุปรายงานชั่วโมงสอนจริงของครูแต่ละคน คูณเรทค่าสอน (hourly_rate) ออกมาเป็นยอด Payroll ประจำเดือน

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-030] [P1] Implement Room Overlap Validation Engine with Time Boundaries (4.0 hrs)

Detail: ตรวจสอบ SQL Time Overlap (start1 < end2) AND (end1 > start2) บน sessions ตารางห้องเรียนก่อน Save

[BE-031] [P1] Implement Teacher Payroll Calculation Engine API (5.0 hrs)

Detail: API คำนวณชั่วโมงสอนจริงจาก sessions.actual_start_at/actual_end_at คูณกับ teachers.hourly_rate สรุปยอดรายเดือน

[FE-021] [P1] Build Room Allocation Calendar & Teacher Payroll Report UI (5.5 hrs)

Detail: UI แสดงผังการใช้ห้องเรียน และตารางสรุปยอดค่าตอบแทนครูพร้อมปุ่ม Export Excel

📊 Summary Estimate: Part 4 (Gateway, Academics & Operations)

Feature

User Stories

Dev Tasks

Estimated Dev Hours (with Buffer & Tests)

Feature 4.1 Zero-Password Parent Portal

1 Story

4 Tasks

15.5 hrs

Feature 4.2 Student Identity & QR Pass

1 Story

3 Tasks

10.0 hrs

Feature 5.1 Skill Card & Radar Progress

1 Story

4 Tasks

14.5 hrs

Feature 5.2 Digital Homework Engine

1 Story

3 Tasks

12.5 hrs

Feature 5.3 Gamification Engine

1 Story

2 Tasks

7.0 hrs

Feature 6.1 Public Website & CMS

1 Story

2 Tasks

10.0 hrs

Feature 6.2 Trial Booking & Lead Pipeline

1 Story

2 Tasks

8.5 hrs

Feature 6.3 Room Allocation & Payroll

1 Story

3 Tasks

14.5 hrs

TOTAL PART 4

8 Stories

23 Tasks

92.5 hrs

📊 Grand Total Estimate: All 4 Parts

Part

Epics Covered

Features Count

User Stories Count

Dev Tasks Count

Total Est. Dev & Test Hours

Part 1

Epic 1: Foundation & Security

4 Features

4 Stories

14 Tasks

48.0 hrs

Part 2

Epic 2: Course Engine & Financials

4 Features

4 Stories

13 Tasks

51.5 hrs

Part 3

Epic 3: Daily Operations & Gate

3 Features

3 Stories

10 Tasks

45.0 hrs

Part 4

Epic 4, 5 & 6: Gateway & School Ops

8 Features

8 Stories

23 Tasks

92.5 hrs

GRAND TOTAL

6 Epics Complete

19 Features

19 Stories

60 Tasks

237.0 hrs