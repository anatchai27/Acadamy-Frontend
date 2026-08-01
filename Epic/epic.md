📐 TiwHub Master Architecture Blueprint & Execution Plan (Refined v2.0)

Document Type: Master System Architecture & Engineering Execution Blueprint

Target: Product Owners, Engineering Leads, Full-Stack Engineers, DBAs, QA Leads

Stack Alignment: TiDB (Distributed SQL) + C# .NET 9.0 + Preact / React (LINE LIFF Compatible)

🎯 1. Executive Summary & Peer Review Action Plan

เอกสารฉบับนี้เป็นการยกระดับสเปกสถาปัตยกรรม TiwHub ตามผลการ Peer Review เชิงลึก เพื่อแก้ปัญหาจุดเปราะบางทางวิศวกรรมซอฟต์แวร์ก่อนลงมือพัฒนาใน Sprint โดยมีเป้าหมายหลัก 6 ด้าน:

Re-calibration of Estimates & Buffers: ปรับเพิ่ม Buffer 30–50% สำหรับ P0/P1 Tasks และแยกประเภทงาน Implementation, Unit/Integration Test, และ Load Test ออกจากกันอย่างชัดเจน

Current vs Target Gap Analysis: ระบุสถานะโค้ดปัจจุบันใน Repository เทียบกับ Target Architecture เพื่อป้องกันการเขียนโค้ดซ้ำซ้อน (Duplicate Effort)

Global Non-Functional Requirements (NFRs): กำหนด SLA, Latency Threshold, Security Enforcement, และ Observability Standards

Testing Strategy Matrix: กำหนดกลยุทธ์การทดสอบแยกตามประเภท (Unit, Integration, Concurrency Load Test, Security IDOR Audit)

Epic Dependency Mapping: วางลำดับขั้นตอนการขึ้นระบบ (Deployment Sequence) เพื่อบริหารความเสี่ยงข้าม Feature

Security & Authorization Compliance Gates: กำหนด Gatekeeper Checklists ก่อน Merge Pull Request ทุกครั้ง

🛡️ 2. Global Non-Functional Requirements (NFRs) & SLAs

มิติ (Domain)

ตัวชี้วัด / มาตรฐาน (Metric / Standard)

เกณฑ์ที่ต้องผ่าน (Acceptance SLA)

Latency SLA (P99)

Attendance QR Scan API (POST /api/attendances/scan)

$< 300\text{ ms}$ (under 100 req/sec concurrent load)

Latency SLA (P95)

Standard Read/Write APIs

$< 150\text{ ms}$

System Availability

Multi-Tenant Platform Uptime

$\ge 99.9\%$

Tenant Isolation

Data Boundary Cross-Leakage

ZERO Tolerance (0%) (Fail-Closed Enforcement)

Concurrency Safety

Wallet Deduct / Seat Booking Overdraft

0 Double-Spends Allowed (Pessimistic DB Locks)

Message Queue SLA

LINE Push Notification Queue Delay

$< 5\text{ seconds}$ delivery latency

Observability

Structured Logging & Tracing

Serilog JSON + TraceId Header propagation

🗺️ 3. Epic Dependency Map & Rollout Roadmap

การขึ้นระบบต้องเรียงลำดับความเชื่อมโยง (Dependencies) ดังนี้:

[Epic 1: Platform Foundation & Tenant Isolation]
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
[Epic 2: Flexible Course & Wallet Engine]   [Epic 3: Daily Operations & Gate Attendance]
       │                                         │
       ├─────────────────────────────────────────┤
       ▼                                         ▼
[Epic 4: Parent & Student Digital Experience]    [Epic 5: Academics & Skill Analytics]
       │
       ▼
[Epic 6: Public Acquisition & School Operations]


🔍 4. Current State vs Target State Gap Analysis

จากการ Audit โค้ดใน Repository ปัจจุบันเทียบกับเป้าหมายระบบ พบ Gap ที่ต้องดำเนินการ Refactor ดังนี้:

