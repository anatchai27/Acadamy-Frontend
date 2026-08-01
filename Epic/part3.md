📐 TiwHub Work Breakdown - Part 3: High-Throughput Operations & Gate Attendance

Author: System Architecture Lead

Target: Product Owners, Engineering Leads, Full-Stack Developers, DBAs, QA Leads

Stack Alignment: TiDB (Distributed SQL) + C# .NET 9.0 + Preact / React (LINE LIFF)

🎯 EPIC 3: High-Throughput Daily Operations & Gate Attendance Engine

ระบบปฏิบัติการหน้าร้านและหน้าประตูสถาบันที่รองรับ Traffic กระชากช่วงเลิกเรียน ($>100\text{ req/s}$) ด้วยกลไก High Concurrency, Idempotency Guard และการถอด LINE Messaging ออกเป็น Asynchronous Queue เพื่อไม่ให้เกิดคอขวดหน้าประตู

🚀 [Feature 3.1] 🚪 High-Concurrency Dynamic QR Attendance Gate

📝 Level 3: User Story 3.1.1

As a: พนักงานเคาน์เตอร์ / ครูเฝ้าประตู (Gate Keeper Staff)

I want to: สแกน QR Code ของนักเรียนหน้าประตู และให้ระบบเช็คชื่อ+หักโควต้าเสร็จสิ้นภายในเวลาน้อยกว่า 2 วินาที ($<300\text{ ms}$ API response time)

So that: การจราจรหน้าโรงเรียนช่วงเลิกเรียนลื่นไหล ไม่เกิดคอขวดสะสม

Acceptance Criteria (DoD):

เมื่อนักเรียนจ่อ QR Code ที่กล้อง Kiosk ระบบจะตรวจสอบ Token และหักโควต้าการเรียนตามประเภทคอร์ส (Group/Private/Subscription/Credit)

หากเป็นคอร์ส Credit Wallet ระบบต้องเรียก Wallet Mutation Engine เพื่อหักแต้มภายใต้ Transaction แบบ Pessimistic Lock

หน้าจอ Kiosk แสดงรูปนักเรียน ชื่อ และเล่นไฟล์เสียงขานชื่อทันทีหลังสแกนผ่าน

หากเด็กสแกนซ้ำภายใน 3 วินาที (Double-tap) ระบบต้องปฏิเสธการหักโควต้าซ้ำด้วยกลไก X-Idempotency-Key

API Response Time (P99) ต้องต่ำกว่า $300\text{ ms}$ ภายใต้ Concurrent Load 100 requests/second

🛠️ Level 4: Technical Tasks (Dev Tasks)

[DB-005] [P0] TiDB High-Concurrency Attendance Table Optimization (2.5 hrs)

Detail: ตั้งค่า AUTO_RANDOM บน Primary Key ของ attendances.id เพื่อกระจาย Write Hotspot บน TiKV Nodes และสร้าง UNIQUE INDEX uq_attendance_student_session (student_id, session_id);

[BE-014] [P0] Implement Attendance Scan Router API with Idempotency Guard (POST /api/attendances/scan) (7.0 hrs)

Detail: เขียน Router จำแนกประเภทคอร์ส (group, private, subscription, credit) พร้อม Middleware ดักจับ Header X-Idempotency-Key ป้องกัน Request ซ้ำในระดับ Redis/Memory Cache

[FE-008] [P0] Build WebCam QR Scanner Kiosk Component with Debounce & Audio Feedback (4.5 hrs)

Detail: พัฒนาหน้า Kiosk เชื่อมต่อกล้อง Webcam สแกนอ่าน QR Code พร้อมระบบ Debounce 3 วินาที และ Audio Web API เล่นเสียงขานชื่อน้อง

[QA-003] [P0] Execute Concurrency Load & Stress Test (k6) for Gate Attendance Scanning (5.0 hrs)

Detail: เขียน Script k6 จำลอง Concurrent Requests 100 req/s ยิงเข้า API เช็คชื่อ ยืนยันว่าไม่มี Double-Deduction, ไม่มี Deadlock และ Latency P99 $<300\text{ ms}$

🚀 [Feature 3.2] 📬 Event-Driven Asynchronous LINE Push Queue

📝 Level 3: User Story 3.2.1

As a: ผู้ปกครอง (Parent)

I want to: ได้รับข้อความเตือนทาง LINE ทันทีเมื่อลูกสแกน QR Code เข้าโรงเรียน

