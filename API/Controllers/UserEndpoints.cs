using System.Text;
using academy_API.Data;
using academy_API.Models;
using academy_API.Services.Contracts;
using academy_API.Utilities;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var listGroup = app.MapGroup("/api/users")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization();

        listGroup.MapGet("/", async (HttpContext httpContext, IUserService userService, CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            var users = await userService.GetByInstituteIdAsync(instituteId.Value, ct);
            return Results.Ok(users);
        });

        listGroup.MapGet("/{id:int}", async (int id, IUserService userService, CancellationToken ct) =>
        {
            var user = await userService.GetByIdAsync(id, ct);
            return user is null
                ? Results.NotFound(new { Error = "User not found." })
                : Results.Ok(user);
        });

        listGroup.MapPost("/", async (
            HttpContext httpContext,
            TutoringDbContext db,
            CreateStaffRequest request,
            ITokenService tokenService,
            CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            var email = request.Email?.Trim().ToLower();
            if (string.IsNullOrEmpty(email))
                return Results.BadRequest(new { error = "Email is required." });

            if (string.IsNullOrEmpty(request.Password))
                return Results.BadRequest(new { error = "Password is required." });

            if (request.Role is not (UserRole.admin or UserRole.teacher or UserRole.staff))
                return Results.BadRequest(new { error = "Invalid role. Choose admin, teacher, or staff." });

            if (await db.Users.AnyAsync(u => u.Email == email, ct))
                return Results.BadRequest(new { error = "Email is already registered." });

            if (string.IsNullOrEmpty(request.FullName))
                return Results.BadRequest(new { error = "Full name is required for teacher/staff." });

            var passwordHash = tokenService.HashPassword(request.Password);

            var user = new User
            {
                InstituteId = instituteId,
                Email = email,
                Phone = request.Phone,
                Role = request.Role,
                PasswordHash = passwordHash,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Users.Add(user);
            await db.SaveChangesAsync(ct);

            if (request.Role is UserRole.teacher or UserRole.admin)
            {
                db.Teachers.Add(new Teacher
                {
                    InstituteId = instituteId,
                    UserId = user.Id,
                    FullName = request.FullName
                });
                await db.SaveChangesAsync(ct);
            }

            return Results.Created($"/api/users/{user.Id}", new
            {
                user.Id,
                user.Email,
                user.Role,
                user.Phone,
                fullName = request.FullName
            });
        });

        listGroup.MapPut("/{id:int}/role", async (
            int id,
            HttpContext httpContext,
            IUserService userService,
            TutoringDbContext db,
            UpdateRoleRequest request,
            CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.InstituteId == instituteId, ct);
            if (user is null)
                return Results.NotFound(new { error = "User not found in your institute." });

            if (user.Role == UserRole.admin)
                return Results.BadRequest(new { error = "Cannot change role of the primary admin." });

            var success = await userService.UpdateRoleAsync(id, request.Role, ct);
            return success
                ? Results.Ok(new { status = "success", message = "อัปเดตสิทธิ์ผู้ใช้สำเร็จ" })
                : Results.NotFound(new { error = "User not found." });
        });

        listGroup.MapDelete("/{id:int}", async (
            int id,
            HttpContext httpContext,
            IUserService userService,
            TutoringDbContext db,
            CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.InstituteId == instituteId, ct);
            if (user is null)
                return Results.NotFound(new { error = "User not found in your institute." });

            if (user.Role == UserRole.admin)
                return Results.BadRequest(new { error = "Cannot delete the primary admin." });

            var success = await userService.DeleteUserAsync(id, ct);
            return success
                ? Results.Ok(new { status = "success", message = "ลบผู้ใช้สำเร็จ" })
                : Results.NotFound(new { error = "User not found." });
        });

        listGroup.MapPost("/register", RegisterUser)
            .WithTags("Users")
            .WithOpenApi()
            .AllowAnonymous();

        listGroup.MapPost("/forget-password", ForgetPassword)
            .WithTags("Users")
            .WithOpenApi()
            .AllowAnonymous();

        listGroup.MapPost("/reset-password", ResetPassword)
            .WithTags("Users")
            .WithOpenApi()
            .AllowAnonymous();

        return listGroup;
    }

    private static async Task<IResult> RegisterUser(
        IUserService userService,
        RegisterUserRequest request,
        TutoringDbContext db,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString()
            ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();

        // Resolve final email: prefer Admin.Email, fallback to request.Email
        var email = request.Admin?.FullName != null && request.Email.Contains("@")
            ? request.Email
            : request.Email;

        var adminFullName = request.Admin?.FullName ?? "Admin";

        var strategy = db.Database.CreateExecutionStrategy();

        try
        {
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync(ct);

                // 1. Create Institute if provided
                int? instituteId = null;
                if (request.Institute?.Name != null)
                {
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
                    instituteId = institute.Id;

                    // TODO: Save logo_base64 → cloud storage → set LogoUrl
                    if (!string.IsNullOrWhiteSpace(request.Institute.LogoBase64))
                    {
                        institute.LogoUrl = request.Institute.LogoBase64;
                    }
                }

                // 2. Build UserCreateRequest from RegisterUserRequest
                var userRequest = new UserCreateRequest
                {
                    Email = email,
                    Password = request.Password,
                    Phone = request.Phone,
                    Role = request.Role,
                    LineUserId = request.LineUserId,
                    AcceptPdpa = request.AcceptPdpa,
                    PdpaConsentVersion = request.PdpaConsentVersion
                };

                // 3. Create user with consent
                var created = await CreateUserInternal(db, userRequest, instituteId, ipAddress, ct);

                // 4. Create Teacher record if Role is admin or teacher
                if (request.Role is UserRole.admin or UserRole.teacher)
                {
                    var teacher = new Teacher
                    {
                        InstituteId = instituteId,
                        UserId = created.Id,
                        FullName = adminFullName
                    };

                    db.Teachers.Add(teacher);
                    await db.SaveChangesAsync(ct);
                }

                await transaction.CommitAsync(ct);

                return Results.Created($"/api/users/{created.Id}", new
                {
                    created.Id,
                    created.Email,
                    created.Role,
                    instituteId,
                    instituteName = request.Institute?.Name
                });
            });
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { Error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { Error = ex.Message });
        }
        catch (DbUpdateException)
        {
            return Results.BadRequest(new { Error = "Failed to create user. Please try again." });
        }
    }

    private static async Task<User> CreateUserInternal(
        TutoringDbContext db,
        UserCreateRequest request,
        int? instituteId,
        string? ipAddress,
        CancellationToken ct)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        if (string.IsNullOrEmpty(request.Password))
            throw new ArgumentException("Password cannot be null or empty.", nameof(request.Password));

        if (string.IsNullOrEmpty(request.Email))
            throw new ArgumentException("Email cannot be null or empty.", nameof(request.Email));

        if (!request.AcceptPdpa)
            throw new InvalidOperationException("PDPA consent must be accepted to create an account.");

        if (await db.Users.AnyAsync(
            u => u.Email == request.Email || (request.Phone != null && u.Phone == request.Phone), ct))
        {
            throw new InvalidOperationException("Email or phone number is already registered.");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            InstituteId = instituteId,
            Email = request.Email,
            Phone = request.Phone,
            Role = request.Role,
            LineUserId = request.LineUserId,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        db.PdpaConsents.Add(new PdpaConsent
        {
            UserId = user.Id,
            ConsentVersion = string.IsNullOrWhiteSpace(request.PdpaConsentVersion) ? "1.0" : request.PdpaConsentVersion,
            IsAccepted = true,
            IpAddress = ipAddress,
            AcceptedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(ct);

        return user;
    }

    private static async Task<IResult> ForgetPassword(
        ForgetPasswordRequest request,
        IUserService userService,
        IEmailService emailService,
        IConfiguration config,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var frontendUrl = config["Frontend:BaseUrl"] ?? "http://localhost:3000";
        var resetLink = $"{frontendUrl}/reset-password?email={Uri.EscapeDataString(request.Email)}";

        var userExists = await userService.ForgetPasswordAsync(request.Email, resetLink, ct);

        if (userExists)
        {
            var emailTemplate = Path.Combine(Directory.GetCurrentDirectory(), "templates", "forgetPasswordEmail.html");
            var htmlBody = await File.ReadAllTextAsync(emailTemplate, Encoding.UTF8, ct);

            htmlBody = htmlBody
                .Replace("{{UserName}}", request.Email.Split('@')[0])
                .Replace("{{ResetLink}}", resetLink)
                .Replace("{{ExpiryTime}}", "1 hour");

            try
            {
                await emailService.SendEmailAsync(request.Email, "Reset Your Password", htmlBody, ct);
            }
            catch
            {
                // Log error but don't expose it to the client
            }
        }

        // Always return success to prevent email enumeration
        return Results.Ok(new { Message = "If the email exists, a reset link has been sent." });
    }

    private static async Task<IResult> ResetPassword(
        ResetPasswordRequest request,
        IUserService userService,
        CancellationToken ct)
    {
        var success = await userService.ResetPasswordAsync(request.Email, request.Token, request.NewPassword, ct);

        if (!success)
        {
            return Results.BadRequest(new { Error = "Invalid or expired reset token." });
        }

        return Results.Ok(new { Message = "Password reset successfully." });
    }
}

public record ForgetPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record CreateStaffRequest(string Email, string Password, string? Phone, UserRole Role, string FullName);
public record UpdateRoleRequest(UserRole Role);