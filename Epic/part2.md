📐 TiwHub Work Breakdown - Part 2: Flexible Course Engine & Financial Core Ecosystem

Author: Senior System Analyst (Zero-Trust Architecture Lead)

Target: Product Owners, Engineering Leads, Full-Stack Developers, DBAs, QA Leads

Stack Alignment: TiDB (Distributed SQL) + C# .NET 9.0 + Preact / React (LINE LIFF)

🎯 EPIC 2: Flexible Course Engine & Multi-Model Financial Ecosystem

สถาปัตยกรรมคอร์สเรียนแบบยืดหยุ่น (Polymorphic Course Engine) รองรับ 5 โมเดลธุรกิจ พร้อมระบบกระเป๋าเงินเครดิตกลาง (Credit Wallet) และ Ledger บันทึกประวัติการเงินแบบ Immutable ด้วยกลไกความปลอดภัยระดับ Core Banking

🚀 [Feature 2.1] 🧩 Polymorphic Course Engine (5 Business Models)

📝 Level 3: User Story 2.1.1

As a: แอดมินสถาบัน (Institute Admin)

I want to: สร้างคอร์สเรียนได้ 5 รูปแบบ (Fixed Group, Flexible Private, Subscription, Video On-Demand, Credit Wallet)

So that: สถาบันสามารถตั้งราคาขายและจัดตารางเรียนได้ครอบคลุมทุกโมเดลธุรกิจในตลาดกวดวิชา

Acceptance Criteria (DoD):

ฟอร์มสร้างคอร์สแสดง Dropdown เลือก course_type และทำ Conditional Rendering ปรับเปลี่ยนฟิลด์กรอกข้อมูลตามประเภทคอร์สโดยอัตโนมัติ (State-Driven Form)

คอร์สประเภท group บังคับระบุ total_sessions และ teacher_id

คอร์สประเภท private และ video ยอมให้ teacher_id และ total_sessions เป็น NULL ได้ (ไปเลือกครูตอนจองตาราง)

คอร์สประเภท subscription บังคับระบุ expires_in_days โดยไม่จำกัดจำนวนคาบเรียน

คอร์สประเภท credit บังคับระบุ credit_cost (จำนวนแต้มที่ใช้สแกนเข้าเรียนต่อคาบ)

Backend ทำงานผ่าน Polymorphic FluentValidation หากส่งฟิลด์ข้ามประเภทมา ต้องปฏิเสธ Request ด้วย 400 Bad Request ทันที

🛠️ Level 4: Technical Tasks (Dev Tasks)

[DB-003] [P0] TiDB Polymorphic Courses Schema Alterations & Nullable Constraints (2.5 hrs)

Detail: รัน SQL DDL เพิ่มคอลัมน์ course_type (ENUM), expires_in_days, require_computer, credit_cost ในตาราง courses และปรับ total_sessions, teacher_id ให้เป็น NULLABLE

[BE-008] [P0] Implement Polymorphic FluentValidation & DTO Handlers in .NET 9 (5.5 hrs)

Detail: เขียน CreateCourseRequestValidator แยก Rule-based Validation ตาม CourseType ปฏิเสธ Payload ที่ส่งฟิลด์ข้ามประเภทด้วย 400 Bad Request

[FE-004] [P0] Build Dynamic State-Driven Course Form Component (Preact/React) (4.5 hrs)

Detail: พัฒนาหน้าจอสร้างคอร์ส ใช้ State Machine ควบคุมการซ่อน/แสดงฟิลด์ตาม course_type ที่เลือก เพื่อลด Cognitive Overload และป้องกัน User กรอกข้อมูลผิดสเปก

🚀 [Feature 2.2] 🏦 Multi-Tenant Credit Wallet & Ledger Engine

📝 Level 3: User Story 2.2.1

As a: ผู้ปกครอง และ นักเรียน (Parent & Student)

