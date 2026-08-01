📐 TiwHub Work Breakdown - Part 1: Foundation & Security Infrastructure

Author: Senior System Analyst (Zero-Trust Architecture Lead)

Target: Product Owners, Engineering Leads, Full-Stack Developers, DBAs, QA Leads

Stack Alignment: TiDB (Distributed SQL) + C# .NET 9.0 + Preact / React (LINE LIFF)

🎯 EPIC 1: Platform Foundation & Multi-Tenant Core Security

รากฐานความปลอดภัยและสถาปัตยกรรม Multi-Tenant SaaS แบบ Fail-Closed Isolation เพื่อรับประกันว่าข้อมูลของแต่ละสถาบันสอนพิเศษจะถูกแยกขอบเขตกันอย่างเด็ดขาด 100%

🚀 [Feature 1.1] 🔒 Multi-Tenant Data Isolation & Query Filter

📝 Level 3: User Story 1.1.1

As a: เจ้าของสถาบัน (Institute Owner)

I want to: มั่นใจว่าข้อมูลนักเรียน การเงิน และคอร์สเรียนของสถาบันฉันจะถูกจัดเก็บแยกเป็นเอกเทศจากสถาบันอื่นอย่างเด็ดขาด

So that: ไม่เกิดปัญหาข้อมูลรั่วไหลข้ามสถาบัน (Cross-Tenant Data Leakage / IDOR) และปฏิบัติตามกฎหมาย PDPA อย่างเคร่งครัด

Acceptance Criteria (DoD):

ทุก Request ที่ยิงผ่าน API Gateway / Middleware ต้องดึง institute_id จาก JWT Token Claims มาบันทึกใน HttpContext.Items

SQL Queries ทั้งหมดที่วิ่งเข้า TiDB ต้องถูกพ่วง WHERE institute_id = ? อัตโนมัติในระดับ ORM (Single-Level HasQueryFilter ใน EF Core)

ตารางลูกทุกตาราง (attendances, payments, sessions) ต้องทำ Denormalization ฝังคอลัมน์ institute_id เพื่อหลีกเลี่ยง Deep Navigation Join N+1

หากมีการยิง API ระบุ ID ของสถาบันอื่น ต้องได้รับการปฏิเสธสิทธิ์ 403 Forbidden หรือ 404 Not Found ทันที

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-001] [P0] Implement ITenantProvider Service & Middleware Validation in .NET 9 (3.0 hrs)

Detail: ดึง institute_id จาก JWT Claim หากไม่มี Claim หรือเป็นค่าว่าง ให้พ่น UnauthorizedAccessException และ Short-circuit pipeline ด้วย HTTP 403 ทันที

[BE-002] [P0] Configure Global Query Filter & SaveChanges Interceptor in TutoringDbContext.cs (4.0 hrs)

Detail: ใช้ EF Core HasQueryFilter กับทุก Entity ที่สืบทอดจาก IMultiTenantEntity บังคับฉีด WHERE institute_id = _tenantProvider.InstituteId และเขียน Interceptor ยัด institute_id ตอน Insert/Update

[DB-001] [P0] TiDB Composite Indexing & Tenant Denormalization Migration (2.5 hrs)

Detail: รัน Migration เติม institute_id ลงตารางลูกทั้งหมด และสร้าง Composite Index: CREATE INDEX idx_students_tenant ON students(institute_id, deleted_at, id);

[QA-001] [P0] Write Automated Integration Test for Cross-Tenant Boundary (IDOR Audit) (4.0 hrs)

Detail: เขียน xUnit Integration Test จำลอง JWT Token สถาบัน A ยิงดึงข้อมูล Student/Payment ID ของสถาบัน B แล้วยืนยันผลลัพธ์เป็น 403/404

🚀 [Feature 1.2] 🏢 Tenant Onboarding & White-Labeling Branding

📝 Level 3: User Story 1.2.1

As a: เจ้าของสถาบันใหม่ (New Institute Owner)

I want to: สมัครเปิดใช้งานสถาบันใหม่ พร้อมตั้งค่าโลโก้ สีแบรนด์ ข้อมูลภาษี และเงื่อนไขท้ายใบเสร็จได้เอง

So that: ระบบมีความพร้อมในการใช้งานภายใต้แบรนด์ของสถาบันฉันทันที

Acceptance Criteria (DoD):

หน้าฟอร์มสมัครสถาบัน (/register-tenant) รับข้อมูลชื่อสถาบัน, เบอร์โทร, อีเมลแอดมินหลัก, และรูปโลโก้

ระบบ Auto-generate institute_id และสร้างบัญชี Super Admin ในตาราง users ภายใต้ Transaction เดียวกัน (IDbContextTransaction)

โลโก้และข้อมูลภาษีถูกนำไปแสดงผลบน Header ของ Admin Panel และหัวกระดาษของใบเสร็จ PDF อัตโนมัติ

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-003] [P0] Implement Transactional Tenant Registration API (POST /api/auth/register-tenant) (4.5 hrs)

Detail: เปิด IDbContextTransaction สั่ง INSERT INTO institutes จากนั้น Hash รหัสผ่านด้วย Argon2id/BCrypt แล้ว INSERT INTO users (role='admin') หากขั้นไหนพังให้ Rollback ทั้งหมด

[BE-004] [P1] Implement Cloud Storage Image Upload Service for Tenant Logo (3.5 hrs)

