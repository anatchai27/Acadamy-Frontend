using academy_API.Data;
using academy_API.Models;
using academy_API.Utilities;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public record CreateTeacherRequest(
    string FullName,
    string? Specialization,
    string? Bio,
    decimal? HourlyRate,
    string? PhotoUrl,
    string? BankAccountInfo,
    string? TaxId,
    string? Status,
    string? UserEmail,
    string? UserPassword,
    string? UserRole
);

public record PatchTeacherRequest(
    string? FullName,
    string? Specialization,
    string? Bio,
    decimal? HourlyRate,
    string? PhotoUrl,
    string? BankAccountInfo,
    string? TaxId,
    string? Status
);

public static class TeacherEndpoints
{
    public static IEndpointRouteBuilder MapTeacherEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/teachers")
            .WithTags("Teachers")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/", async (HttpContext httpContext, TutoringDbContext db, CancellationToken ct) =>
        {
            var query = db.Teachers.AsQueryable();

            var search = httpContext.Request.Query["search"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(t =>
                    t.FullName.Contains(term) ||
                    (t.Specialization != null && t.Specialization.Contains(term)) ||
                    (t.User != null && t.User.Email.Contains(term)));
            }

            var items = await query
                .OrderBy(t => t.FullName)
                .Select(t => new
                {
                    t.Id,
                    t.InstituteId,
                    t.UserId,
                    t.FullName,
                    t.Specialization,
                    t.Bio,
                    t.HourlyRate,
                    t.PhotoUrl,
                    t.BankAccountInfo,
                    t.TaxId,
                    t.Status,
                    UserEmail = t.User != null ? t.User.Email : null
                })
                .ToListAsync(ct);

            return Results.Ok(new { status = "success", data = items });
        });

        group.MapGet("/{id:int}", async (int id, HttpContext httpContext, TutoringDbContext db, CancellationToken ct) =>
        {
            var teacher = await db.Teachers
                .Where(t => t.Id == id)
                .Select(t => new
                {
                    t.Id,
                    t.InstituteId,
                    t.UserId,
                    t.FullName,
                    t.Specialization,
                    t.Bio,
                    t.HourlyRate,
                    t.PhotoUrl,
                    t.BankAccountInfo,
                    t.TaxId,
                    t.Status,
                    UserEmail = t.User != null ? t.User.Email : null
                })
                .FirstOrDefaultAsync(ct);

            if (teacher is null)
                return Results.NotFound(new { status = "error", message = "Teacher not found." });

            return Results.Ok(new { status = "success", data = teacher });
        });

        group.MapPost("/", async (CreateTeacherRequest request, HttpContext httpContext, TutoringDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                return Results.BadRequest(new { status = "error", message = "FullName is required." });

            var instituteId = httpContext.GetInstituteId() ?? 0;

            User? user = null;
            if (!string.IsNullOrWhiteSpace(request.UserEmail) && !string.IsNullOrWhiteSpace(request.UserPassword))
            {
                var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == request.UserEmail.Trim(), ct);
                if (existing is not null)
                    return Results.Conflict(new { status = "error", message = "อีเมลนี้มีผู้ใช้อยู่ในระบบแล้ว" });

                var now = DateTime.UtcNow;
                user = new User
                {
                    InstituteId = instituteId,
                    Email = request.UserEmail.Trim(),
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.UserPassword),
                    Role = Enum.TryParse<UserRole>(request.UserRole, ignoreCase: true, out var role) ? role : UserRole.teacher,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                db.Users.Add(user);
                await db.SaveChangesAsync(ct);
            }

            var teacher = new Models.Teacher
            {
                InstituteId = instituteId,
                UserId = user?.Id,
                FullName = request.FullName.Trim(),
                Specialization = request.Specialization?.Trim(),
                Bio = request.Bio?.Trim(),
                HourlyRate = request.HourlyRate,
                PhotoUrl = request.PhotoUrl?.Trim(),
                BankAccountInfo = request.BankAccountInfo?.Trim(),
                TaxId = request.TaxId?.Trim(),
                Status = request.Status?.Trim() ?? "active",
            };

            db.Teachers.Add(teacher);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/teachers/{teacher.Id}", new
            {
                status = "success",
                message = "เพิ่มครูผู้สอนสำเร็จ",
                data = new
                {
                    teacher.Id,
                    teacher.InstituteId,
                    teacher.UserId,
                    teacher.FullName,
                    teacher.Specialization,
                    teacher.Bio,
                    teacher.HourlyRate,
                    teacher.PhotoUrl,
                    teacher.BankAccountInfo,
                    teacher.TaxId,
                    teacher.Status,
                    UserEmail = user?.Email,
                }
            });
        });

        group.MapPatch("/{id:int}", async (int id, PatchTeacherRequest request, HttpContext httpContext, TutoringDbContext db, CancellationToken ct) =>
        {
            var teacher = await db.Teachers.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (teacher is null)
                return Results.NotFound(new { status = "error", message = "Teacher not found." });

            if (request.FullName is not null)
            {
                if (string.IsNullOrWhiteSpace(request.FullName))
                    return Results.BadRequest(new { status = "error", message = "FullName cannot be empty." });
                teacher.FullName = request.FullName.Trim();
            }

            if (request.Specialization is not null)
                teacher.Specialization = string.IsNullOrWhiteSpace(request.Specialization) ? null : request.Specialization.Trim();

            if (request.Bio is not null)
                teacher.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();

            if (request.HourlyRate is not null)
                teacher.HourlyRate = request.HourlyRate;

            if (request.PhotoUrl is not null)
                teacher.PhotoUrl = string.IsNullOrWhiteSpace(request.PhotoUrl) ? null : request.PhotoUrl.Trim();

            if (request.BankAccountInfo is not null)
                teacher.BankAccountInfo = string.IsNullOrWhiteSpace(request.BankAccountInfo) ? null : request.BankAccountInfo.Trim();

            if (request.TaxId is not null)
                teacher.TaxId = string.IsNullOrWhiteSpace(request.TaxId) ? null : request.TaxId.Trim();

            if (request.Status is not null)
                teacher.Status = string.IsNullOrWhiteSpace(request.Status) ? null : request.Status.Trim();

            await db.SaveChangesAsync(ct);

            return Results.Ok(new { status = "success", message = "แก้ไขข้อมูลครูสำเร็จ" });
        });

        group.MapDelete("/{id:int}", async (int id, HttpContext httpContext, TutoringDbContext db, CancellationToken ct) =>
        {
            var teacher = await db.Teachers.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (teacher is null)
                return Results.NotFound(new { status = "error", message = "Teacher not found." });

            db.Teachers.Remove(teacher);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new { status = "success", message = "ลบครูผู้สอนสำเร็จ" });
        });

        return app;
    }
}