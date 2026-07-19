using academy_API.Data;
using academy_API.Models;
using academy_API.Services.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace academy_API.Controllers;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Authentication")
            .WithOpenApi();

        group.MapPost("/login", async (LoginRequest request, IUserService userService, ITokenService tokenService, HttpContext httpContext, CancellationToken ct) =>
        {
            var result = await userService.LoginAsync(request.Email, request.Password, ct);

            if (result is null)
            {
                return Results.Unauthorized();
            }

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

        group.MapPost("/register-institute", RegisterInstitute)
            .AllowAnonymous();

        group.MapGet("/me", async (HttpContext httpContext, IUserService userService, CancellationToken ct) =>
        {
            var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Results.Unauthorized();

            var result = await userService.GetCurrentUserAsync(userId, ct);
            if (result is null)
                return Results.Json(new { status = "error", error_code = "USER_NOT_FOUND", message = "ไม่พบบัญชีผู้ใช้" }, statusCode: 404);

            return Results.Ok(result);
        }).RequireAuthorization();

        group.MapPost("/logout", (HttpContext httpContext) =>
        {
            httpContext.Response.Cookies.Delete("auth_token", new CookieOptions
            {
                Path = "/",
                Secure = true,
                SameSite = SameSiteMode.Lax
            });
            return Results.Ok(new { status = "success", message = "ออกจากระบบสำเร็จ" });
        }).RequireAuthorization();

        group.MapPost("/refresh-token", async (
            RefreshTokenRequest request,
            ITokenService tokenService,
            TutoringDbContext db,
            IConfiguration config,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Token))
                return Results.BadRequest(new { status = "error", error_code = "MISSING_TOKEN", message = "Token is required." });

            var jwtKey = config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured.");
            var jwtIssuer = config["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured.");
            var jwtAudience = config["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured.");

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(request.Token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = false,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                }, out var validatedToken);

                if (validatedToken is not JwtSecurityToken jwtToken ||
                    !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                {
                    return Results.Unauthorized();
                }

                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                    return Results.Unauthorized();

                var user = await db.Users
                    .Include(u => u.Institute)
                    .FirstOrDefaultAsync(u => u.Id == userId, ct);

                if (user is null)
                    return Results.Unauthorized();

                // Check institute is not suspended
                var institute = await db.Institutes.FirstOrDefaultAsync(i => i.Id == user.InstituteId, ct);
                if (institute is null || !institute.IsActive)
                    return Results.Json(new { status = "error", error_code = "INSTITUTE_SUSPENDED", message = "สถาบันถูกระงับการใช้งาน" }, statusCode: 403);

                var refreshResult = tokenService.ValidateAndRefresh(request.Token, user);
                if (refreshResult is null)
                    return Results.Unauthorized();

                var refreshToken = tokenService.GenerateRefreshToken(user);

                httpContext.Response.Cookies.Append("auth_token", refreshResult.Value.Token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = false,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddHours(1),
                    Path = "/"
                });

                return Results.Ok(new
                {
                    status = "success",
                    message = "ต่ออายุ Token สำเร็จ",
                    token = refreshResult.Value.Token,
                    refreshToken,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        role = user.Role.ToString(),
                        instituteId = user.InstituteId
                    }
                });
            }
            catch (SecurityTokenException)
            {
                return Results.Unauthorized();
            }
            catch
            {
                return Results.Unauthorized();
            }
        }).AllowAnonymous();

        return app;
    }

    private static async Task<IResult> RegisterInstitute(
        RegisterUserRequest request,
        ITokenService tokenService,
        TutoringDbContext db,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString()
            ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();

        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            return Results.BadRequest(new { error = "Email and password are required." });

        if (request.Role != UserRole.admin)
            return Results.BadRequest(new { error = "Role must be 'admin' for institute registration." });

        if (request.Institute?.Name == null)
            return Results.BadRequest(new { error = "Institute name is required." });

        try
        {
            var strategy = db.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync(ct);

                // 1. Create Institute
                var institute = new Institute
                {
                    Name = request.Institute.Name,
                    ContactPhone = request.Institute.ContactPhone,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                db.Institutes.Add(institute);
                await db.SaveChangesAsync(ct);

                if (!string.IsNullOrWhiteSpace(request.Institute.LogoBase64))
                    institute.LogoUrl = request.Institute.LogoBase64;

                // 2. Check email uniqueness
                if (await db.Users.AnyAsync(u => u.Email == request.Email, ct))
                {
                    await transaction.RollbackAsync(ct);
                    return Results.BadRequest(new { error = "Email is already registered." });
                }

                // 3. Hash password
                var passwordHash = tokenService.HashPassword(request.Password);

                // 4. Create User (admin)
                var user = new User
                {
                    InstituteId = institute.Id,
                    Email = request.Email,
                    Phone = request.Phone,
                    Role = UserRole.admin,
                    LineUserId = request.LineUserId,
                    PasswordHash = passwordHash,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                db.Users.Add(user);
                await db.SaveChangesAsync(ct);

                // 5. Create Teacher profile
                var adminFullName = request.Admin?.FullName ?? "Admin";
                var teacher = new Teacher
                {
                    InstituteId = institute.Id,
                    UserId = user.Id,
                    FullName = adminFullName
                };

                db.Teachers.Add(teacher);

                // 6. Create PdpaConsent
                db.PdpaConsents.Add(new PdpaConsent
                {
                    UserId = user.Id,
                    ConsentVersion = string.IsNullOrWhiteSpace(request.PdpaConsentVersion) ? "1.0" : request.PdpaConsentVersion,
                    IsAccepted = request.AcceptPdpa,
                    IpAddress = ipAddress,
                    AcceptedAt = DateTime.UtcNow
                });

                await db.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                // 7. Generate JWT token
                var token = tokenService.GenerateToken(user);

                httpContext.Response.Cookies.Append("auth_token", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddHours(1),
                    Path = "/"
                });

                return Results.Created($"/api/auth/me", new
                {
                    status = "success",
                    message = "ลงทะเบียนสถาบันสำเร็จ",
                    token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        role = user.Role.ToString(),
                        instituteId = institute.Id,
                        instituteName = institute.Name
                    }
                });
            });
        }
        catch (Exception)
        {
            return Results.Problem("เกิดข้อผิดพลาดในการลงทะเบียนสถาบัน กรุณาลองใหม่อีกครั้ง", statusCode: 500);
        }
    }
}

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, int UserId, string Email, string Role, string RefreshToken, int InstituteId);
public record RefreshTokenRequest(string Token);