So that: ฉันมั่นใจว่าลูกเดินทางถึงโรงเรียนอย่างปลอดภัยแล้ว

Acceptance Criteria (DoD):

ข้อความ LINE เด้งหาผู้ปกครองภายในเวลาไม่เกิน 5 วินาทีหลังเด็กสแกนเข้าเรียน

หากระบบ LINE API มีปัญหา ล่ม หรือติด Rate Limit การสแกนเข้าเรียนหน้าประตูต้องไม่ค้างหรือสะดุด (Decoupled Request Cycle 100%)

หากยิงส่ง LINE ไม่ผ่าน ระบบต้องลงประวัติใน Dead Letter Queue (DLQ) และพยายาม Retry อัตโนมัติ

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-015] [P0] Decouple LINE Messaging using notifications Queue Table (4.0 hrs)

Detail: ใน API สแกนเช็คชื่อ เปลี่ยนจากการเรียก LINE API ตรงๆ เป็นการสั่ง INSERT INTO notifications สถานะ pending ลง TiDB เพื่อจบ Transaction หน้าประตูทันทีใน $50\text{ ms}$

[BE-016] [P0] Implement Asynchronous Notification Background Worker (IHostedService) (5.5 hrs)

Detail: เขียน Worker Service ใน .NET 9 ดึง Record pending จากตาราง notifications ไปยิง LINE Messaging API แบบ Batch

[BE-017] [P1] Implement Circuit Breaker, Retry Policy & Dead Letter Queue (DLQ) (3.5 hrs)

Detail: ใช้ Polly ทำ Circuit Breaker คุมการยิง LINE API หากล้มเหลวให้ Retry สูงสุด 3 ครั้ง หากยังพังให้ย้ายเข้า DLQ และแจ้ง Alert เข้า Admin Monitoring Channel

🚀 [Feature 3.3] 🔄 Leave Management & Makeup Credit Router

📝 Level 3: User Story 3.3.1

As a: ผู้ปกครอง (Parent)

I want to: แจ้งลากิจ/ลาป่วย ผ่าน LINE LIFF และจอง Slot คลาสเรียนชดเชยให้ลูกได้เอง

So that: ลูกไม่เสียสิทธิ์การเรียน และฉันไม่ต้องเสียเวลาโทรแจ้งสถาบัน

Acceptance Criteria (DoD):

ผู้ปกครองแจ้งลาล่วงหน้าอย่างน้อย 2 ชม. ระบบอนุมัติสร้าง makeup_credits ให้อัตโนมัติ (1 สิทธิ์)

ผู้ปกครองเลือกดู Slot ว่างจากตาราง makeup_slots และกดจองเรียนชดเชยได้ด้วยตนเอง

การจอง Slot ชดเชยต้องมีกลไกป้องกัน Overbooking (เช่น ที่นั่งเหลือ 1 แต่กดจองพร้อมกัน 5 คน)

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-018] [P1] Implement Transactional Leave Approval & Credit Granting API (4.5 hrs)

Detail: API POST /api/leave-requests/approve เปิด IDbContextTransaction อัปเดตสถานะการลา และ INSERT INTO makeup_credits ภายใน Atomic Cycle

[BE-019] [P0] Implement Slot Booking Engine with Concurrency Guard (4.5 hrs)

Detail: API จอง Slot ชดเชย ใช้ Atomic Update UPDATE makeup_slots SET booked_count = booked_count + 1 WHERE id = ? AND booked_count < capacity เพื่อป้องกันปัญหา Overbooking 100%

[FE-009] [P1] Build Leave Request & Makeup Booking UI Component (LIFF) (4.0 hrs)

Detail: UI บน LINE LIFF แสดงรายการคาบเรียน ปุ่มกดแจ้งลา และปฏิทินแสดง Slot เรียนชดเชยที่เปิดว่างให้เลือกจอง

📊 Summary Estimate: Part 3 (High-Throughput Operations)

Feature

User Stories

Dev Tasks

Estimated Dev Hours (with Buffer & Tests)

Feature 3.1 Dynamic QR Attendance Gate

1 Story

4 Tasks

19.0 hrs

Feature 3.2 Asynchronous LINE Queue

1 Story

3 Tasks

13.0 hrs

Feature 3.3 Leave & Makeup Router

1 Story

3 Tasks

13.0 hrs

TOTAL PART 3

3 Stories

10 Tasks

45.0 hrs