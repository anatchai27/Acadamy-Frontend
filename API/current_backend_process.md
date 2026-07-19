# Backend Discovery & Audit Report

> **Project:** TiwHub Academy API  
> **Framework:** .NET 9.0 (C# 13, nullable enabled, implicit usings)  
> **ORM:** Entity Framework Core 9.0 + Pomelo MySQL Provider (TiDB Cloud)  
> **Auth:** JWT Bearer (httpOnly Cookie) + BCrypt password hashing  
> **Architecture:** Minimal API (no controllers), Repository + Service pattern  
> **Date:** 2026-07-18  
> **Audit Purpose:** Multi-tenant (Zero-Trust Isolation) readiness assessment

---

## 1. Authentication & JWT Payload

### 1.1 Login Endpoint (`POST /api/auth/login`)

**File:** `Controllers/AuthEndpoints.cs:20-47`

```csharp
group.MapPost("/login", async (LoginRequest request, IUserService userService, ITokenService tokenService, HttpContext httpContext, CancellationToken ct) =>
{
    var result = await userService.LoginAsync(request.Email, request.Password, ct);

    if (result is null)
        return Results.Unauthorized();

    var refreshToken = tokenService.GenerateRefreshToken(new User
    {
        Id = result.UserId,
        Email = result.Email,
        Role = Enum.Parse<UserRole>(result.Role),
        InstituteId = result.InstituteId
    });

    httpContext.Response.Cookies.Append("auth_token", result.Token, new CookieOptions
    {
        HttpOnly = true,
        Secure = false,
        SameSite = SameSiteMode.Lax,
        Expires = DateTimeOffset.UtcNow.AddHours(1),
        Path = "/"
    });

    return Results.Ok(new LoginResponse(result.Token, result.UserId, result.Email, result.Role, refreshToken, result.InstituteId));
});
```

**Key observations:**
- Login returns `LoginResponse` with token + user info + instituteId
- Token is set as httpOnly cookie (`auth_token`) with 1-hour expiry
- Cookie is `Secure = false` (no HTTPS requirement in dev)
- `SameSiteMode.Lax` — allows cookie on top-level navigation

### 1.2 JWT Payload Structure

**File:** `Services/TokenService.cs:16-48`

```csharp
public string GenerateToken(User user)
{
    var key = _configuration["Jwt:Key"];
    var issuer = _configuration["Jwt:Issuer"];
    var audience = _configuration["Jwt:Audience"];
    var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryInMinutes"] ?? "60");

    var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
    var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Email, user.Email),
        new(ClaimTypes.Role, user.Role.ToString()),
        new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    if (user.InstituteId.HasValue)
    {
        claims.Add(new Claim("institute_id", user.InstituteId.Value.ToString()));
    }
    // ... token creation
}
```

**JWT Payload claims:**

| Claim | Type | Source | Description |
|-------|------|--------|-------------|
| `nameid` (NameIdentifier) | `string` | `user.Id` | User ID (int) |
| `email` | `string` | `user.Email` | User email address |
| `role` | `string` | `user.Role.ToString()` | Enum: admin, teacher, staff, parent, student |
| `jti` | `GUID` | `Guid.NewGuid()` | Token unique ID |
| `institute_id` | `string` (int) | `user.InstituteId` | Institute ID (optional, nullable) |

**Refresh token** has the same claims plus `"token_type": "refresh"` and 7-day expiry (`RefreshTokenExpiryDays`).

### 1.3 Secret Key / Token Expiration Configuration

**File:** `appsettings.json`

```json
{
  "Jwt": {
    "Key": "ThisIsASuperSecretKeyForJWTSigningThatMustBeAtLeast32CharactersLong!",
    "Issuer": "academy-api",
    "Audience": "academy-api-client",
    "ExpiryInMinutes": 60
  }
}
```

**File:** `Program.cs:35-55`

```csharp
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured.");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured.");

builder.Services.AddAuthentication(options => { ... })
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
    // Cookie token reading
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["auth_token"];
            if (!string.IsNullOrEmpty(token))
                context.Token = token;
            return Task.CompletedTask;
        }
    };
});
```

**Security concerns:**
- JWT secret key is hardcoded in `appsettings.json` (not in User Secrets / env vars)
- `Secure = false` on cookie — token transmitted over HTTP in dev
- `ValidateLifetime = false` on refresh token validation
- No refresh token rotation or revocation mechanism

---

## 2. Auth Middleware / Guard

### 2.1 Middleware Pipeline

**File:** `Program.cs:142-149`

```csharp
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();
```

### 2.2 Tenant Middleware

**File:** `Middlewares/TenantMiddleware.cs`

```csharp
public class TenantMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var instituteIdClaim = context.User.FindFirst("institute_id")?.Value;
            if (!string.IsNullOrEmpty(instituteIdClaim) && int.TryParse(instituteIdClaim, out var instituteId))
            {
                context.Items["InstituteId"] = instituteId;
            }
        }

        await _next(context);
    }
}
```

**Key observations:**
- Extracts `institute_id` claim from JWT and stores in `HttpContext.Items["InstituteId"]`
- Runs AFTER `UseAuthentication()` but BEFORE `UseAuthorization()`
- **No authorization check** — if the claim is missing, `context.Items["InstituteId"]` is simply null
- **No validation** that the user actually belongs to the claimed institute

### 2.3 Helper Extension

**File:** `Utilities/TenantExtensions.cs`

```csharp
public static class TenantExtensions
{
    public static int? GetInstituteId(this HttpContext context)
    {
        return context.Items["InstituteId"] as int?;
    }
}
```

### 2.4 Endpoint Authorization

Endpoints use `.RequireAuthorization()` (default) or `.AllowAnonymous()`. All admin endpoints require authentication. The `[Authorize]` attribute is not used — instead, the fluent API `.RequireAuthorization()` is called on each endpoint group.

---

## 3. Data Access Layer (DAL) / ORM

### 3.1 ORM Framework

**Entity Framework Core 9.0** with **Pomelo.EntityFrameworkCore.MySql** provider connecting to **TiDB Cloud** (MySQL-compatible).

**NuGet packages:**
```xml
<PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="9.0.0-preview.2.efcore.9.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
```

### 3.2 Database Connection

**File:** `Program.cs:113-126`

```csharp
var connectionString = builder.Configuration.GetConnectionString("TutoringDbConnection");

builder.Services.AddDbContext<TutoringDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
        mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            mysqlOptions.CommandTimeout(30);
        }));
```

**Connection string** (from `appsettings.json`):
```
server=gateway01.ap-southeast-1.prod.aws.tidbcloud.com;
port=4000;
database=tutoring_db;
user=4KAdV4BEXUcN5nB.root;
password=1RbhxfnJ0CLNSdLp;
SslMode=Required
```

### 3.3 DbContext Schema

**File:** `Data/TutoringDbContext.cs` (538 lines)

All entities mapped via Fluent API. Key entities with `InstituteId` foreign key:

| Entity | Has `InstituteId`? | EF Relationship |
|--------|--------------------|-----------------|
| User | ❌ (InstituteId nullable) | — |
| Student | ✅ | `s => s.Institute` |
| Teacher | ✅ | `t => t.Institute` |
| Course | ✅ | `c => c.Institute` |
| Product | ✅ | `p => p.Institute` |
| Enrollment | ❌ (via Course → Institute) | `e => e.Course` |
| Session | ❌ (via Course → Institute) | `s => s.Course` |
| Attendance | ❌ (via Session → Course → Institute) | — |
| Payment | ❌ (via Enrollment → Course → Institute) | — |
| Homework | ❌ (via Course → Institute) | — |
| LeaveRequest | ❌ (no direct link) | — |

### 3.4 Sample Query: `GET /api/students` (with institute filtering)

**File:** `Repositories/StudentRepository.cs:12-18`

```csharp
public async Task<IEnumerable<Student>> GetAllWithUserAsync(CancellationToken ct = default)
{
    return await _context.Students
        .Include(s => s.User)
        .OrderByDescending(s => s.CreatedAt)
        .ToListAsync(ct);
}
```

**CRITICAL FINDING:** This method has **NO `institute_id` WHERE clause** — it returns ALL students across all institutes.

**File:** `Repositories/StudentRepository.cs:20-25`

```csharp
public async Task<Student?> GetByIdWithUserAsync(int id, CancellationToken ct = default)
{
    return await _context.Students
        .Include(s => s.User)
        .FirstOrDefaultAsync(s => s.Id == id, ct);
}
```

**CRITICAL FINDING:** Same issue — no institute filter. Any authenticated user can access any student by ID regardless of institute.

**File:** `Repositories/StudentRepository.cs:68-80` (the search method WITH institute filter)

```csharp
public async Task<(IEnumerable<StudentInfo> Items, int TotalCount)> SearchAsync(
    int? instituteId, string? search, int page, int limit, CancellationToken ct = default)
{
    var query = _context.Students
        .Include(s => s.User)
        .AsQueryable();

    if (instituteId.HasValue)
        query = query.Where(s => s.InstituteId == instituteId.Value);

    // ... search, pagination
}
```

**This is the ONLY method that filters by institute.** But many other methods don't.

### 3.5 Sample Query: `GET /api/courses/:id`

**File:** `Repositories/CourseRepository.cs`

```csharp
public async Task<Course?> GetByIdAsync(int id, int? instituteId, CancellationToken ct = default)
{
    var query = _context.Courses.AsQueryable();

    if (instituteId.HasValue)
        query = query.Where(c => c.InstituteId == instituteId.Value);

    return await query.FirstOrDefaultAsync(c => c.Id == id, ct);
}
```

**This one correctly filters by institute.** But the pattern is inconsistent across the codebase.

---

## 4. Multi-Tenant Isolation Gap Analysis

### 4.1 Current State: Manual `instituteId` Propagation

The `instituteId` flows through the system as follows:

```
JWT Claim → TenantMiddleware → HttpContext.Items["InstituteId"]
    → endpoint receives via httpContext.GetInstituteId()
    → passes to service.GetAllAsync(instituteId, ...)
    → service passes to repository.SearchAsync(instituteId, ...)
    → repository adds WHERE clause manually
```

### 4.2 Repository Methods WITHOUT Institute Filter (Data Leakage Vectors)

| Repository | Method | Risk |
|------------|--------|------|
| `StudentRepository` | `GetAllWithUserAsync()` | 🔴 Returns ALL students |
| `StudentRepository` | `GetByIdWithUserAsync(id)` | 🔴 Any ID accessible |
| `StudentRepository` | `GetByIdWithParentsAsync(id)` | 🔴 Any ID accessible |
| `StudentRepository` | `GetByUserIdAsync(userId)` | 🟠 Cross-institute lookup |
| `UserRepository` | `GetAllAsync()` | 🔴 Returns ALL users |
| `UserRepository` | `GetByIdAsync(id)` | 🔴 Any ID accessible |
| `ProductRepository` | `GetAllAsync()` | 🔴 Returns ALL products |
| (and many more...) | | |

### 4.3 Repository Methods WITH Institute Filter (Correct)

| Repository | Method | Notes |
|------------|--------|-------|
| `StudentRepository` | `SearchAsync(instituteId, ...)` | ✅ Filtered |
| `CourseRepository` | `SearchAsync(instituteId, ...)` | ✅ Filtered |
| `CourseRepository` | `GetByIdAsync(id, instituteId)` | ✅ Filtered |
| `ProductRepository` | `SearchAsync(instituteId, ...)` | ✅ Filtered |
| `ProductRepository` | `GetByIdAsync(id, instituteId)` | ✅ Filtered |
| `StudentRepository` | `UpdateAsync(id, instituteId, ...)` | ✅ Forbidden check |

### 4.4 Recommended Fix: EF Core Global Query Filter

```csharp
// In TutoringDbContext.OnModelCreating
modelBuilder.Entity<Student>().HasQueryFilter(s => s.InstituteId == _currentInstituteId);
modelBuilder.Entity<Course>().HasQueryFilter(c => c.InstituteId == _currentInstituteId);
// etc.
```

This would require:
1. Making `TutoringDbContext` scoped (already is)
2. Injecting `IHttpContextAccessor` into DbContext to get `InstituteId`
3. Removing all manual `if (instituteId.HasValue)` checks from repositories
4. Removing `instituteId` parameter from service/repository method signatures

### 4.5 Entities Without Direct `InstituteId` (Require Join)

These entities need special handling — they must filter through navigation properties:

```csharp
// Enrollment → Course → InstituteId
modelBuilder.Entity<Enrollment>()
    .HasQueryFilter(e => e.Course.InstituteId == _currentInstituteId);

// Session → Course → InstituteId
modelBuilder.Entity<Session>()
    .HasQueryFilter(s => s.Course.InstituteId == _currentInstituteId);

// Attendance → Session → Course → InstituteId
modelBuilder.Entity<Attendance>()
    .HasQueryFilter(a => a.Session.Course.InstituteId == _currentInstituteId);

// Payment → Enrollment → Course → InstituteId
modelBuilder.Entity<Payment>()
    .HasQueryFilter(p => p.Enrollment.Course.InstituteId == _currentInstituteId);
```

---

## 5. Additional Security Observations

### 5.1 Hardcoded Credentials in `appsettings.json`

```json
{
  "ConnectionStrings": {
    "TutoringDbConnection": "server=gateway01.ap-southeast-1.prod.aws.tidbcloud.com;port=4000;database=tutoring_db;user=4KAdV4BEXUcN5nB.root;password=1RbhxfnJ0CLNSdLp;SslMode=Required"
  },
  "ThaiDataCloud": {
    "AccessKey": "LTAI5tFhmuvRzqkyzWUmvjSN",
    "SecretKey": "mbqAegnVgG5SPNM5fAayDCaVd2SG8y"
  }
}
```

### 5.2 Exception Handling Leaks Internal Details

**File:** `Middlewares/ExceptionHandlingMiddleware.cs`

```csharp
return Results.Json(new
{
    StatusCode = 500,
    Message = "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    Detail = ex.Message  // ⚠️ Leaks exception details to client
}, statusCode: 500);
```

### 5.3 `DbConnectionValidator` Exposes Connection String

**File:** `Utilities/DbConnectionValidator.cs` — the `ConnectionString` property is public and returned in the validation response.

### 5.4 Fire-and-Forget Tasks

**File:** `Services/PaymentService.cs` — uses `Task.Run()` for sending Line notifications, which can cause unobserved exceptions and thread pool exhaustion.

---

## 6. Summary: Framework & ORM

| Component | Technology |
|-----------|-----------|
| **Runtime** | .NET 9.0 |
| **Language** | C# 13 (nullable enabled) |
| **API Style** | Minimal API (no MVC controllers) |
| **ORM** | Entity Framework Core 9.0 |
| **Database Provider** | Pomelo.EntityFrameworkCore.MySql |
| **Database** | TiDB Cloud (MySQL-compatible) |
| **Auth** | JWT Bearer (httpOnly Cookie) |
| **Password Hashing** | BCrypt (BCrypt.Net-Next) |
| **Architecture** | Repository + Service pattern |
| **DI Pattern** | Scoped (DbContext, Services, Repositories) |
| **File Storage** | AWS S3 SDK (THAI DATA CLOUD) |