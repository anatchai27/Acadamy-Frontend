using System.Text;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services.Contracts;
using academy_API.Services;
using academy_API.Utilities;
using academy_API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace academy_API.Controllers;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var listGroup = app.MapGroup("/api/users")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization(new AuthorizeAttribute { Roles = "admin" });
        var permissionsGroup = app.MapGroup("/api/users/permissions")
            .WithTags("Users")
            .WithOpenApi()
            .RequireAuthorization();

        permissionsGroup.MapPut("/", async (
            UpdatePermissionsRequest request,
            HttpContext httpContext,
            TutoringDbContext context) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "Institute not identified." });

            return await SavePermissionsAsync(context, instituteId.Value, request);
        }).RequireAuthorization(new AuthorizeAttribute { Roles = "admin" });

        permissionsGroup.MapGet("/{role}", async (
            string role,
            HttpContext httpContext,
            TutoringDbContext context) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "Institute not identified." });
            if (!Enum.TryParse<UserRole>(role, true, out var parsedRole))
                return Results.BadRequest(new { error = "Invalid role." });

            var stored = await context.RolePermissions
                .AsNoTracking()
                .Where(permission => permission.InstituteId == instituteId.Value && permission.Role == parsedRole)
                .ToListAsync();
            var permissions = stored.Count == 0
                ? PermissionPolicyStore.GetOrDefault(instituteId.Value, parsedRole)
                : stored.ToDictionary(
                    permission => permission.PageKey,
                    permission => new PermissionActions(permission.CanRead, permission.CanEdit, permission.CanDelete));

            return Results.Ok(new { role = parsedRole.ToString(), permissions });
        });

        listGroup.MapGet("/", async (HttpContext httpContext, IUserService userService, CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "Institute not identified." });

            var users = await userService.GetByInstituteIdAsync(instituteId.Value, ct);
            return Results.Ok(users.Select(user => new
            {
                user.Id,
                user.Email,
                user.Phone,
                role = user.Role.ToString(),
                user.CreatedAt,
                fullName = user.Teacher?.FullName ?? user.Student?.FullName
            }));
        });

        listGroup.MapGet("/{id:int}", async (int id, IUserService userService, CancellationToken ct) =>
        {
            var user = await userService.GetByIdAsync(id, ct);
            return user is null
                ? Results.NotFound(new { Error = "User not found." })
                : Results.Ok(new
                {
                    user.Id,
                    user.Email,
                    user.Phone,
                    role = user.Role.ToString(),
                    user.CreatedAt,
                    fullName = user.Teacher?.FullName ?? user.Student?.FullName
                });
        });

        listGroup.MapPost("/", async (
            HttpContext httpContext,
            CreateStaffRequest request,
            IUserService userService,
            CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "Institute not identified." });

            try
            {
                var user = await userService.CreateStaffAsync(request, instituteId.Value, ct);
                return Results.Created($"/api/users/{user.Id}", new
                {
                    user.Id,
                    user.Email,
                    user.Role,
                    user.Phone,
                    fullName = request.FullName
                });
            }
            catch (UserValidationException ex) when (ex.Code == "EMAIL_CONFLICT")
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (UserValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        listGroup.MapPut("/{id:int}/role", async (
            int id,
            UpdateRoleRequest request,
            IUserService userService,
            CancellationToken ct) =>
        {
            var result = await userService.UpdateRoleForManagementAsync(id, request.Role, ct);
            return result switch
            {
                UserManagementResult.Updated => Results.Ok(new { status = "success", message = "อัปเดตสิทธิ์ผู้ใช้สำเร็จ" }),
                UserManagementResult.PrimaryAdmin => Results.BadRequest(new { error = "Cannot change role of the primary admin." }),
                _ => Results.NotFound(new { error = "User not found in your institute." })
            };
        });

        listGroup.MapPut("/{id:int}/password", async (
            int id,
            UpdatePasswordRequest request,
            IUserService userService,
            CancellationToken ct) =>
        {
            try
            {
                var result = await userService.UpdatePasswordForManagementAsync(id, request.NewPassword, ct);
                return result switch
                {
                    UserManagementResult.Updated => Results.Ok(new { status = "success", message = "เปลี่ยนรหัสผ่านผู้ใช้สำเร็จ" }),
                    _ => Results.NotFound(new { error = "User not found in your institute." })
                };
            }
            catch (UserValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message, code = ex.Code });
            }
        });

        async Task<IResult> SavePermissionsAsync(TutoringDbContext context, int instituteId, UpdatePermissionsRequest request)
        {
            var existing = await context.RolePermissions
                .Where(permission => permission.InstituteId == instituteId && permission.Role == request.Role)
                .ToListAsync();
            var existingByPage = existing.ToDictionary(permission => permission.PageKey);
            var now = DateTime.UtcNow;

            foreach (var entry in request.Permissions)
            {
                if (existingByPage.TryGetValue(entry.Key, out var permission))
                {
                    permission.CanRead = entry.Value.Read;
                    permission.CanEdit = entry.Value.Edit;
                    permission.CanDelete = entry.Value.Delete;
                    permission.UpdatedAt = now;
                }
                else
                {
                    context.RolePermissions.Add(new RolePermission
                    {
                        InstituteId = instituteId,
                        Role = request.Role,
                        PageKey = entry.Key,
                        CanRead = entry.Value.Read,
                        CanEdit = entry.Value.Edit,
                        CanDelete = entry.Value.Delete,
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                }
            }

            await context.SaveChangesAsync();
            return Results.Ok(new { status = "success", message = "บันทึก permission สำเร็จ", role = request.Role.ToString(), permissions = request.Permissions });
        }

        listGroup.MapDelete("/{id:int}", async (int id, IUserService userService, CancellationToken ct) =>
        {
            var result = await userService.DeleteForManagementAsync(id, ct);
            return result switch
            {
                UserManagementResult.Deleted => Results.Ok(new { status = "success", message = "ลบผู้ใช้สำเร็จ" }),
                UserManagementResult.PrimaryAdmin => Results.BadRequest(new { error = "Cannot delete the primary admin." }),
                _ => Results.NotFound(new { error = "User not found in your institute." })
            };
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
        HttpContext httpContext,
        CancellationToken ct)
    {
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString()
            ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        try
        {
            var result = await userService.RegisterAsync(request, ipAddress, ct);
            return Results.Created($"/api/users/{result.User.Id}", new
            {
                result.User.Id,
                result.User.Email,
                result.User.Role,
                instituteId = result.Institute?.Id,
                instituteName = result.Institute?.Name
            });
        }
        catch (UserValidationException ex)
        {
            return Results.BadRequest(new { Error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { Error = ex.Message });
        }
    }

    private static async Task<IResult> ForgetPassword(
        ForgetPasswordRequest request,
        IUserService userService,
        IEmailService emailService,
        IConfiguration config,
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
                // Do not expose mail provider errors or reveal account existence.
            }
        }

        return Results.Ok(new { Message = "If the email exists, a reset link has been sent." });
    }

    private static async Task<IResult> ResetPassword(
        ResetPasswordRequest request,
        IUserService userService,
        CancellationToken ct)
    {
        var success = await userService.ResetPasswordAsync(request.Email, request.Token, request.NewPassword, ct);
        return success
            ? Results.Ok(new { Message = "Password reset successfully." })
            : Results.BadRequest(new { Error = "Invalid or expired reset token." });
    }
}