I want to: มีกระเป๋าเงินเครดิตกลาง (Credit Wallet) สำหรับเติมแต้ม เช็คยอดคงเหลือ และดูประวัติการหักแต้มเข้าเรียน

So that: ฉันรับรู้สถานะการเรียนและวางแผนซื้อแพ็กเกจเครดิตเติมเพิ่มได้ทันเวลา โดยยอดแต้มไม่มีวันติดลบหรือสูญหาย

Acceptance Criteria (DoD):

ยอดเครดิตคงเหลือดึงมาจากตาราง student_wallets และแสดงผลบน Parent/Student Portal

ทุกการตัดแต้มหรือเติมแต้ม ต้องสร้าง Record ใหม่ในตาราง wallet_transactions เสมอ (Immutable Ledger Trail)

กระบวนการหักแต้มต้องหุ้มด้วย Database Transaction และใช้ Row-Level Locking (SELECT ... FOR UPDATE)

ยอดเงินคงเหลือไม่มีวันติดลบเด็ดขาด แม้จะสแกนเข้าเรียนพร้อมกันหลายเครื่องในเสี้ยววินาทีเดียวกัน (Overdraft Protection)

🛠️ Level 4: Technical Tasks (Dev Tasks)

[DB-004] [P0] Apply TiDB AUTO_RANDOM & CHECK Constraint on Wallets (2.0 hrs)

Detail: ปรับตั้งค่า Primary Key ตาราง wallet_transactions เป็น AUTO_RANDOM เพื่อป้องกัน Write Hotspot บน TiKV Nodes และเพิ่ม CONSTRAINT chk_positive_balance CHECK (balance >= 0);

[BE-009] [P0] Implement Atomic Credit Mutation Engine with Pessimistic DB Locking (6.0 hrs)

Detail: พัฒนา Endpoint ตัด/เติมเครดิต เปิด IDbContextTransaction สั่ง Raw SQL SELECT * FROM student_wallets WHERE student_id = ? FOR UPDATE ป้องกัน Race Condition 100%

[FE-005] [P1] Build Wallet Balance Card & Transaction History Component (3.5 hrs)

Detail: Component แสดง Balance เครดิต, Badge เตือนเมื่อแต้มต่ำกว่า 5 แต้ม, และรายการเคลื่อนไหว (เติมแต้มเป็นสีเขียว / ตัดแต้มเป็นสีแดง) พร้อม Infinity Scroll

[QA-003] [P0] Write Concurrency & Race Condition Tests for Credit Wallet (4.0 hrs)

Detail: เขียน Integration Test จำลอง Concurrent Requests 20 Threads ยิงหักเครดิตพร้อมกันในเสี้ยววินาทีเดียว ยืนยันว่า Balance หักถูกต้องและไม่มีทางติดลบ

🚀 [Feature 2.3] 🧾 Billing, Automated Invoicing & PDF Receipts

📝 Level 3: User Story 2.3.1

As a: พนักงานเคาน์เตอร์ (Counter Staff)

I want to: ออกบิลรับชำระเงินค่าเรียน/ค่าสินค้า และ พิมพ์ใบเสร็จ PDF ส่งเข้า LINE ผู้ปกครองได้ทันที

So that: กระบวนการชำระเงินถูกต้อง รวดเร็ว และมีหลักฐานทางบัญชีมอบให้แก่ผู้ปกครอง

Acceptance Criteria (DoD):

พนักงานเลือกนักเรียน คอร์สเรียน หรือสินค้าเสริม (products) และคำนวณยอด net_amount (หักส่วนลด discount_amount)

ระบบ Auto-generate เลขที่ใบเสร็จ (invoice_no เช่น INV-202607-0001) โดยไม่ซ้ำซ้อนแม้ยิงพร้อมกัน

ระบบสร้างไฟล์ PDF ใบเสร็จที่มีโลโก้ ชื่อสถาบัน เลขภาษี และส่งลิงก์ดาวน์โหลดเข้า LINE ผู้ปกครองอัตโนมัติ

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-010] [P0] Implement Sequential Invoice Number Generator with Redis Lock (4.5 hrs)

