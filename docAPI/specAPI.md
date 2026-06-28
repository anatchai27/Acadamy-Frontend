# Academy API Specification

> **Base URL:** `https://your-domain.com/api`
> **Version:** 2.1
> **Updated:** 2026-06-28
> **Architecture:** Multi-Tenant (Institute-scoped), Database-First (no EF migrations)

---

## 1. General

### 1.1 Multi-Tenant Architecture

Every request (except public registration/login/health routes) is automatically scoped to a single institute. The `institute_id` is extracted from the authenticated user's JWT — it **cannot** be passed as a query parameter or body field. Accessing resources from another institute returns `404 Not Found` or `403 Forbidden`.

```
Client → Bearer Token (contains institute_id) → TenantMiddleware → HttpContext.Items["InstituteId"] → all queries WHERE institute_id = ?
```

### 1.2 Authentication

The API uses **JWT Bearer Token** authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Endpoints marked with 🔒 require authentication and are institute-scoped. Public endpoints are available without a token.

**JWT Payload (after login)**
```json
{
  "sub": "1",
  "email": "user@example.com",
  "role": "admin",
  "institute_id": "5",
  "jti": "...",
  "exp": 1687275300
}
```

### 1.3 Response Envelope

Most endpoints return a consistent wrapper:

```json
{
  "status": "success",
  "message": "คำอธิบาย",
  "data": { ... }
}
```

**Error responses** use one of these formats:

| Status | Scene | Body |
|--------|-------|------|
| 400 | Validation error | `{ "status": "error", "error_code": "ERROR_CODE", "message": "..." }` |
| 401 | Missing/invalid token | (empty body) |
| 403 | Cross-institute access / forbidden | `{ "status": "error", "errorCode": "FORBIDDEN", "message": "..." }` |
| 404 | Resource not found | `{ "error": "Not found message." }` or `{ "status": "error", "message": "..." }` |
| 500 | Server error | `{ "statusCode": 500, "message": "An unexpected error occurred...", "detail": "..." }` |

### 1.4 Date/Time Formats

All dates use **ISO 8601 UTC**. When sending date query parameters, use `YYYY-MM-DD` format.

### 1.5 Rate Limiting

Rate limiting is enforced via HTTP headers. Clients must respect the limits below to avoid `429 Too Many Requests` responses.

#### Default Tier

| Scope | Limit | Window | Burst |
|-------|-------|--------|-------|
| Per IP | 120 requests | 60 seconds | +20% |
| Per authenticated user | 300 requests | 60 seconds | — |

#### Endpoint-Specific Limits

| Endpoint Group | Limit | Window | Rationale |
|---------------|-------|--------|-----------|
| `POST /auth/login` | 5 | 60 seconds per IP | Brute-force protection |
| `POST /auth/register-institute` | 3 | 60 seconds per IP | Spam prevention |
| `POST /users/register` | 5 | 60 seconds per IP | Spam account prevention |
| `POST /users/forget-password` | 3 | 60 seconds per IP | Anti-enumeration/abuse |
| `POST /users/reset-password` | 3 | 60 seconds per IP | Token brute-force protection |
| `POST /attendance/scan` | 60 | 60 seconds per IP | High-throughput QR scanning |
| `GET /attendance/daily` | 30 | 60 seconds | Dashboard polling |
| `GET /payments` | 30 | 60 seconds | Report generation |

#### Response Headers (every response)

| Header | Example | Description |
|--------|---------|-------------|
| `X-RateLimit-Limit` | `120` | Max requests per window |
| `X-RateLimit-Remaining` | `87` | Remaining requests in current window |
| `X-RateLimit-Reset` | `1687275300` | Unix timestamp when the window resets |
| `Retry-After` | `15` | Seconds until next retry (only on `429`) |

#### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1687275300
Retry-After: 15
Content-Type: application/json

