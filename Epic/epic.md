# Academy Product Epics

> Source of truth: `Objective/ProjectObj.md`  
> Delivery status: **41 / 67 AC = 61%**  
> Delivery target: close the remaining user journeys without inventing schema, provider behavior, or business formulas.

## 1. Product Scope

Academy is a multi-tenant tutoring platform with:

- Admin/teacher operations for students, courses, attendance, leave, makeup, homework, finance, leads, and reports
- Parent/student LINE LIFF for attendance, homework, scores, leave, makeup, payment, and progress
- Public website/trial lead capture
- CMS and operations tools for institute staff

## 2. Stack Reality

- API: C# .NET 9, Minimal APIs, EF Core, MySQL/TiDB provider
- Admin web: Preact, Vite, Vitest, fetch API wrapper
- LIFF: Preact, Vite, LINE LIFF SDK, Vitest
- CMS: Next.js 15, React 19, TypeScript
- Database: TiDB/MySQL-compatible schema, official SQL runbook in `Objective/sql_script.md`
- Formatting: Prettier configured for Front, LineLiff, and CMS
- Migration inspection: `dotnet-ef 9.0.8`; repository currently has no EF migrations

## 3. Epic Map

```text
E1 Foundation/RBAC/Tenant
 ├── E2 Student & Parent
 ├── E3 Attendance & Pickup
 ├── E4 Leave & Makeup
 ├── E5 Homework & Skill Progress
 ├── E6 Payment & Billing
 ├── E7 Public Website & Leads
 ├── E8 CMS Content
 ├── E9 LINE/Notification
 └── E10 Reports & Operations
       └── E11 Release Smoke/Acceptance
              └── E12 Production Readiness
```

## E1: Foundation, Authentication, RBAC, Tenant

Status: **Complete for current acceptance scope**

- Login/logout/password reset
- bcrypt password hashing
- Role and route authorization
- Tenant query filters
- Admin inactivity timeout
- EF mapping review and SQL verification runbook
- Audit log foundation

Remaining hardening:

- Formal policy names for every endpoint
- Production database metadata evidence
- Secret rotation and environment-only connection strings

## E2: Student, Parent, Pickup

Status: **Complete: 7/7 acceptance items**

- Student CRUD/search/export
- Profile photo and medical information
- Student QR and PDF card
- Parent information in registration flow
- Pickup authorization in registration flow
- Pickup validation during checkout

Evidence:

- Front tests: `89 passed`
- API tests: `279 passed`
- Front build passed

## E3: Attendance, Quota, Checkout

Status: **Partial: 4/7 acceptance items**

Complete:

- QR scan and manual attendance
- Session/tenant/quota/duplicate validation
- Atomic quota update
- List-assisted checkout with pickup authorization
- Error mapping and double-submit protection
- Offline queue conflict UI

Remaining:

- Direct QR checkout only if owner confirms it is required
- LINE/device runtime evidence
- Test database concurrency evidence

## E4: Leave and Makeup

Status: **Complete: 5/5 acceptance items**

- Leave request and attachments
- Teacher approve/reject
- Credit creation
- Makeup slot and booking
- Booking cancellation and group cancel credit restoration

## E5: Homework, Skill, Progress

Status: **Partial**

Complete:

- Homework create, view, submit, grade, score, feedback
- Homework reminder worker based on `due_at` and `submitted_at`
- Official `homework_skill_topics` model/SQL/EF mapping
- Mapping API and Admin UI
- Grade propagation to mapped `skill_scores`

Remaining:

- Run mapping DDL in test database
- Insert real mapping rows
- Runtime grade-to-skill verification
- Streak event/reset policy
- Badge criteria and award service
- LIFF streak/badge progress display

Mapping rule:

- Never use `course_id` as `topic_id`
- Never select the first topic automatically
- Use `homework_skill_topics` only after migration and explicit mapping

## E6: Payment and Billing

Status: **Partial: 3/5 acceptance items**

- Payment recording
- Slip upload
- Receipt PDF
- Revenue report/export
- Quota/payment notifications

Remaining:

- Real slip verification provider
- Provider status/retry evidence
- Owner-approved billing formula/runtime evidence

## E7: Public Website and Lead Acquisition

Status: **Partial**

- Public institute preview
- Responsive public pages
- Trial class form
- Rate-limited `POST /api/public/leads`
- Admin lead list/search/filter
- Lead follow-up status, notes, assignee
- Lead audit trail in `audit_logs`

Remaining:

- Lead assignment UI runtime with real users
- Follow-up dashboard metrics

## E8: CMS Content

Status: **Partial**

- `public_website_contents` EF model
- Tenant-scoped admin content API
- CMS editor API client
- Draft/publish fields
- Local fallback that clearly reports missing API/auth

Remaining:

- Configure CMS admin token in real environment
- Verify save -> public preview with real content
- Active version/rollback rule
- Media storage and signed-link contract

## E9: LINE and Notifications

Status: **Partial**

- Parent LINE binding
- LIFF dashboard/homework/score/leave flows
- Notification dispatcher
- Check-in/checkout notification status
- Late worker with cancelled/completed suppression
- Retry/idempotency basics

Blocked until credentials/contract:

- Rich Menu ID and URL setup
- Broadcast recipient/consent policy
- Webhook signature verification
- Provider retry/runtime evidence

## E10: Reports and Operations

Status: **Partial**

- Revenue report from API
- Operations UI with no fake payroll data
- CMS operations empty states for unavailable formulas

Needs owner-approved formulas:

- Renewal rate
- Churn risk
- Revenue forecast
- Teacher timesheet source and timezone
- Payroll period/rate calculation
- Holiday source for workers
- File manager storage policy

## E11: Release Smoke and Acceptance

Status: **Partial**

Automated validation currently passes:

- API tests: `279 passed`
- Front tests: `89 passed`
- LineLiff tests: `4 passed`
- API build: `0 warnings / 0 errors`
- Front build: passed
- LineLiff build: passed
- CMS build: passed, routes `10/10`

Remaining smoke journeys:

- Login -> student -> pickup -> checkout
- Session -> scan -> quota -> notification
- Leave -> approve -> makeup -> group cancel
- Homework -> submit -> grade -> skill mapping
- Trial lead -> admin follow-up -> audit
- CMS draft -> publish -> public preview

## E12: Production Readiness

Status: **Not complete**

- Test database schema evidence
- DDL/migration review and backup
- LINE/provider credentials and device test
- Browser E2E tool installation
- k6/load test environment
- Secret rotation
- Owner sign-off and rollback plan

## 4. Delivery Gates

Every epic can be marked complete only when:

- API/UI flow works end-to-end
- Tenant and role boundaries are enforced
- Loading, empty, validation, and error states exist
- Relevant tests/build pass
- No mock data is presented as real data
- SQL mapping matches `Objective/sql_script.md`
- Known external blockers are documented

## 5. Current Next Actions

1. Run `homework_skill_topics` DDL in a test database and create one real mapping row
2. Run grade -> skill score runtime smoke
3. Get owner decision for streak/badge event and criteria rules
4. Configure CMS admin token and verify publish preview
5. Install browser smoke tool and execute E11 journeys
6. Obtain LINE credentials before implementing Rich Menu/Broadcast
7. Get report/payroll formulas before implementing analytics/timesheet

## 6. Tool Commands

```powershell
dotnet ef migrations list --project .\API\academy-API.csproj
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
