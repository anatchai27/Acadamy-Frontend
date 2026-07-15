# Business & Go-to-Market Features — Implementation Plan

> **Status:** Planning Phase  
> **Target:** Production Launch  
> **Date:** 2026-07-15

---

## Current System Limitations

| Area | What Exists Now | Gap |
|------|-----------------|-----|
| **Institute** | Name, LogoUrl (base64), ContactPhone | ❌ No address, tax_id, receipt_note |
| **Receipt** | Invoice number generation only | ❌ No PDF generation — returns fake URL |
| **Roles** | `UserRole` enum (admin/teacher/parent/student) | ❌ No granular permissions, no staff invitations |
| **Products** | In-memory `ProductRepository` (lost on restart) | ❌ Not persisted, no institute scoping |
| **LINE** | `LineNotificationService` code exists | ❌ No `ChannelAccessToken` in config, no linking webhook, no LIFF app |
| **Parent** | `Parent` entity exists (FK to Student) | ❌ No user-facing portal for parents |

---

## 🚀 BIZ-001: Branding & Receipt Settings

### Backend Changes

#### 1.1 Extend Institute Model

**`API/Models/Institute.cs`** — Add fields:
```csharp
public string? Address { get; set; }              // ที่อยู่สำหรับใบเสร็จ
public string? TaxId { get; set; }                 // เลขประจำตัวผู้เสียภาษี
public string? ReceiptNote { get; set; }           // หมายเหตุท้ายใบเสร็จ
public string? Phone { get; set; }                 // เบอร์โทรติดต่อ
public string? Email { get; set; }                 // อีเมลติดต่อ
```

**`API/Data/TutoringDbContext.cs`** — Add new columns migration.

#### 1.2 Create Institute Settings Endpoints

**`API/Controllers/InstituteEndpoints.cs`** — New file:
```csharp
public static class InstituteEndpoints
{
    public static IEndpointRouteBuilder MapInstituteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/institute")
            .RequireAuthorization()
            .WithTags("Institute");

        // GET /api/institute — get my institute settings
        group.MapGet("/", GetInstituteAsync);

        // PUT /api/institute — update institute settings
        group.MapPut("/", UpdateInstituteAsync);

        // POST /api/institute/logo — upload logo (multipart → cloud storage)
        group.MapPost("/logo", UploadLogoAsync);

        return app;
    }
}
```

**DTO — `API/DTOs/InstituteDtos.cs`:**
```csharp
public record InstituteResponse(
    int Id,
    string Name,
    string? LogoUrl,
    string? ContactPhone,
    string? Address,
    string? TaxId,
    string? ReceiptNote,
    string? Phone,
    string? Email
);

public record UpdateInstituteRequest(
    string? Name,
    string? ContactPhone,
    string? Address,
    string? TaxId,
    string? ReceiptNote,
    string? Phone,
    string? Email
);
```

**Register in `API/Program.cs`:**
```csharp
app.MapInstituteEndpoints();
```

#### 1.3 Cloud Logo Upload

Replace the current base64-in-JSON approach:
1. Accept multipart form with image file
2. Validate file type (image/png, image/jpeg, image/webp), max size (2MB)
3. Upload to cloud storage (Supabase Storage, Cloudinary, or local disk)
4. Store URL in `Institute.LogoUrl`
5. Return `LogoUrl` in response

#### 1.4 Receipt PDF Generation

Add NuGet package `QuestPDF` (MIT license, free):
```
dotnet add package QuestPDF
```

**`API/Services/ReceiptService.cs`** — New file:
```csharp
public interface IReceiptService
{
    Task<byte[]> GenerateReceiptPdfAsync(Payment payment, Institute institute, Enrollment enrollment, Student student, CancellationToken ct);
}
```

Implementation: Generate PDF with:
- Institute logo (top-left)
- Institute name, address, tax ID (header)
- Invoice number, date (metadata)
- Student name, course name (body)
- Amount, payment method (summary)
- Receipt notes (footer)

**Update `API/Services/PaymentService.cs`:**
```csharp
// Instead of fake URL:
var receiptPdfUrl = $"https://storage.tiwhub.com/receipts/{invoiceNo}.pdf";

// Real implementation:
var pdfBytes = await receiptService.GenerateReceiptPdfAsync(payment, institute, enrollment, student, ct);
var receiptUrl = await cloudStorage.UploadAsync($"receipts/{invoiceNo}.pdf", pdfBytes, ct);
```

### Frontend Changes

**`Front/src/pages/admin/settings-page.jsx`** — Already has stateful form. Need to add:

1. **Logo upload** section with preview + drag-and-drop
2. **Institute fields** (already has name, email, phone — add address, tax_id, receipt_note)
3. **Save handler** → call `PUT /api/institute`

