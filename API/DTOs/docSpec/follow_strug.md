🎯 1. Executive Summary & Meta-Grade Assessment

Meta-Grade Readiness Score: 9/10 (Database Layer) | 3/10 (Application Layer Readiness)

Assessment:
จากการสแกนไฟล์ results-2026-07-18-121821.csv แบบละเอียด ผมขอแสดงความยินดีด้วยครับ โครงสร้าง Data Definition Language (DDL) ของคุณตอนนี้ผ่านมาตรฐาน High-Scale SaaS แบบ 100% แล้ว! การทำ 100% SRS-Mapping ผสานกับ utf8mb4_bin Collation และ Multi-tenant Isolation ทำให้เรามี "กระดูกสันหลัง" ที่แข็งแกร่งระดับ Meta-grade

อย่างไรก็ตาม "Database ที่ดีเยี่ยม จะไร้ค่าทันทีถ้า API เขียนมาแบบหละหลวม"
ตอนนี้สมรภูมิรบของเราเปลี่ยนจาก "การจัดเก็บข้อมูล (Data Storage)" ไปสู่ "การกลายพันธุ์ของข้อมูล (Data Mutability)" บนฝั่ง .NET 9.0 + EF Core แล้วครับ

🃏 2. The "Risk & Edge-Case" Cards

🔴 [CRITICAL CARD]: The "Double-Tap" Race Condition (ขาด Idempotency)

Threat: โลกความเป็นจริง Internet ไม่เคยเสถียร (Flaky Network) ถ้าผู้ปกครองกดปุ่ม "จ่ายเงิน" หรือครูกดปุ่ม "อนุมัติลา" ซ้ำ 2 ครั้งติดกันใน 500ms (Double-tap) ระบบ API ของคุณจะสร้างใบเสร็จ 2 ใบ หรือแจก Credit ชดเชย 2 สิทธิ์ทันที

Impact: Data Inconsistency อย่างรุนแรง บัญชีการเงินพัง สิทธิ์ชดเชยเฟ้อ

Zero-Trust Rule: Never trust the client client UI to disable a button. All state-mutating APIs (POST/PUT/DELETE) MUST be Idempotent (ใช้ Idempotency Key ใน Header).

🟡 [SCALABILITY/PERFORMANCE CARD]: TiDB Connection Exhaustion

Threat: TiDB เป็น Distributed SQL ถ้า .NET Application ของคุณเปิด Connection ใหม่สำหรับทุกๆ Request (Transient DbContext) ในช่วงเวลาที่เด็ก 500 คนสแกน QR Code หน้าประตูพร้อมกัน (Spike Traffic) ตัว Database Connection Pool จะเต็ม (Port Exhaustion) และ API จะร่วงเป็น Timeout (503 Service Unavailable) ทันที

Zero-Trust Rule: Connections are expensive. Always use AddDbContextPool instead of AddDbContext.

🔵 [SECURITY/COMPLIANCE CARD]: The Payload Injection Exploit (Mass Assignment / IDOR)

Threat: สมมติว่ามี API POST /api/homework-submissions ถ้าระบบรับค่า student_id มาจาก Request Body ({ "student_id": 105, "score": 10 }) แทนที่จะแกะจาก JWT Token เด็กนักเรียนที่ฉลาดอาจจะแก้ JSON Payload ส่งงานแทนเพื่อน หรือแก้คะแนนตัวเองได้ (IDOR - Insecure Direct Object Reference)

Zero-Trust Rule: Never trust identifiers sent in the client payload if they can be securely derived from the Server-Side Session/JWT Token.

📋 3. System Blueprint & Defensive Planning

เพื่อให้ Backend ของเราคู่ควรกับ Database ที่เราอุตส่าห์ปั้นมา เราต้องวางสถาปัตยกรรม (Architecture) ฝั่ง .NET ดังนี้:

Strict DTO (Data Transfer Object) Pattern: ห้ามโยน Entity Model ของ EF Core ออกไปที่ Controller โดยตรง และห้ามรับ Entity จาก Client โดยตรง ต้องมี Request/Response DTO มาคั่นกลางเสมอ

Context & Identity Injection: ค่า institute_id และ user_id (สำหรับทำ approved_by หรือ assigned_by) ต้องถูกฉีดเข้ามาจาก HttpContext.User (JWT Claims) ในระดับ Service Layer หรือ Repository Layer ห้ามรับจาก Controller Parameters เด็ดขาด

Atomic Transactions: ลอจิกใดที่กระทบมากกว่า 1 ตาราง (เช่น อนุมัติคำขอลา leave_requests -> ต้องไปเพิ่มสิทธิ์ makeup_credits) ต้องถูกหุ้มด้วย IDbContextTransaction เสมอ ถ้าเกิด Exception กลางทาง ต้อง Rollback ให้หมดแบบ All-or-Nothing

🃏 4. Actionable "Task Cards" (The Execution Plan)

ส่ง Checklist นี้ให้ Lead Backend ของคุณเข้า Sprint ได้เลยครับ:

[🎫 Priority 1 Card: Application Zero-Trust (Security)]

Task: บังคับใช้ ITenantProvider เพื่อดึง institute_id จาก JWT Token และ Inject เข้า TutoringDbContext (ใช้ HasQueryFilter เพื่อบล็อก Data Leak ข้ามสถาบัน)

Task: ทบทวน API Endpoints ทั้งหมด ห้ามรับค่า institute_id จาก Client Body/Query String เด็ดขาด ระบบ Backend ต้องรู้เองเสมอว่า Request นี้มาจากสถาบันไหน

[🎫 Priority 2 Card: Transactional Integrity (Reliability)]

Task: สร้าง IdempotencyMiddleware หรือ ActionFilter ดักจับ Request ซ้ำซ้อน ภายใน 2 วินาที (ใช้ Redis หรือ In-memory cache ก็ได้)

Task: ใน Endpoint การ "อนุมัติคำขอลา" ให้เปิดใช้ using var transaction = await _context.Database.BeginTransactionAsync(); เพื่อรับประกันว่าการเปลี่ยนสถานะและการแจกสิทธิ์ชดเชยจะเกิดขึ้นพร้อมกัน 100%

[🎫 Priority 3 Card: Connection Pool & DB Perf (Scalability)]

Task: ในไฟล์ Program.cs เปลี่ยนจาก builder.Services.AddDbContext<...> ไปเป็น builder.Services.AddDbContextPool<...>(options => ..., poolSize: 128);

Task: เปิดการตั้งค่า Connection Resiliency (EnableRetryOnFailure) ใน EF Core เพื่อรับมือกับ Network Glitches ที่อาจเกิดขึ้นกับ TiDB