Feature / Module

โค้ดที่มีอยู่แล้วใน Repo (Current State)

สิ่งที่ขาด / ต้องปรับปรุง (Target Architecture Gap)

Action Plan

Feature 1.1 (Tenant Filter)

มี ITenantProvider และ EF Core HasQueryFilter บางส่วน

ตารางลูกบางส่วน (attendances, payments) ยังใช้ Deep Navigation Filter ซึ่งเกิด N+1 Query

Denormalize institute_id ลงทุกตารางลูก และใส่ Single-Level HasQueryFilter

Feature 1.3 (RBAC)

มี .RequireAuthorization() ที่ Endpoint

ขาด Policy-Based Role Checks (RequireAdminRole, RequireStaffRole)

เติม Custom Policy Handlers และกั้น Controller ด้วย Role Claims

Feature 2.3 (Billing & Invoicing)

มี PaymentEndpoints และ InvoiceNo

ยังขาด Distributed Lock กันเลขบิลซ้ำตอนยิงพร้อมกัน

เติม Redis Lock / Sequential Incrementor Service

Feature 3.1 (QR Attendance)

มี AttendanceEndpoints

การหักเงินยังไม่มี SELECT ... FOR UPDATE และยังยิง LINE แบบ Synchronous

เติม Pessimistic Lock และแยกยิง LINE ออกไปที่ Queue Table

Feature 5.1 (Skill Card)

มี SkillScoreEndpoints

บันทึกคะแนนได้ทีละคน ยังทำ Batch Upsert ไม่ได้

ปรับ API เป็น POST /api/skill-scores/batch รับ Array

🧪 5. Testing & Quality Assurance Strategy

5.1 Testing Hierarchy & Coverage Requirements

[Layer 4: Load & Stress Test]     --> Concurrency Spikes (k6 / Vegeta - 100 req/sec)
       ▲
[Layer 3: E2E & Security Audit]  --> IDOR Boundary / Cross-Tenant Leaks
       ▲
[Layer 2: Integration Test]      --> TestServer + Real TiDB Test Database
       ▲
[Layer 1: Unit Test]             --> xUnit + Moq (Business & Validation Rules)


5.2 Key Test Scenarios & Acceptance Criteria

Concurrency Load Test (QR Gate Check-in):

Tool: k6

Scenario: ยิง 100 Concurrent Requests ในเสี้ยววินาทีเดียวกันที่ POST /api/attendances/scan เพื่อสแกนเด็กคนเดียวกัน

Expected Result: หักโควต้าหรือ Wallet เพียง 1 ครั้งสิทธิ์ สภาพระบบไม่เกิด Deadlock หรือ Negative Balance

Cross-Tenant Security Audit Test:

Tool: xUnit Integration Test

Scenario: ใช้ JWT Token สถาบัน A ยิงดึงข้อมูล StudentId ของสถาบัน B

Expected Result: ต้องได้รับการตอบกลับ 403 Forbidden หรือ 404 Not Found เท่านั้น

🔒 6. Security & Authorization Compliance Checklist (Pre-PR Gate)

พูลขอความร่วมมือจากทีมพัฒนาในการทำ Self-Check ตาม Checklist นี้ก่อนเปิด Pull Request (PR) ทุกครั้ง:

[ ] Tenant Isolation: ทุก SQL Query หรือ ORM Model มีการจำกัดขอบเขตด้วย institute_id

[ ] Role Protection: Endpoint มีการระบุ Policy ชัดเจน (เช่น .RequireAuthorization("RequireAdminRole")) ไม่ใช่แค่ .RequireAuthorization() ลอยๆ

[ ] No Naked Raw Queries: ห้ามเขียน Raw SQL โดยไม่มี Parameterization (ป้องกัน SQL Injection 100%)