**`Front/src/services/institute-service.js`** — New service:
```js
export function getInstitute(options = {}) {
  return api.get('/institute', options);
}

export function updateInstitute(payload, options = {}) {
  return api.put('/institute', payload, options);
}

export function uploadLogo(file, options = {}) {
  const formData = new FormData();
  formData.append('logo', file);
  return api.post('/institute/logo', formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
```

**`Front/src/layouts/admin-layout.jsx`** — Update sidebar header to show institute logo from API:

```jsx
// Instead of hardcoded "TH" text:
{institute.logoUrl ? (
  <img src={institute.logoUrl} alt="logo" class="h-9 w-9 rounded-lg object-cover" />
) : (
  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-tiwhub-primary text-white font-bold text-sm">
    TH
  </div>
)}
```

---

## 🚀 BIZ-002: Staff & Role Management

### Backend Changes

#### 2.1 Role/Permission Infrastructure

**Decision:** Start simple — no full RBAC. Use `UserRole` enum with a hardcoded route-level permission matrix.

**`API/Utilities/PermissionPolicies.cs`** — Define policies:
```csharp
public static class PermissionPolicies
{
    public const string AdminOnly = "AdminOnly";
    public const string TeacherOrAbove = "TeacherOrAbove";
    public const string FinanceAccess = "FinanceAccess";  // admin + staff
    public const string SettingsAccess = "SettingsAccess"; // admin only

    public static void AddPermissionPolicies(this AuthorizationOptions options)
    {
        options.AddPolicy(AdminOnly, p => p.RequireRole("admin"));
        options.AddPolicy(TeacherOrAbove, p => p.RequireRole("admin", "teacher"));
        options.AddPolicy(FinanceAccess, p => p.RequireRole("admin", "staff"));
        options.AddPolicy(SettingsAccess, p => p.RequireRole("admin"));
    }
}
```

**Update `UserRole` enum:**
```csharp
public enum UserRole { admin, teacher, staff, parent, student }
```

**`API/Program.cs` — Register policies:**
```csharp
builder.Services.AddAuthorization(options => {
    options.AddPermissionPolicies();
});
```

#### 2.2 Staff Invitation Endpoint

**`API/Controllers/StaffEndpoints.cs`** — New file:
```csharp
public static class StaffEndpoints
{
    public static IEndpointRouteBuilder MapStaffEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/staff")
            .RequireAuthorization("AdminOnly")
            .WithTags("Staff Management");

        // POST /api/staff/invite — invite a staff member
        group.MapPost("/invite", InviteStaffAsync);

        // GET /api/staff — list all staff
        group.MapGet("/", ListStaffAsync);

        // DELETE /api/staff/{id} — remove staff member
        group.MapDelete("/{id}", RemoveStaffAsync);

        return app;
    }
}
```

**Invitation flow:**
1. Admin enters email + name + role (admin/teacher/staff)
2. Backend creates a `User` with random password, sends invite email via `IEmailService`
3. Email contains a one-time setup link: `{FrontendUrl}/accept-invite?token={inviteToken}`
4. User clicks link, sets their password, account activated

**Map in `Program.cs`:**
```csharp
app.MapStaffEndpoints();
```

#### 2.3 Apply Role Policies to Existing Endpoints

Update authorization on each endpoint group in `Controllers/`:

| Endpoint Group | Current | Should Be |
|----------------|---------|-----------|
| `/api/students` | `RequireAuthorization()` | No change (all roles can view) |
| `/api/teachers` | `RequireAuthorization()` | No change |
| `/api/courses` | `RequireAuthorization()` | No change |
| `/api/sessions` | `RequireAuthorization()` | No change |
| `/api/attendance` | `RequireAuthorization()` | No change |
| `/api/enrollments` | `RequireAuthorization()` | No change |
| `/api/homeworks` | `RequireAuthorization()` | No change |
| `/api/skill-scores` | `RequireAuthorization()` | No change |
| `/api/leave-requests` | `RequireAuthorization()` | No change |
| `/api/payments` | `RequireAuthorization()` | `RequireAuthorization("FinanceAccess")` |
| `/api/institute` (new) | — | `RequireAuthorization("SettingsAccess")` |
| `/api/staff` (new) | — | `RequireAuthorization("AdminOnly")` |
| `/api/users` | `RequireAuthorization()` | `RequireAuthorization("AdminOnly")` |

### Frontend Changes

**`Front/src/pages/admin/staff-page.jsx`** — New page:
- Table of staff members with name, email, role, status
- "Invite Staff" button → modal with email + name + role selector
- Delete/remove button with confirmation

**`Front/src/services/staff-service.js`** — New service:
```js
export function inviteStaff(payload) { return api.post('/staff/invite', payload); }
export function listStaff(options = {}) { return api.get('/staff', options); }
export function removeStaff(id) { return api.delete(`/staff/${id}`); }
```