{
  "status": "error",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please retry after 15 seconds."
}
```

#### Best Practices for Clients

1. **Respect `Retry-After`** — Do not retry before the specified delay; use exponential backoff with jitter.
2. **Monitor `X-RateLimit-Remaining`** — Preemptively throttle requests when the count drops below 20% of the limit.
3. **Cache responses** — Use `ETag` and `If-None-Match` headers where supported to reduce request volume.
4. **Batch where possible** — Prefer bulk endpoints over N individual calls.
5. **On `429`** — Pause all requests to that endpoint until `Retry-After` elapses. Retry up to 3 times with exponential backoff (`delay × 2ⁿ + jitter`), then surface an error to the user.

---

## 2. Authentication

### POST `/auth/login` ⃝ Public

Log in with email and password to receive a JWT token containing `institute_id`.

**Request Body**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response** `200 OK`
```json
{
  "token": "eyJhbGciOi...",
  "userId": 1,
  "email": "user@example.com",
  "role": "admin"
}
```

> The JWT payload includes `institute_id` if the user belongs to one.

**Errors**

| Code | Status | Body |
|------|--------|------|
| Invalid credentials | 401 | (empty) |

---

### POST `/auth/register-institute` ⃝ Public

Register a new institute with its admin account. This is the **first-step onboarding** endpoint — it creates the `Institute`, `User` (admin role), `Teacher` profile, and `PdpaConsent` in a single atomic transaction. Returns a JWT token ready for immediate use.

**Request Body**
```json
{
  "institute": {
    "name": "สถาบันกวดวิชา TiwHub Tutor",
    "contact_phone": "021112222",
    "logo_base64": "data:image/png;base64,iVBORw0K..."
  },
  "admin": {
    "full_name": "สมเกียรติ ยอดเยี่ยม"
  },
  "email": "owner@tiwhub.com",
  "password": "SecurePass123",
  "phone": "0812345678",
  "lineUserId": "tiwhub_line",
  "acceptPdpa": true,
  "pdpaConsentVersion": "1.0"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `institute` | `object` | Yes | Institute to create |
| `institute.name` | `string` | Yes | Institute display name |
| `institute.contact_phone` | `string?` | No | Public phone number |
| `institute.logo_base64` | `string?` | No | Base64-encoded logo |
| `admin` | `object` | Yes | Admin profile |
| `admin.full_name` | `string` | Yes | Display name |
| `email` | `string` | Yes | Login email (unique) |
| `password` | `string` | Yes | Plain-text password |
| `phone` | `string?` | No | Phone number |
| `lineUserId` | `string?` | No | LINE User ID |
| `acceptPdpa` | `boolean` | Yes | Must be `true` |
| `pdpaConsentVersion` | `string` | No (default: `"1.0"`) | PDPA consent version |

**Response** `201 Created`
```json
{
  "status": "success",
  "message": "ลงทะเบียนสถาบันสำเร็จ",
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "email": "owner@tiwhub.com",
    "role": "admin",
    "instituteId": 1,
    "instituteName": "สถาบันกวดวิชา TiwHub Tutor"
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Missing fields | 400 | `{ "error": "Email and password are required." }` |
| Role not admin | 400 | `{ "error": "Role must be 'admin' for institute registration." }` |
| Missing institute name | 400 | `{ "error": "Institute name is required." }` |
| Email taken | 400 | `{ "error": "Email is already registered." }` |
| Transaction failure | 500 | `{ ... "message": "เกิดข้อผิดพลาดในการลงทะเบียนสถาบัน กรุณาลองใหม่อีกครั้ง" }` |

---

### GET `/auth/me` 🔒

Get the currently authenticated user's profile. Requires a valid JWT.

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "phone": "0812345678",
    "role": "admin",
    "instituteId": 1,
    "profile": {
      "fullName": "สมเกียรติ ยอดเยี่ยม",
      "photoUrl": "https://...",
      "subjects": "คณิตศาสตร์, วิทยาศาสตร์"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `int` | User primary key |
| `email` | `string` | Login email |
| `phone` | `string?` | Phone number |
| `role` | `string` | `admin`, `teacher`, `parent`, or `student` |
| `instituteId` | `int?` | Institute FK (`null` if not assigned) |
| `profile` | `object` | User-facing profile |
| `profile.fullName` | `string` | Teacher's full name, or email fallback |
| `profile.photoUrl` | `string?` | Teacher's photo URL |
| `profile.subjects` | `string?` | Teacher's specialization (column: `subjects`) |

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not authenticated | 401 | (empty) |
| User not found | 404 | `{ "status": "error", "error_code": "USER_NOT_FOUND", "message": "ไม่พบบัญชีผู้ใช้" }` |

---

### POST `/auth/logout` 🔒

Log out (stateless — client should discard the token).

**Response** `200 OK`
```json
{
  "status": "success",
  "message": "ออกจากระบบสำเร็จ"
}
```

---

## 3. Users

### GET `/users` 🔒 Admin only

List all users in the current institute.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "instituteId": 1,
    "email": "admin@example.com",
    "phone": null,
    "role": "admin",
    "lineUserId": null,
    "passwordHash": "$2a$11$...",
    "resetToken": null,
    "resetTokenExpiry": null,
    "createdAt": "2026-06-01T10:00:00Z",
    "updatedAt": "2026-06-01T10:00:00Z",
    "institute": null,
    "student": null,
    "teacher": null
  }
]
```

---

### GET `/users/{id}` 🔒 Admin only

Get a single user by ID (within the current institute).

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | User ID |

**Response** `200 OK` — Same shape as single item from `GET /users`

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 404 | `{ "error": "User not found." }` |

---

### POST `/users/register` ⃝ Public

Register a new account. When `role` is `admin`, you **must** also supply `institute` and `admin` objects — an `Institute` record and a `Teacher` profile are created in the same transaction.

> **Note:** For full institute onboarding that returns a JWT immediately, prefer `POST /auth/register-institute`.

**Request Body**
```json
{
  "institute": {
    "name": "สถาบันกวดวิชา TiwHub Tutor",
    "contact_phone": "021112222",
    "logo_base64": "data:image/png;base64,iVBORw0K..."
  },
  "admin": {
    "full_name": "สมเกียรติ ยอดเยี่ยม"
  },
  "email": "owner@tiwhub.com",
  "password": "SecurePass123",
  "phone": "0812345678",
  "role": "admin",
  "line_user_id": "tiwhub_line",
  "accept_pdpa": true,
  "pdpa_consent_version": "1.0"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `institute` | `object?` | Yes (admin) | — | Institute to create |
| `institute.name` | `string` | Yes | — | Institute display name (max 255) |
| `institute.contact_phone` | `string?` | No | — | Public phone number (max 50) |
| `institute.logo_base64` | `string?` | No | — | Base64-encoded logo (stored as `LogoUrl`) |
| `admin` | `object?` | Yes (admin/teacher) | — | Profile for the admin/teacher user |
| `admin.full_name` | `string` | Yes | — | Display name (becomes `Teacher.FullName`) |
| `email` | `string` | Yes | — | Login email (unique, max 255) |
| `password` | `string` | Yes | — | Plain-text password (hashed server-side) |
| `phone` | `string?` | No | — | Phone number (max 50) |
| `role` | `string` | No | `student` | `admin`, `teacher`, `parent`, or `student` |
| `line_user_id` | `string?` | No | — | LINE User ID (max 255) |
| `accept_pdpa` | `boolean` | Yes | — | Must be `true` |
| `pdpa_consent_version` | `string` | No | `1.0` | PDPA consent version (max 50) |

**Behavior by role**

| Role | Institute created? | Teacher created? | Notes |
|------|-------------------|------------------|-------|
| `admin` | ✅ (required) | ✅ | Full onboarding flow |
| `teacher` | ❌ | ✅ | Teacher gets a profile |
| `parent` | ❌ | ❌ | Plain user only |
| `student` | ❌ | ❌ | Plain user only |

**Response** `201 Created`
```json
{
  "id": 5,
  "email": "owner@tiwhub.com",
  "role": "admin",
  "instituteId": 1,
  "instituteName": "สถาบันกวดวิชา TiwHub Tutor"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | New user ID |
| `email` | `string` | Login email |
| `role` | `string` | Assigned role |
| `instituteId` | `int?` | Institute ID (null if no `institute` supplied) |
| `instituteName` | `string?` | Institute name (null if no `institute` supplied) |

**Errors**

| Code | Status | Body |
|------|--------|------|
| Missing required fields | 400 | `{ "error": "Email cannot be null or empty." }` |
| Duplicate email or phone | 400 | `{ "error": "Email or phone number is already registered." }` |
| PDPA not accepted | 400 | `{ "error": "PDPA consent must be accepted to create an account." }` |
| DB constraint failure | 400 | `{ "error": "Failed to create user. Please try again." }` |

---

### POST `/users/forget-password` ⃝ Public

Request a password reset link (sent by email). Always returns 200 to prevent email enumeration.

**Request Body**
```json
{
  "email": "string (required)"
}
```

**Response** `200 OK`
```json
{
  "message": "If the email exists, a reset link has been sent."
}
```

---

### POST `/users/reset-password` ⃝ Public

Reset password using a token received via email.

**Request Body**
```json
{
  "email": "string (required)",
  "token": "string (required)",
  "newPassword": "string (required)"
}
```

**Response** `200 OK`
```json
{
  "message": "Password reset successfully."
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Invalid/expired token | 400 | `{ "error": "Invalid or expired reset token." }` |

---

## 4. Students  🔒 All endpoints

> **Scope:** All queries are automatically filtered by the institute from the JWT. Students created via `POST` are assigned to the caller's institute. Cross-institute access returns `403`.

### GET `/students`

List students with optional search and pagination (within the current institute only).

**Query Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `search` | `string?` | — | Search by full name, nickname, student ID, or parent phone |
| `page` | `int` | 1 | Page number (1-based) |
| `limit` | `int` | 20 | Items per page (1-100) |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "students": [
      {
        "id": 1,
        "fullName": "ด.ช. สมชาย รักเรียน",
        "nickname": "ชาย",
        "grade": "ม.1",
        "photoUrl": "https://...",
        "primaryParentName": "นางสมศรี",
        "primaryParentPhone": "0812345678"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "hasNext": true
    }
  }
}
```

---

### GET `/students/{id}`

Get a student's full profile including parents. Returns 404 if the student is not in the current institute.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Student ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "fullName": "ด.ช. สมชาย รักเรียน",
    "nickname": "ชาย",
    "grade": "ม.1",
    "school": "รร.ตัวอย่าง",
    "medicalInfo": "แพ้อาหารทะเล",
    "photoUrl": "https://...",
    "createdAt": "2026-06-01T10:00:00Z",
    "parents": [
      {
        "id": 1,
        "fullName": "นางสมศรี รักเรียน",
        "phone": "0812345678",
        "relationship": "มารดา",
        "lineUserId": "Uxxxxx"
      }
    ]
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 404 | `{ "status": "error", "message": "ไม่พบข้อมูลนักเรียน" }` |

---

### POST `/students`

Create a new student with parents and PDPA consent. The student is automatically assigned to the current institute.

**Request Body**
```json
{
  "student": {
    "fullName": "string (required)",
    "nickname": "string?",
    "grade": "string?",
    "school": "string?",
    "photoUrl": "string?",
    "medicalInfo": "string?"
  },
  "parents": [
    {
      "fullName": "string (required)",
      "phone": "string? (10 digits)",
      "relationship": "string?"
    }
  ],
  "pdpa": {
    "isAccepted": true,
    "consentVersion": "1.0"
  }
}
```

> **Security:** `institute_id` is automatically assigned from the JWT — do **not** pass it in the request body.

**Response** `201 Created`
```json
{
  "status": "success",
  "message": "บันทึกข้อมูลนักเรียนสำเร็จ",
  "data": {
    "studentId": 1,
    "qrToken": "tiwhub_1_abc12345_1718366280",
    "createdAt": "2026-06-20T12:00:00Z"
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Validation failed | 400 | `{ "status": "error", "errorCode": "VALIDATION_FAILED", "message": "..." }` |

---

### PUT `/students/{id}`

Update student info and/or parent info. Partial updates supported — only send fields you want to change. Returns 403 if the student belongs to a different institute.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Student ID |

**Request Body**
```json
{
  "student": {
    "fullName": "string?",
    "nickname": "string?",
    "grade": "string?",
    "school": "string?",
    "photoUrl": "string?",
    "medicalInfo": "string?"
  },
  "parents": [
    {
      "id": 1,
      "fullName": "string?",
      "phone": "string?",
      "relationship": "string?",
      "lineUserId": "string?"
    }
  ]
}
```

**Response** `200 OK`
```json
{
  "status": "success",
  "message": "อัปเดตข้อมูลสำเร็จ"
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 400 | `{ "status": "error", "errorCode": "NOT_FOUND", "message": "ไม่พบข้อมูลนักเรียน" }` |
| Cross-institute | 403 | `{ "status": "error", "errorCode": "FORBIDDEN", "message": "Access denied: student belongs to a different institute." }` |

---

### GET `/students/{id}/qr`

Generate a new QR token for check-in. The token is valid for 60 seconds. Returns 403 if the student belongs to a different institute.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Student ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "studentId": 1,
    "qrToken": "tiwhub_1_abc12345_1718366280",
    "expiresAt": "2026-06-20T12:01:00Z",
    "refreshIntervalSec": 60
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 400 | `{ "status": "error", "errorCode": "NOT_FOUND", "message": "ไม่พบข้อมูลนักเรียน" }` |
| Cross-institute | 403 | `{ "status": "error", "errorCode": "FORBIDDEN", "message": "Access denied: student belongs to a different institute." }` |

---

## 5. Teachers  🔒 All endpoints

> **Scope:** All queries are filtered by institute. New teachers are assigned to the caller's institute.

### GET `/teachers`

List all teachers in the current institute.

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "instituteId": 1,
    "userId": 2,
    "fullName": "อาจารย์สมชาย",
    "specialization": "คณิตศาสตร์, วิทยาศาสตร์",
    "bio": "ประสบการณ์สอน 10 ปี",
    "hourlyRate": 500.00,
    "photoUrl": "https://...",
    "userEmail": "teacher@example.com"
  }
]
```

---

### GET `/teachers/{id}`

Get a single teacher by ID (within the current institute). Returns `403` if the teacher belongs to a different institute.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Teacher ID |

**Response** `200 OK` — Same shape as single item from `GET /teachers`

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 404 | `{ "error": "Teacher not found." }` |
| Cross-institute | 403 | `{ "error": "Access denied." }` |

---

### POST `/teachers`

Create a new teacher assigned to the current institute. The `instituteId` is automatically set from the JWT — do not pass it in the body.

**Request Body**
```json
{
  "fullName": "string (required)",
  "specialization": "string?",
  "bio": "string?",
  "hourlyRate": 500.00,
  "photoUrl": "string?"
}
```

**Response** `201 Created` — Returns the created teacher object (without navigation properties).
```json
{
  "id": 1,
  "instituteId": 1,
  "userId": null,
  "fullName": "อาจารย์สมชาย",
  "specialization": "คณิตศาสตร์, วิทยาศาสตร์",
  "bio": null,
  "hourlyRate": 500.00,
  "photoUrl": "https://..."
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Missing name | 400 | `{ "error": "FullName is required." }` |

---

## 6. Courses  🔒 All endpoints

> **Scope:** All queries are filtered by institute. New courses are assigned to the caller's institute.

### GET `/courses`

List courses in the current institute with optional search and teacher filter.

**Query Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `search` | `string?` | — | Search by course name or subject |
| `teacher_id` | `int?` | — | Filter by teacher ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "courses": [
      {
        "id": 1,
        "name": "คณิตศาสตร์ ม.1 เทอม 1",
        "subject": "คณิตศาสตร์",
        "totalSessions": 20,
        "price": 5000.00,
        "teacherName": "อาจารย์สมชาย"
      }
    ]
  }
}
```

---

### GET `/courses/{id}`

Get a single course by ID (within the current institute).

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Course ID |

**Response** `200 OK`
```json
{
  "id": 1,
  "instituteId": 1,
  "name": "คณิตศาสตร์ ม.1 เทอม 1",
  "subject": "คณิตศาสตร์",
  "totalSessions": 20,
  "price": 5000.00,
  "teacherId": 1,
  "createdAt": "2026-06-01T10:00:00Z",
  "teacherName": "อาจารย์สมชาย"
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 404 | `{ "status": "error", "message": "ไม่พบคอร์สเรียน" }` |

---

### POST `/courses`

Create a new course in the current institute. `instituteId` is automatically assigned from the JWT.

**Request Body**
```json
{
  "name": "string (required)",
  "subject": "string",
  "totalSessions": 20,
  "price": 5000.00,
  "teacherId": 1
}
```

**Response** `201 Created`
```json
{
  "status": "success",
  "message": "สร้างคอร์สเรียนสำเร็จ",
  "data": {
    "courseId": 1,
    "name": "คณิตศาสตร์ ม.1 เทอม 1",
    "createdAt": "2026-06-20T12:00:00Z"
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Missing name | 400 | `{ "status": "error", "errorCode": "NAME_REQUIRED", "message": "กรุณาระบุชื่อคอร์สเรียน" }` |

---

### PUT `/courses/{id}`

Update a course. Only the course in the current institute is updated. Returns `403` on cross-institute access.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Course ID |

**Request Body** (partial update — only send fields to change)
```json
{
  "name": "string?",
  "subject": "string?",
  "totalSessions": 20,
  "price": 5500.00,
  "teacherId": 2
}
```

**Response** `200 OK`
```json
{
  "status": "success",
  "message": "อัปเดตคอร์สเรียนสำเร็จ"
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 404 | `{ "status": "error", "errorCode": "NOT_FOUND", "message": "ไม่พบคอร์สเรียน" }` |
| Cross-institute | 403 | `{ "status": "error", "errorCode": "FORBIDDEN", "message": "Access denied." }` |

---

### POST `/courses/{courseId}/sessions`

Create a session (class schedule) for a specific course. Validates that the course belongs to the caller's institute before allowing the session to be created.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `courseId` | `int` | Course ID |

**Request Body**
```json
{
  "scheduledAt": "2026-07-01T10:00:00Z",
  "durationMin": 120,
  "roomId": "Room A"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scheduledAt` | `DateTime` | Yes | Session date and time (ISO 8601 UTC) |
| `durationMin` | `int` | Yes | Duration in minutes |
| `roomId` | `string?` | No | Room identifier (max 50) |

**Response** `201 Created`
```json
{
  "status": "success",
  "message": "สร้างตารางเรียนสำเร็จ",
  "data": {
    "sessionId": 10,
    "scheduledAt": "2026-07-01T10:00:00Z"
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Course not found | 400 | `{ "status": "error", "errorCode": "COURSE_NOT_FOUND", "message": "ไม่พบคอร์สเรียนหรือไม่มีสิทธิ์เข้าถึง" }` |

---

### GET `/courses/{courseId}/sessions`

List all sessions for a course (institute-scoped via the course).

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `courseId` | `int` | Course ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "sessions": [
      {
        "id": 10,
        "courseId": 1,
        "courseName": "คณิตศาสตร์ ม.1 เทอม 1",
        "scheduledAt": "2026-07-01T10:00:00Z",
        "durationMin": 120,
        "roomId": "Room A",
        "status": "scheduled"
      }
    ]
  }
}
```

**Session status enum:** `scheduled` | `completed` | `cancelled`

---

## 7. Enrollments  🔒 All endpoints

> **Scope:** Course lookup is restricted to the caller's institute. Cross-institute enrollment is blocked at the query level.

### POST `/enrollments`

Enroll a student in a course. The course must belong to the caller's institute.

**Request Body**
```json
{
  "studentId": 1,
  "courseId": 2
}
```

**Response** `201 Created`
```json
{
  "status": "success",
  "message": "ลงทะเบียนเรียนสำเร็จ",
  "data": {
    "enrollmentId": 10,
    "sessionsRemaining": 20,
    "expiresAt": "2026-12-20T12:00:00Z"
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Course not found | 400 | `{ "status": "error", "error_code": "COURSE_NOT_FOUND", "message": "ไม่พบคอร์สเรียนที่ระบุ" }` |
| Already enrolled | 400 | `{ "status": "error", "error_code": "DUPLICATE_ENROLLMENT", "message": "นักเรียนได้ลงทะเบียนคอร์สนี้แล้วและยังมีจำนวนครั้งเหลืออยู่" }` |

---

## 8. Attendance  🔒 All endpoints

> **Scope:** QR validation checks the student's institute. Daily attendance lists only students from the current institute. Cross-institute scans return `INVALID_QR`.

### POST `/attendance/scan`

Check-in a student by scanning their QR token. Decrements their `sessionsRemaining` by 1 and sends a LINE notification to parents. The student's institute **must** match the caller's institute. Attendance recording and session decrement run in a single atomic transaction. LINE notification is fire-and-forget.

**Request Body**
```json
{
  "qrToken": "tiwhub_1_abc12345_1718366280",
  "sessionId": 5
}
```

**Response** `200 OK`
```json
{
  "status": "success",
  "message": "เช็คชื่อเข้าเรียนสำเร็จ",
  "data": {
    "studentId": 1,
    "studentName": "ด.ช. สมชาย รักเรียน",
    "status": "present",
    "checkinAt": "2026-06-20T13:05:00Z",
    "sessionsRemaining": 19
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Invalid/expired QR | 400 | `{ "status": "error", "errorCode": "INVALID_QR", "message": "QR Token ไม่ถูกต้องหรือหมดอายุแล้ว" }` |
| Duplicate check-in | 400 | `{ "status": "error", "errorCode": "DUPLICATE_SCAN", "message": "นักเรียนได้ทำการเช็คชื่อในคลาสนี้ไปแล้ว" }` |

---

### POST `/attendance/manual`

Manually record attendance status for a student. Use this for late arrivals, absences, or leave.

**Request Body**
```json
{
  "sessionId": 5,
  "studentId": 1,
  "status": "late"
}
```

**Status enum:** `present` | `late` | `absent` | `leave`

**Response** `200 OK`
```json
{
  "status": "success",
  "message": "บันทึกสถานะการเข้าเรียนสำเร็จ",
  "data": {
    "attendanceId": 42,
    "statusRecorded": "late"
  }
}
```

**Behavior:** When status is `present` or `late`, the student's `sessionsRemaining` is decremented. When `absent` or `leave`, sessions are not decremented.

**Errors**

| Code | Status | Body |
|------|--------|------|
| Invalid status | 400 | `{ "status": "error", "errorCode": "INVALID_STATUS", "message": "สถานะไม่ถูกต้อง (ค่าที่ใช้ได้: present, late, absent, leave)" }` |
| Duplicate | 400 | `{ "status": "error", "errorCode": "DUPLICATE_SCAN", "message": "..." }` |

---

### GET `/attendance/daily`

Get daily attendance records for the current institute, optionally filtered by session.

**Query Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `session_id` | `int?` | — | Filter by session ID |
| `date` | `string?` | today | Date in `YYYY-MM-DD` format |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "sessionInfo": {
      "id": 5,
      "courseName": "คณิตศาสตร์ ม.1",
      "scheduledAt": "2026-06-20T13:00:00Z"
    },
    "attendances": [
      {
        "studentId": 1,
        "fullName": "ด.ช. สมชาย รักเรียน",
        "nickname": "ชาย",
        "status": "present",
        "checkinAt": "2026-06-20T13:05:00Z",
        "checkoutAt": null,
        "pickedUpBy": null
      },
      {
        "studentId": 2,
        "fullName": "ด.ญ. สมหญิง เรียนดี",
        "nickname": "หญิง",
        "status": "pending",
        "checkinAt": null,
        "checkoutAt": null,
        "pickedUpBy": null
      }
    ]
  }
}
```

**Status values in response:** `present` | `late` | `absent` | `leave` | `pending` (not yet scanned & no manual record)

**Errors**

| Code | Status | Body |
|------|--------|------|
| Invalid date format | 400 | `{ "status": "error", "errorCode": "INVALID_DATE", "message": "รูปแบบวันที่ไม่ถูกต้อง (ใช้ YYYY-MM-DD)" }` |

---

## 9. Payments  🔒 All endpoints

> **Scope:** All payment queries are scoped to the current institute via enrollment → student → institute. Cross-institute enrollments return `ENROLLMENT_NOT_FOUND`.

### POST `/payments`

Record a new payment for an enrollment. Generates an invoice number and sends LINE notification to parents.

**Request Body**
```json
{
  "enrollmentId": 10,
  "amount": 5000.00,
  "method": "transfer",
  "slipUrl": "https://storage.example.com/slips/xxx.png"
}
```

**Method enum:** `transfer` | `credit_card` | `cash`

**Response** `201 Created`
```json
{
  "status": "success",
  "message": "บันทึกการชำระเงินและส่งใบเสร็จสำเร็จ",
  "data": {
    "paymentId": 25,
    "invoiceNo": "INV-202606-0001",
    "receiptPdfUrl": "https://storage.tiwhub.com/receipts/INV-202606-0001.pdf"
  }
}
```

**Behavior:** The payment amount is automatically added to the enrollment's `paidAmount` total. All operations run in an atomic transaction with `MySqlRetryingExecutionStrategy`.

**Errors**

| Code | Status | Body |
|------|--------|------|
| Enrollment not found | 400 | `{ "status": "error", "error_code": "ENROLLMENT_NOT_FOUND", "message": "ไม่พบข้อมูลการลงทะเบียน" }` |
| Invalid method | 400 | `{ "status": "error", "error_code": "INVALID_METHOD", "message": "รูปแบบการชำระเงินไม่ถูกต้อง (transfer, credit_card, cash)" }` |
| Amount ≤ 0 | 400 | `{ "status": "error", "error_code": "INVALID_AMOUNT", "message": "จำนวนเงินต้องมากกว่า 0" }` |

---

### GET `/payments`

List payment history for the current institute with optional filters and pagination.

**Query Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `start_date` | `string?` | — | Filter from date `YYYY-MM-DD` (filters by `paidAt`) |
| `end_date` | `string?` | — | Filter to date `YYYY-MM-DD` |
| `method` | `string?` | — | Filter by payment method |
| `page` | `int` | 1 | Page number (1-based) |
| `limit` | `int` | 20 | Items per page |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "payments": [
      {
        "id": 25,
        "invoiceNo": "INV-202606-0001",
        "studentName": "ด.ช. สมชาย รักเรียน",
        "courseName": "คณิตศาสตร์ ม.1 เทอม 1",
        "amount": 5000.00,
        "method": "transfer",
        "paidAt": "2026-06-20T14:30:00Z",
        "slipUrl": "https://storage.example.com/slips/xxx.png",
        "receiptPdfUrl": "https://storage.tiwhub.com/receipts/INV-202606-0001.pdf"
      }
    ],
    "summary": {
      "totalAmountInRange": 5000.00
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1
    }
  }
}
```

---

## 11. Leave Requests  🔒 All endpoints

> **Scope:** All queries are filtered by institute via student's institute. Only admin/teacher roles should access approve/reject endpoints.

### GET `/leave-requests`

List leave requests with optional status filter and pagination. Default view shows pending requests first.

**Query Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `string?` | — | Filter by status (`pending`, `approved`, `rejected`) |
| `page` | `int` | 1 | Page number (1-based) |
| `limit` | `int` | 20 | Items per page (1-100) |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "requests": [
      {
        "id": 1,
        "studentId": 5,
        "studentName": "ด.ช. สมชาย รักเรียน",
        "sessionId": 10,
        "sessionScheduledAt": "2026-07-01T10:00:00Z",
        "reason": "ป่วย",
        "type": "leave",
        "status": "pending",
        "requestedAt": "2026-06-30T08:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1
    }
  }
}
```

**Leave status enum:** `pending` | `approved` | `rejected`

---

### POST `/leave-requests/{id}/approve`

Approve a leave request. Requires admin/teacher role. Creates a makeup credit (1 session, expires in 3 months) as part of the same atomic transaction.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Leave request ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "message": "อนุมัติคำร้องขอสำเร็จ"
}
```

**Business Logic:**
1. Validates request exists and belongs to caller's institute
2. Checks current status is `pending`
3. In a single transaction: sets `status = "approved"`, sets `approvedBy = currentUserId`, inserts a `makeup_credit` row (studentId, courseId, grantedAt, expiresAt=+3 months)

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 400 | `{ "status": "error", "errorCode": "NOT_FOUND", "message": "ไม่พบคำร้องขอ" }` |
| Already processed | 400 | `{ "status": "error", "errorCode": "INVALID_STATUS", "message": "ไม่สามารถอนุมัติคำร้องขอที่มีสถานะ 'approved' ได้" }` |

---

### POST `/leave-requests/{id}/reject`

Reject a leave request. Requires admin/teacher role. No makeup credit is created.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Leave request ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "message": "ปฏิเสธคำร้องขอสำเร็จ"
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 400 | `{ "status": "error", "errorCode": "NOT_FOUND", "message": "ไม่พบคำร้องขอ" }` |
| Already processed | 400 | `{ "status": "error", "errorCode": "INVALID_STATUS", "message": "ไม่สามารถปฏิเสธคำร้องขอที่มีสถานะ 'rejected' ได้" }` |

---

## 12. Homeworks  🔒 All endpoints (admin/teacher for write, student for read)

> **Scope:** Homework and submission queries are institute-scoped via the course.

### POST `/homeworks`

Create a new homework assignment for a course.

**Request Body**
```json
{
  "courseId": 1,
  "title": "แบบฝึกหัดบทที่ 1",
  "description": "ทำข้อ 1-10 หน้า 15",
  "fileUrl": "https://storage.example.com/files/hw1.pdf",
  "dueAt": "2026-07-10T23:59:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courseId` | `int` | Yes | Course ID |
| `title` | `string` | Yes | Homework title (max 255) |
| `description` | `string?` | No | Homework description (text) |
| `fileUrl` | `string?` | No | URL to attached file (max 1000) |
| `dueAt` | `DateTime` | Yes | Due date (ISO 8601 UTC) |

**Response** `201 Created`
```json
{
  "status": "success",
  "message": "สร้างการบ้านสำเร็จ",
  "data": {
    "homeworkId": 1,
    "title": "แบบฝึกหัดบทที่ 1",
    "dueAt": "2026-07-10T23:59:00Z"
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Missing title | 400 | `{ "status": "error", "errorCode": "TITLE_REQUIRED", "message": "กรุณาระบุหัวข้อการบ้าน" }` |

---

### GET `/homeworks/course/{courseId}`

List all homework assignments for a course.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `courseId` | `int` | Course ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "homeworks": [
      {
        "id": 1,
        "title": "แบบฝึกหัดบทที่ 1",
        "description": "ทำข้อ 1-10 หน้า 15",
        "fileUrl": "https://storage.example.com/files/hw1.pdf",
        "dueAt": "2026-07-10T23:59:00Z",
        "submissionCount": 5
      }
    ]
  }
}
```

---

### GET `/homeworks/{homeworkId}/submissions`

List all student submissions for a homework. Institute-scoped via the homework's course.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `homeworkId` | `int` | Homework ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "id": 1,
        "studentId": 5,
        "studentName": "ด.ช. สมชาย รักเรียน",
        "submittedAt": "2026-07-05T14:30:00Z",
        "fileUrl": "https://storage.example.com/files/submission1.pdf",
        "score": null,
        "feedback": null
      }
    ]
  }
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Not found | 404 | `{ "status": "error", "errorCode": "NOT_FOUND", "message": "ไม่พบการบ้าน" }` |