Detail: รับไฟล์รูปโลโก้ Validate ขนาดไม่เกิน 2MB, Convert เป็น WebP แล้วอัปโหลดขึ้น S3/R2 คืนค่า Public CDN URL

[FE-001] [P0] Build Tenant Onboarding Wizard Component (Preact/React) (4.0 hrs)

Detail: ฟอร์มลงทะเบียน 2 สเต็ป (ข้อมูลสถาบัน -> บัญชีแอดมิน) พร้อม Client-side Validation, Image Preview และ Loading State

🚀 [Feature 1.3] 👥 Role-Based Access Control (RBAC) & Staff Directory

📝 Level 3: User Story 1.3.1

As a: เจ้าของสถาบัน (Institute Owner)

I want to: เชิญครูและพนักงานเข้ามาใช้งานระบบ พร้อมกำหนดสิทธิ์ตามบทบาท (Admin, Teacher, Staff)

So that: พนักงานแต่ละคนเข้าถึงได้เฉพาะหน้าจอที่เกี่ยวข้องกับงานของตนเอง ป้องกันความลับทางการเงินรั่วไหล

Acceptance Criteria (DoD):

บัญชีบทบาท Teacher จะไม่เห็นเมนูการเงิน (/finance) และเมนูตั้งค่าสถาบัน (/settings)

บัญชีบทบาท Staff สามารถออกใบเสร็จได้ แต่ไม่มีสิทธิ์กดลบประวัติการเงิน

API Controllers ทั้งหมดต้องกั้นด้วย Policy-based Check เช่น .RequireAuthorization("RequireAdminRole") ไม่ใช่แค่ .RequireAuthorization() ลอยๆ

🛠️ Level 4: Technical Tasks (Dev Tasks)

[BE-005] [P0] Implement Policy-Based Authorization Handlers & Role Enforcement (4.5 hrs)

Detail: สร้าง Custom Authorization Policies: RequireAdminRole, RequireTeacherRole, RequireStaffRole และนำไปแปะกั้น Controller Endpoints ให้ครบทุกตัว

[BE-006] [P1] Implement Staff Management CRUD APIs with Self-Deletion Protection (3.5 hrs)

Detail: API GET/POST/PUT/DELETE /api/users โดยเพิ่ม Logic ห้าม Admin กดลบบัญชีตัวเองเด็ดขาด (Self-Deletion Protection)

[FE-002] [P0] Build Role-Based Route Guard & Dynamic Sidebar Component (3.5 hrs)

Detail: ซ่อน/แสดง เมนูใน Sidebar ตาม user.role จาก JWT และกั้น Preact Router ด้วย <ProtectedRoute roles={['admin']}>

[QA-002] [P1] Automated Role Enforcement Security Audit Tests (3.0 hrs)

Detail: Integration Test จำลอง Token สิทธิ์ Teacher ยิงเข้า Endpoint การเงิน ต้องได้รับการปฏิเสธสิทธิ์ 403 Forbidden 100%

🚀 [Feature 1.4] ⚖️ PDPA Compliance & Consent Management

📝 Level 3: User Story 1.4.1

As a: ผู้ปกครอง / นักเรียน (Parent / Student)

I want to: อ่านและกดยอมรับนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ก่อนเริ่มใช้งานระบบ

So that: สถาบันได้รับการยินยอมในการเก็บข้อมูลรูปถ่าย ประวัติแพ้ยา และคะแนนการเรียนตามกฎหมาย

Acceptance Criteria (DoD):

เมื่อเข้าสู่ระบบ/เปิด LIFF ครั้งแรก จะมี Modal แสดงนโยบาย PDPA บังคับกดยอมรับ

ระบบบันทึก ip_address, accepted_at, user_id, และ pdpa_version ลงตาราง pdpa_consents

มี API สำหรับ "Export ข้อมูลส่วนบุคคล" (Data Portability) และ "แจ้งลบข้อมูล" (Right to be Forgotten)

🛠️ Level 4: Technical Tasks (Dev Tasks)

[DB-002] [P1] Create pdpa_consents Table on TiDB (1.5 hrs)

Detail: สร้างตาราง pdpa_consents พร้อม Composite Index (institute_id, reference_id) บน TiDB

[BE-007] [P1] Implement PDPA Consent Logging & Data Portability APIs (3.5 hrs)

Detail: API POST /api/pdpa/consent บันทึก Consent Log และ API GET /api/pdpa/export/me สำหรับดาวน์โหลด JSON ข้อมูลทั้งหมดตาม PDPA

[FE-003] [P1] Build PDPA Consent Modal Component & Scroll Guard (3.0 hrs)

Detail: Component แสดงนโยบาย PDPA ล็อกปุ่มยอมรับจนกว่าผู้ใช้จะเลื่อนอ่านข้อความจนถึงล่างสุด (Scroll-to-bottom activation)

📊 Summary Estimate: Part 1 (Foundation & Security)

Feature

User Stories

Dev Tasks

Estimated Dev Hours (with Buffer & Tests)

Feature 1.1 Tenant Isolation

1 Story

4 Tasks

13.5 hrs

Feature 1.2 Tenant Onboarding

1 Story

3 Tasks

12.0 hrs

Feature 1.3 RBAC & Staff Directory

1 Story

4 Tasks

14.5 hrs

Feature 1.4 PDPA Compliance

1 Story

3 Tasks

8.0 hrs

TOTAL PART 1

4 Stories

14 Tasks

48.0 hrs