**`Front/src/layouts/admin-layout.jsx`** — Conditionally show/hide menu items based on role:

```jsx
// Get role from context
const role = state.user?.role || state.userProfile?.role || '';

const visibleMenuItems = menuItems.filter((item) => {
  if (role === 'admin') return true;
  if (role === 'teacher') return !['การเงิน', 'ผู้ใช้', 'ตั้งค่า'].includes(item.label);
  if (role === 'staff') return item.label === 'นักเรียน' || item.label === 'เช็คชื่อ' || item.label === 'การเงิน';
  return false;
});
```

**Add route guard with role check in `require-auth.js`:**
```jsx
export function requireRole(allowedRoles) {
  return function(Component) {
    return function RoleGuardedComponent(props) {
      const { state } = useAppContext();
      const role = state.user?.role || state.userProfile?.role || '';
      // ... redirect if role not in allowedRoles
    };
  };
}
```

---

## ⭐ BIZ-003: Parent LINE LIFF Portal

### Infrastructure

This is a **separate mini frontend app** — not part of the existing admin SPA.

#### Project Structure

```
Front/
├── liff/                           # LINE LIFF mini-app
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       │   ├── login.jsx           # LINE Login + phone verification
│       │   ├── home.jsx            # Dashboard: enrollment quota
│       │   ├── attendance-history.jsx
│       │   └── payment-history.jsx
│       ├── services/
│       │   └── api.js              # Shared API client
│       └── config.js               # LIFF ID, API base URL
```

### Backend Changes

#### 3.1 LIFF Login Endpoint

**`API/Controllers/LineEndpoints.cs`** — New file:
```csharp
public static class LineEndpoints
{
    public static IEndpointRouteBuilder MapLineEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/line")
            .WithTags("LINE Integration");

        // POST /api/line/liff-login
        //   Body: { lineUserId, lineAccessToken }
        //   1. Verify access token with LINE API
        //   2. Find parent by lineUserId
        //   3. If not found, return 404 → prompt phone verification
        group.MapPost("/liff-login", LiffLoginAsync).AllowAnonymous();

        // POST /api/line/verify-phone
        //   Body: { lineUserId, phone }
        //   1. Find parent by phone
        //   2. Link lineUserId to parent record
        //   3. Return JWT (limited scope: parent)
        group.MapPost("/verify-phone", VerifyPhoneAsync).AllowAnonymous();

        return app;
    }
}
```

#### 3.2 Parent-Facing API Endpoints

**`API/Controllers/ParentPortalEndpoints.cs`** — New file:
```csharp
public static class ParentPortalEndpoints
{
    // GET /api/parent/children — list linked children with enrollment info
    // GET /api/parent/children/{id}/attendance — attendance history
    // GET /api/parent/children/{id}/payments — payment/receipt history
}
```

These must be scoped: a parent can only view data for students linked to their `Parent` record.

#### 3.3 LINE Notification (Fix Existing)

**`API/appsettings.json`** — Add LINE config:
```json
"Line": {
  "ChannelAccessToken": "your-channel-access-token",
  "LiffId": "your-liff-id"
}
```

**`API/Services/LineNotificationService.cs`** — Already exists. Verify error handling and add retry logic.

#### 3.4 LINE Push on QR Scan

**`API/Services/AttendanceService.cs`** — Already calls LINE notification fire-and-forget. Replace with background job queue (see earlier code review finding 3.9).

### LIFF Frontend Pages

#### Login Flow
```
User opens LINE LIFF → LIFF init (`liff.init`) → `liff.getProfile()` → get lineUserId
  → POST /api/line/liff-login { lineUserId, lineAccessToken }
    → 200: redirect to /home
    → 404: show phone form → POST /api/line/verify-phone { phone, lineUserId }
      → 200: link parent → redirect to /home
      → 404: "ไม่พบเบอร์โทรศัพท์นี้ในระบบ ติดต่อสถาบัน"
```

#### Home Page
```
GET /api/parent/children → [
  { childName: "สมชาย", enrollments: [
    { courseName: "Math 101", totalSessions: 10, remainingSessions: 3 },
    { courseName: "Science 101", totalSessions: 8, remainingSessions: 8 }
  ]}
]
```

Display as card list with progress bars.

#### History Pages
```
GET /api/parent/children/{id}/attendance?page=1&limit=20
GET /api/parent/children/{id}/payments?page=1&limit=20
```

---

## 🛒 BIZ-004: Commerce & POS (Phase 2)

### Backend Changes

#### 4.1 Migrate Products to Database