---

### PUT `/homeworks/submissions/{submissionId}/grade`

Grade a student's homework submission.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `submissionId` | `int` | Submission ID |

**Request Body**
```json
{
  "score": 9.5,
  "feedback": "ทำได้ดีมากครับ"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `score` | `decimal` | Yes | Score (e.g., 9.5 out of 10) |
| `feedback` | `string?` | No | Teacher feedback comment |

**Response** `200 OK`
```json
{
  "status": "success",
  "message": "ให้คะแนนสำเร็จ"
}
```

---

## 13. Skill Scores  🔒 All endpoints (admin/teacher)

> **Scope:** Skill scores are tied to students within the institute. Batch operations use upsert logic.

### GET `/skill-scores/student/{studentId}`

Get all skill scores for a student across topics.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `studentId` | `int` | Student ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "studentId": 5,
    "studentName": "คณิตศาสตร์",
    "scores": [
      {
        "id": 10,
        "topicId": 1,
        "topicName": "ความเข้าใจ",
        "score": 4.5,
        "note": "เข้าใจดี",
        "updatedAt": "2026-07-01T15:00:00Z"
      }
    ]
  }
}
```

---

### POST `/skill-scores/batch-update`

Batch insert or update skill scores for a student. Uses upsert logic — if a score already exists for the student+topic pair, it is updated; otherwise a new row is inserted. All operations run in a single save context.