[ ] Audit Trail Columns: มีการบันทึก created_by, updated_by, และ deleted_at (กรณี Soft Delete)

[ ] Idempotency Header: API ที่มีการเปลี่ยน State (POST/PUT/DELETE) รองรับ X-Idempotency-Key

📊 7. Re-Calibrated Technical Tasks & Buffer Estimates

ปรับเพิ่ม Buffer เวลา 30–50% สำหรับงานระดับ P0/P1 และแยกประเภทงานทดสอบออกเป็น Task อิสระ

🚀 EPIC 1: Foundation & Isolation

[BE-001] [P0] Implement ITenantProvider Service & Middleware Validation (3.0 hrs)

[BE-002] [P0] Configure Global Query Filters in TutoringDbContext (4.0 hrs)

[DB-001] [P0] TiDB Composite Indexing & Denormalization Migration (2.5 hrs)

[BE-005] [P0] Policy-Based Authorization Handlers & Role Enforcement (4.5 hrs)

[QA-001] [P0] Cross-Tenant IDOR Integration & Security Tests (4.0 hrs)

🚀 EPIC 2: Flexible Course & Wallet Engine

[BE-008] [P0] Polymorphic Course Validation & FluentValidation Rules (5.5 hrs)

[BE-009] [P0] Atomic Credit Wallet Mutation with Pessimistic DB Locking (6.0 hrs)

[BE-010] [P0] Sequential Invoice Number Generator with Redis Lock (4.5 hrs)

[QA-002] [P0] Race Condition Unit & Integration Test for Credit Wallet (4.0 hrs)

🚀 EPIC 3: High-Throughput Daily Operations

[BE-014] [P0] Attendance Scan Router API with Idempotency Guard (7.0 hrs)

[BE-016] [P0] Decouple LINE Messaging via notifications Queue Table (4.5 hrs)

[BE-017] [P0] Asynchronous Notification Worker (IHostedService) (5.5 hrs)

[QA-003] [P0] Concurrency Load Test (k6) for Gate Attendance Scanning (5.0 hrs)

🚀 EPIC 4: Parent & Student Digital Experience

[FE-010] [P0] Integrate LINE LIFF SDK in Preact/React App (4.0 hrs)

[BE-021] [P0] Implement Parent Line Binding API (POST /api/parents/bind-line) (4.0 hrs)

[BE-024] [P1] Multi-Child Dashboard Aggregation API (4.5 hrs)

🚀 EPIC 5: Academics & Gamification

[BE-025] [P1] Implement Batch Skill Scoring API (POST /api/skill-scores/batch) (4.5 hrs)

[FE-014] [P1] Build Radar Chart Component using Recharts (4.5 hrs)

[BE-026] [P1] Digital Homework Assignment & Review Engine APIs (5.5 hrs)

🚀 EPIC 6: Public Acquisition & School Operations

[BE-030] [P1] Room Overlap Validation Engine with Time Boundaries (4.0 hrs)

[BE-031] [P1] Teacher Payroll Calculation Engine API (5.0 hrs)

[FE-021] [P1] Room Allocation Calendar & Teacher Payroll Report UI (5.5 hrs)

⏱️ Summary Estimate Comparison

Category

Original Estimate

Re-Calibrated Estimate (with Buffers & Tests)

Variance

Core Architecture & Foundation

9.0 hrs

18.0 hrs

+100% (Added Security Tests & Refactoring)

Course & Wallet Financial Engine

10.5 hrs

20.0 hrs

+90.4% (Added Race Condition Tests & Redis Lock)

Gate Attendance & Operations

24.5 hrs

38.0 hrs

+55.1% (Added k6 Concurrency Tests & Error Handling)

Parent Gateway & Academics

20.0 hrs

32.0 hrs

+60.0% (Added Batch API & Integration Adjustments)

TOTAL DEV & TEST HOURS

64.0 hrs

108.0 hrs

+68.75% (Real-World Production Buffer)