# QR Attendance API Contract

> Contract version: `attendance-v1`  
> Decision date: 13 September 2026  
> Scope: QR Attendance routes in `API/` and `Front/`  
> Status: P0 contract freeze; implementation and runtime evidence are tracked separately in `Objective/taskPlan.md`.

## 1. Shared Rules

- The authenticated tenant is taken from the server authentication/tenant context. Clients must not send `institute_id` to select a tenant.
- The server is authoritative for QR validity, session eligibility, actor, current time, quota, and pickup authorization.
- API timestamps are UTC ISO 8601 values. Institute timezone is used only for display and worker policy evaluation.
- JSON field names use camelCase. Error responses use `errorCode`, never `error_code`.
- A successful mutation is persisted before notification dispatch. Notification/provider failure must not roll back attendance.
- Attendance uniqueness is one record per `(sessionId, studentId)` and is enforced by the database constraint when present.

## 2. Roles and Tenant Boundary

Attendance routes require an authenticated `admin` or `teacher`.

- `admin` may operate on attendance within the authenticated institute.
- `teacher` may operate only where the existing session/teacher authorization permits it.
- A student, parent, unauthenticated caller, or cross-tenant resource receives `403 FORBIDDEN` (without exposing whether a foreign record exists).
- `actorId` is resolved from the authenticated claims, never from the request body.

## 3. Routes

### `GET /api/attendance/daily`

Query parameters:

- `session_id` optional integer
- `date` optional `YYYY-MM-DD`; when omitted, the server uses the current UTC date

Success: `200` with the existing `DailyAttendanceResponse` shape:

```json
{
  "status": "success",
  "data": {
    "sessionInfo": null,
    "attendances": []
  }
}
```

Invalid date: `400 INVALID_DATE`.

### `POST /api/attendance/scan`

Headers:

- `Idempotency-Key` optional client event reference; 1-255 characters when supplied

Request:

```json
{
  "qrToken": "string",
  "sessionId": 123
}
```

The header is the canonical client event reference. A body `idempotencyKey` is accepted temporarily by the current DTO for client compatibility, but the server must treat the header as authoritative when both are present.

Success: `200` with `ScanAttendanceResponse.data` containing `attendanceId`, `sessionId`, `studentId`, `status`, `checkinAt`, `checkoutAt`, `sessionsRemaining`, and `notificationStatus`.

Error status mapping:

| HTTP | `errorCode` | Meaning |
|---:|---|---|
| 400 | `INVALID_QR` | Missing, malformed, expired, or unknown QR token |
| 403 | `FORBIDDEN` | Actor or resource is outside the tenant/role boundary |
| 404 | `SESSION_NOT_FOUND` | Session does not exist or is not eligible for attendance |
| 409 | `DUPLICATE_SCAN` | Attendance already exists for this session/student |
| 409 | `NO_QUOTA` | No usable quota/credit remains |

Simple duplicate behavior:

- The database unique constraint on `(sessionId, studentId)` is the source of truth for duplicate scans.
- A repeated request returns `409 DUPLICATE_SCAN`; it does not create another attendance or deduct quota again.
- The client may use `Idempotency-Key` to identify an offline event, but server-side replay storage is intentionally deferred.

### `POST /api/attendance/manual`

Request:

```json
{
  "sessionId": 123,
  "studentId": 456,
  "status": "present|late|absent|leave"
}
```

Success: `200` with `attendanceId` and `statusRecorded`.

`present` and `late` deduct quota. `absent` and `leave` do not deduct quota. Manual records are immutable in this contract; corrections require a separately approved correction/reversal workflow and are not exposed in the current UI.

Errors use the same `FORBIDDEN`, `SESSION_NOT_FOUND`, `DUPLICATE_SCAN`, and `NO_QUOTA` meanings as scan, plus `400 INVALID_STATUS`.

### `POST /api/attendance/{attendanceId}/checkout`

Request must provide exactly one effective pickup identity:

```json
{
  "pickupAuthorizationId": 789
}
```

or

```json
{
  "pickedUpBy": "Parent name"
}
```

Success: `200` with `sessionId`, `studentId`, `checkinAt`, `checkoutAt`, `pickedUpBy`, `pickupAuthorizationId`, audit data, and `notificationStatus`.

Error status mapping:

| HTTP | `errorCode` | Meaning |
|---:|---|---|
| 400 | `PICKUP_REQUIRED` | No pickup identity supplied |
| 403 | `FORBIDDEN` | Cross-tenant or unauthorized actor/resource |
| 404 | `NOT_FOUND` | Attendance does not exist in the tenant |
| 409 | `CHECKIN_REQUIRED` | Attendance has no check-in |
| 409 | `ALREADY_CHECKED_OUT` | Checkout was already recorded |
| 409 | `INVALID_PICKUP_AUTHORIZATION` | Authorization is missing, inactive, revoked, expired, or belongs to another student |

The current product decision is **list-assisted checkout**: the teacher selects a checked-in student from the daily attendance list and then selects an active pickup authorization. A QR checkout endpoint is not part of `attendance-v1`; it must be separately approved before implementation.

### `GET /api/attendance/{attendanceId}/audit`

Success: `200` with the latest checkout audit. Missing audit or attendance: `404 NOT_FOUND`.

## 4. QR, Worker, Notification, and Offline Decisions

- QR validity uses the existing token and expiry/rotation model. No signed QR format, secret scheme, or new QR table is introduced by this contract.
- Late notification threshold is 20 minutes after the session start, evaluated in the institute timezone while persisted timestamps remain UTC. Cancelled and completed sessions are suppressed. A recorded `leave` or `absent` attendance is not a late candidate. Holiday suppression is deferred until an owner-approved holiday source exists.
- Check-in and checkout notification idempotency keys remain deterministic: `attendance_checkin:{sessionId}:{studentId}:{parentId}` and `attendance_checkout:{attendanceId}:{parentId}`. Notification status must describe the persisted dispatch outcome, not a hardcoded success.
- Offline queue stores only the event payload and client event/idempotency key. The server revalidates QR, session, actor, tenant, quota, and pickup authorization on replay.
- Offline duplicate replay returns `DUPLICATE_SCAN` and the client may mark the event as already applied. Expired session, no quota, revoked pickup, or logged-out actor is rejected and remains visible as a conflict/manual-review state. Offline checkout is rejected and is not queued in `attendance-v1`.

## 5. Implementation Gaps

This document freezes the target contract; it does not claim that every behavior is implemented. The following remain P2/P3/P4/P5 work:

- Server-side scan idempotency replay is deferred; database uniqueness plus client event references are the current simple policy.
- Move scan/manual validation and quota deduction into a deterministic transaction boundary.
- Map endpoint HTTP statuses to the table above.
- Return actual notification dispatch status after commit.
- Add audit event coverage for scan/manual and runtime evidence for worker, LINE, offline, and concurrency behavior.