**Request Body**
```json
{
  "studentId": 5,
  "scores": [
    { "topicId": 1, "score": 4.5, "note": "เข้าใจดี" },
    { "topicId": 2, "score": 3.0, "note": null }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `studentId` | `int` | Yes | Student ID |
| `scores` | `array` | Yes | Array of score items |
| `scores[].topicId` | `int` | Yes | Skill topic ID |
| `scores[].score` | `decimal` | Yes | Score value |
| `scores[].note` | `string?` | No | Optional note |

**Response** `200 OK`
```json
{
  "status": "success",
  "message": "บันทึกคะแนนสำเร็จ"
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Empty scores array | 400 | `{ "status": "error", "errorCode": "NO_SCORES", "message": "กรุณาระบุคะแนนอย่างน้อย 1 รายการ" }` |

---

### GET `/skill-scores/topics`

List skill topics for a course.

**Query Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `courseId` | `int` | (required) | Course ID |

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "topics": [
      { "id": 1, "name": "ความเข้าใจ", "orderIndex": 1 },
      { "id": 2, "name": "การมีส่วนร่วม", "orderIndex": 2 }
    ]
  }
}
```

---

### POST `/skill-scores/topics`

Create a new skill topic for a course.

**Request Body**
```json
{
  "courseId": 1,
  "name": "ความเข้าใจ",
  "orderIndex": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courseId` | `int` | Yes | Course ID |
| `name` | `string` | Yes | Topic display name (max 255) |
| `orderIndex` | `int` | Yes | Sort order (lower = first) |

**Response** `201 Created`
```json
{
  "status": "success",
  "message": "สร้างหัวข้อทักษะสำเร็จ"
}
```

---

## 14. Products (Legacy)

> Products are **not** institute-scoped. These endpoints are public and use an in-memory repository.

### GET `/products` ⃝ Public

List all products.

**Response** `200 OK`
```json
[
  { "id": 1, "name": "Product A", "price": 100.00 },
  { "id": 2, "name": "Product B", "price": 200.00 }
]
```

---

### GET `/products/{id}` ⃝ Public

Get a product by ID.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Product ID |

**Response** `200 OK` — Single product object. `404` if not found.

---

### POST `/products` ⃝ Public

Create a product.

**Request Body**
```json
{
  "name": "string (required)",
  "price": 100.00
}
```

**Response** `201 Created` — Created product object.

---

### PUT `/products/{id}` ⃝ Public

Update a product.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Product ID |

**Request Body**
```json
{
  "name": "string (required)",
  "price": 150.00
}
```

**Response** `200 OK` — Updated product object. `404` if not found.

---

### DELETE `/products/{id}` ⃝ Public

Delete a product.

**Path Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `int` | Product ID |

**Response** `204 No Content`. `404` if not found.

---

## 15. System  ⃝ Public

### GET `/health`

Health check endpoint.

**Response** `200 OK`
```json
{
  "status": "Healthy",
  "database": "TiDB Cloud"
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| DB down | 503 | `{ "status": "Unhealthy", "database": "Unreachable", "error": "..." }` |

---

### GET `/v1/test-connection`

Database connectivity test.

**Response** `200 OK`
```json
{
  "success": true,
  "message": "TiDB connection successful."
}
```

**Errors**

| Code | Status | Body |
|------|--------|------|
| Connection failed | 400 | `{ "success": false, "message": "..." }` |

---

## 16. CORS

All origins, headers, and methods are allowed (`AllowAnyOrigin`, `AllowAnyHeader`, `AllowAnyMethod`).

---

## 17. Data Models (Reference)

### UserRole Enum
| Value |
|-------|
| `admin` |
| `teacher` |
| `parent` |
| `student` |

### Session Status
| Value | Description |
|-------|-------------|
| `scheduled` | Upcoming session |
| `completed` | Session has ended |
| `cancelled` | Session was cancelled |

### Leave Request Status
| Value | Description |
|-------|-------------|
| `pending` | Awaiting approval |
| `approved` | Approved by admin/teacher |
| `rejected` | Rejected by admin/teacher |

### Leave Request Type
| Value |
|-------|
| `leave` |
| `makeup` |

### Attendance Status
| Value | Description |
|-------|-------------|
| `present` | Checked in |
| `late` | Arrived late (decrements sessions) |
| `absent` | Did not attend (does not decrement) |
| `leave` | Approved leave (does not decrement) |
| `pending` | Not yet scanned (only in response) |

### Payment Method
| Value |
|-------|
| `transfer` |
| `credit_card` |
| `cash` |

---

## 18. Complete Route Table

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/login` | ⃝ | Login (JWT includes `institute_id`) |
| `POST` | `/auth/register-institute` | ⃝ | Register institute + admin (returns JWT) |
| `GET` | `/auth/me` | 🔒 | Current user profile |
| `POST` | `/auth/logout` | 🔒 | Logout |
| `GET` | `/users` | 🔒 | List all users |
| `GET` | `/users/{id}` | 🔒 | Get user by ID |
| `POST` | `/users/register` | ⃝ | Register (creates institute + teacher for admin role) |
| `POST` | `/users/forget-password` | ⃝ | Request password reset |
| `POST` | `/users/reset-password` | ⃝ | Reset password |
| `GET` | `/students` | 🔒 | List students (paginated, searchable, institute-scoped) |
| `GET` | `/students/{id}` | 🔒 | Student profile |
| `POST` | `/students` | 🔒 | Create student + parents + PDPA (auto-assigned institute) |
| `PUT` | `/students/{id}` | 🔒 | Update student (403 on cross-institute) |
| `GET` | `/students/{id}/qr` | 🔒 | Generate QR token (403 on cross-institute) |
| `GET` | `/teachers` | 🔒 | List teachers (institute-scoped, returns DTO) |
| `GET` | `/teachers/{id}` | 🔒 | Get teacher (403 on cross-institute) |
| `POST` | `/teachers` | 🔒 | Create teacher via `TeacherRequest` DTO |
| `GET` | `/courses` | 🔒 | List courses (institute-scoped) |
| `GET` | `/courses/{id}` | 🔒 | Get course |
| `POST` | `/courses` | 🔒 | Create course via `CreateCourseRequest` |
| `PUT` | `/courses/{id}` | 🔒 | Update course (403 on cross-institute) |
| `GET` | `/courses/{courseId}/sessions` | 🔒 | List sessions for course |
| `POST` | `/courses/{courseId}/sessions` | 🔒 | Create session (validates course belongs to institute) |
| `POST` | `/enrollments` | 🔒 | Enroll student in course (institute-scoped) |
| `POST` | `/attendance/scan` | 🔒 | QR check-in (validates student's institute, atomic transaction) |
| `POST` | `/attendance/manual` | 🔒 | Manual attendance record (atomic transaction) |
| `GET` | `/attendance/daily` | 🔒 | Daily attendance report (institute-scoped) |
| `POST` | `/payments` | 🔒 | Record payment (institute-scoped, atomic transaction) |
| `GET` | `/payments` | 🔒 | Payment history (institute-scoped) |
| `GET` | `/leave-requests` | 🔒 | List leave requests (status filter, paginated) |
| `POST` | `/leave-requests/{id}/approve` | 🔒 | Approve leave (creates makeup credit in transaction) |
| `POST` | `/leave-requests/{id}/reject` | 🔒 | Reject leave |
| `POST` | `/homeworks` | 🔒 | Create homework assignment |
| `GET` | `/homeworks/course/{courseId}` | 🔒 | List homeworks for course |
| `GET` | `/homeworks/{homeworkId}/submissions` | 🔒 | List submissions for homework |
| `PUT` | `/homeworks/submissions/{submissionId}/grade` | 🔒 | Grade a submission |
| `GET` | `/skill-scores/student/{studentId}` | 🔒 | Get student's skill scores |
| `POST` | `/skill-scores/batch-update` | 🔒 | Batch upsert skill scores |
| `GET` | `/skill-scores/topics` | 🔒 | List skill topics |
| `POST` | `/skill-scores/topics` | 🔒 | Create skill topic |
| `GET` | `/products` | ⃝ | List products |
| `GET` | `/products/{id}` | ⃝ | Get product |
| `POST` | `/products` | ⃝ | Create product |
| `PUT` | `/products/{id}` | ⃝ | Update product |
| `DELETE` | `/products/{id}` | ⃝ | Delete product |
| `GET` | `/health` | ⃝ | Health check |
| `GET` | `/v1/test-connection` | ⃝ | DB connection test |
