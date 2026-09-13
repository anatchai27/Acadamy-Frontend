# Task Plan: AC Closure Sprint

> Scope only: the 10 targets requested in this sprint.  
> Baseline: **41/67 AC = 61%**.  
> Target: close full ACs, not subtasks; no score increase without end-to-end evidence.

## Closure Rules

- `[x]` only when API, UI, data, and relevant runtime/test evidence are complete
- `[/]` when code exists but migration, credentials, owner rule, or runtime evidence is missing
- `[ ]` when implementation is not complete
- No mock data counts as production data
- No formula is invented outside the stated ProjectObj rules

## 1. Homework -> Skill Score Runtime

Status: `[/]`

- [x] `homework_skill_topics` EF model and official SQL mapping
- [x] Admin GET/PUT topic mapping API and UI
- [x] Grade flow propagates score/feedback to mapped `skill_scores`
- [ ] Run DDL in test DB
- [ ] Insert real mapping row
- [ ] Run grade -> skill score runtime verification

Done when: a real graded submission changes the mapped student's skill score.

## 2. Streak Service and Progress API

Status: `[ ]`

- [ ] Use attendance `present/late` as a daily streak event
- [ ] Same student/date is idempotent
- [ ] Missing day resets current streak and preserves longest streak
- [x] Expose current/longest streak and awarded badges via parent progress API
- [ ] Add cross-tenant/child ownership tests

Done when: progress is calculated from real attendance records.

## 3. Badge Criteria and Award

Status: `[ ]`

- [ ] Define three criteria from existing data: attendance streak, homework submitted, skill score threshold
- [ ] Award from server-side service, not UI
- [ ] Use existing unique `(institute_id, student_id, badge_id)` to prevent duplicates
- [ ] Return awardedAt and badge metadata
- [ ] Test criteria, replay, and tenant boundary

Done when: a qualifying real event creates one durable student badge.

## 4. LIFF Streak/Badge Progress

Status: `[/]`

- [x] LIFF already displays homework/score data
- [ ] Display streak API data
- [ ] Display awarded badges API data
- [ ] Empty state for no streak/badge
- [ ] Verify selected parent child ownership

Done when: parent sees only the selected child's real progress.

## 5. CMS Publish Runtime

Status: `[/]`

- [x] Tenant-scoped content API
- [x] CMS editor API client
- [ ] Configure real admin auth token
- [ ] Save draft through API
- [ ] Publish through `isActive`
- [ ] Verify public preview reads the published API content

Done when: CMS edit -> publish -> public preview works without local draft as source.

## 6. Public CMS Dynamic Fetch

Status: `[/]`

- [x] Static public preview and trial flow
- [ ] Fetch public content by institute slug from API
- [ ] Fallback only when API explicitly has no published content
- [ ] Preserve SEO metadata and responsive layout
- [ ] Test unknown slug and unpublished content

Done when: public page displays published database content.

## 7. Reports Daily Dashboard

Status: `[/]`

- [x] Revenue report API exists
- [ ] Daily attendance present/late/absent/leave cards
- [ ] Daily payment total from `payments`
- [ ] Date range and institute filter
- [ ] Empty/zero state with no fake numbers

Done when: admin dashboard values can be traced to database rows.

## 8. Teacher Timesheet

Status: `[ ]`

- [ ] Use owner-approved source: sessions + attendance
- [ ] Calculate teacher/date/session/hours rows
- [ ] Date range filter
- [ ] CSV export
- [ ] Tests for cancelled session and duplicate attendance

Done when: payroll input is traceable to approved sessions/attendance.

## 9. Revenue Forecast

Status: `[ ]`

- [ ] Use active enrollment/quota expiry as the forecast source
- [ ] Document formula and timezone
- [ ] Return current period and next period values
- [ ] Add empty/insufficient-data state
- [ ] Test date boundaries and tenant isolation

Done when: forecast formula is visible and reproducible from database rows.

## 10. Smoke Journey and Owner Acceptance

Status: `[/]`

- [x] API/Front/LineLiff/CMS automated tests/build pass
- [ ] Homework -> mapping -> grade -> skill score runtime smoke
- [ ] Attendance -> notification -> checkout smoke
- [ ] CMS -> publish -> public preview smoke
- [ ] Parent -> streak/badge LIFF smoke
- [ ] Owner signs the 10 target ACs and records known gaps

Done when: all target journeys pass on a real test environment and owner signs evidence.

## Required Inputs

- Test DB credentials and approval to run the official `homework_skill_topics` DDL
- Real CMS admin auth configuration
- Owner confirmation of streak/badge criteria
- Owner confirmation of timesheet/forecast formula

## Validation Commands

```powershell
dotnet ef migrations list --project .\API\academy-API.csproj
dotnet test .\API\academy-API.Tests\academy-API.Tests.csproj
dotnet build .\API\academy-API.csproj

Push-Location .\Front; npm.cmd test -- --run; npm.cmd run build; Pop-Location
Push-Location .\LineLiff; npm.cmd test -- --run; npm.cmd run build; Pop-Location
Push-Location .\CMS; npm.cmd run build; Pop-Location
```