**`API/Models/ModelConfiguration.cs`** or extend `TutoringDbContext.cs`:
```csharp
public DbSet<Product> Products => Set<Product>();

// In OnModelCreating:
modelBuilder.Entity<Product>(entity => {
    entity.ToTable("products");
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
    entity.Property(e => e.Price).HasColumnType("decimal(10,2)");
    entity.Property(e => e.InstituteId).IsRequired();
    // Products are institute-scoped
});
```

**Update `Models/Product.cs`:**
```csharp
public class Product {
    public int Id { get; set; }
    public int InstituteId { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}
```

#### 4.2 Update Payment to Support Line Items

**`API/Models/Payment.cs`** — Add:
```csharp
public List<PaymentLineItem> LineItems { get; set; } = new();
```

**New `PaymentLineItem` entity:**
```csharp
public class PaymentLineItem {
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public string ItemType { get; set; } = "";  // "enrollment" | "product"
    public int? ReferenceId { get; set; }         // enrollment_id or product_id
    public string Description { get; set; } = "";
    public decimal Amount { get; set; }
    public int Quantity { get; set; } = 1;
}
```

**Update `API/DTOs/PaymentDtos.cs`:**
```csharp
public record CreatePaymentRequest(
    int EnrollmentId,
    decimal Amount,
    string Method,
    string? SlipUrl,
    List<PaymentLineItemRequest>? ExtraItems
);

public record PaymentLineItemRequest(
    string ItemType,     // "product"
    int? ProductId,
    string Description,
    decimal Amount,
    int Quantity
);
```

#### 4.3 Update Receipt PDF to Include Line Items

Modify `ReceiptService` to iterate `LineItems`. The receipt table becomes:

```
รายการ                        จำนวน    ราคา
──────────────────────────────────────────────
ค่าคอร์ส คณิตศาสตร์ ม.1        1       5,000
หนังสือคณิตศาสตร์ ม.1          1        500
──────────────────────────────────────────────
รวมทั้งสิ้น                            5,500
```

### Frontend Changes

**`Front/src/pages/admin/products-page.jsx`** — New page:
- Table: name, price, active/inactive
- Add/Edit product modal
- Delete with confirmation

**`Front/src/services/product-service.js`** — New service:
```js
export function getProducts(params, options) { return api.get('/products', { params, ...options }); }
export function createProduct(payload) { return api.post('/products', payload); }
export function updateProduct(id, payload) { return api.put(`/products/${id}`, payload); }
export function deleteProduct(id) { return api.delete(`/products/${id}`); }
```

**Update `payment form` (finance-page.jsx)** — Add "+ เพิ่มสินค้าอื่น" button:
- Opens a product selector modal
- Select product + quantity → adds to `lineItems` array
- Total amount auto-calculates

---

## Feature Dependency Graph

```
BIZ-001 (Branding/Receipt)
  ├── Backend: Institute model extension
  ├── Frontend: Settings page (in progress)
  └── BIZ-004 (Receipt PDF) → BIZ-001 (receipt data)

BIZ-002 (Staff/Roles)
  ├── Backend: Role policies + invite endpoint
  ├── Frontend: Staff page + menu filtering
  └── All existing pages: no change (already wrapped in requireAuth)

BIZ-003 (LINE LIFF)
  ├── NEW: LIFF mini-app project
  ├── Backend: Parent portal endpoints
  ├── Backend: LINE webhook verification
  └── Depends on BIZ-002? (parent role for JWT)

BIZ-004 (Commerce)
  ├── Backend: Products DB migration
  ├── Backend: Update Payment model
  └── Depends on BIZ-001 (receipt PDF includes line items)
```

---

## Effort Estimation

| Feature | Dev Days | Notes |
|---------|----------|-------|
| BIZ-001 Backend | 3 | Institute endpoints + logo upload + receipt PDF |
| BIZ-001 Frontend | 2 | Settings form + logo display in sidebar |
| BIZ-002 Backend | 3 | Permission policies + staff invite + role filtering |
| BIZ-002 Frontend | 3 | Staff page + menu conditionals + role guard |
| BIZ-003 Backend | 4 | LIFF login + parent portal endpoints + LINE webhook |
| BIZ-003 Frontend (LIFF) | 5 | New mini-app: login, home, history pages |
| BIZ-004 Backend | 3 | Products DB migration + line items payment |
| BIZ-004 Frontend | 3 | Products page + POS in payment form |
| **Total** | **26** | Approx 6-7 sprints (2-week each) |

---

## Recommended Sprint Order

| Sprint | Cards | Focus |
|--------|-------|-------|
| 1 | BIZ-001 | Branding + Receipt PDF (foundation for all receipts) |
| 2 | BIZ-002 | Staff + Roles (enables team usage) |
| 3-4 | BIZ-003 | LINE LIFF (major differentiator) |
| 5-6 | BIZ-004 | Products + POS (phase 2 feature) |