Detail: ใช้ Redis Distributed Lock บล็อก Key invoice_seq:{institute_id}:{yyyyMM} เพื่อสร้างเลขบิล INV-{YYYYMM}-{SEQ} เรียงลำดับถูกต้อง ไม่ซ้ำซ้อนตอนยิงพร้อมกัน

[BE-011] [P1] Implement PDF Receipt Generation & Cloud Storage Upload Service (4.0 hrs)

Detail: ใช้ QuestPDF Render Template ใบเสร็จรับเงินขนาด A5/A4 บันทึกลง Cloud Storage (S3/R2) แล้ว คืนค่า Public Signed URL

[FE-006] [P0] Build POS Billing & Checkout Form Component (4.5 hrs)

Detail: หน้าจอ Point-of-Sale (POS) เลือกนักเรียน เลือกคอร์ส/สินค้า คำนวณส่วนลด เลือกช่องทางชำระเงิน และแสดงปุ่ม Print/Download PDF ใบเสร็จ

🚀 [Feature 2.4] 🤖 Payment Gateway & AI Slip Verification

📝 Level 3: User Story 2.4.1

As a: ผู้ปกครอง (Parent)

I want to: ชำระเงินผ่าน PromptPay QR Code และแนบรูปสลิปโอนเงินเพื่อให้ระบบตรวจสอบอัตโนมัติ

So that: ยอดชำระได้รับการอนุมัติทันทีโดยไม่ต้องรอพนักงานเคาน์เตอร์มาตรวจสอบด้วยมือ

Acceptance Criteria (DoD):

หน้าชำระเงินสร้าง Dynamic PromptPay QR Code ตามยอดเงินสุทธิ (net_amount)

เมื่อผู้ปกครองแนบรูปสลิป ระบบส่งไปตรวจสอบผ่าน EasySlip/SlipOK API (ตรวจสอบยอดเงิน, บัญชีปลายทาง, และเลขสลิป)

หากสลิปถูกต้อง ระบบเปลี่ยนสถานะ Payment เป็น completed และเพิ่มโควต้า/เครดิตเรียนให้อัตโนมัติ

หากมีการนำสลิปเดิมมาวนใช้ซ้ำ (Replay Attack) ระบบต้องปฏิเสธและแจ้งเตือนทันที

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-012] [P1] Implement Dynamic PromptPay EMVCo Payload Generator Service (2.5 hrs)

Detail: เขียน C# Helper คำนวณ CRC16 EMVCo PromptPay Payload จาก PromptPay ID สถาบันและยอดเงินสุทธิ

[BE-013] [P0] Integrate AI Slip Verification API with Replay Protection (4.5 hrs)

Detail: เชื่อมต่อ EasySlip API เช็ค gateway_ref_id กับตาราง payments ป้องกันการนำสลิปโอนเงินเดิมมาสแกนซ้ำ (Replay Attack)

[FE-007] [P1] Build PromptPay & Slip Upload Modal Component (LIFF) (3.5 hrs)

Detail: UI บน LINE LIFF แสดง PromptPay QR Code, ปุ่มบันทึกรูปภาพ, และกล่อง Drag & Drop/File Picker อัปโหลดสลิปพร้อม Loading State ระหว่าง AI ตรวจสอบ

📊 Summary Estimate: Part 2 (Course & Financial Ecosystem)

Feature

User Stories

Dev Tasks

Estimated Dev Hours (with Buffer & Tests)

Feature 2.1 Polymorphic Course Engine

1 Story

3 Tasks

12.5 hrs

Feature 2.2 Credit Wallet & Ledger

1 Story

4 Tasks

15.5 hrs

Feature 2.3 Billing & PDF Receipts

1 Story

3 Tasks

13.0 hrs

Feature 2.4 Payment Gateway & AI Slip

1 Story

3 Tasks

10.5 hrs

TOTAL PART 2

4 Stories

13 Tasks

51.5 hrs