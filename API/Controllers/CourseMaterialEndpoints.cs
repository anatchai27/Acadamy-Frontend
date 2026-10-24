using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using academy_API.Data;
using academy_API.Models;
using academy_API.Services.Interface;
using academy_API.Utilities;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class CourseMaterialEndpoints
{
    private const long MaxFileSize = 20 * 1024 * 1024;
    private static readonly Dictionary<string, string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg",
        [".png"] = "image/png", [".webp"] = "image/webp"
    };

    public static IEndpointRouteBuilder MapCourseMaterialEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/course-materials").WithTags("CourseMaterials").WithOpenApi().RequireAuthorization();

        group.MapGet("/course/{courseId:int}", async (int courseId, HttpContext http, TutoringDbContext db, CancellationToken ct) =>
        {
            if (!await CanManageCourseAsync(db, http, courseId, ct)) return ForbiddenOrUnauthorized(http);
            var materials = await db.CourseMaterials.Where(m => m.CourseId == courseId)
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => new MaterialResponse(m.Id, m.CourseId, m.OriginalFileName, m.ContentType, m.FileSizeBytes, m.CreatedAt))
                .ToListAsync(ct);
            return Results.Ok(new { status = "success", data = materials });
        });

        group.MapPost("/course/{courseId:int}", async (int courseId, IFormFile file, HttpContext http, TutoringDbContext db, IFileStorageService storage, CancellationToken ct) =>
        {
            var instituteId = http.GetInstituteId();
            var userId = GetUserId(http);
            if (!instituteId.HasValue || !userId.HasValue) return Results.Unauthorized();
            if (!await CanManageCourseAsync(db, http, courseId, ct)) return ForbiddenOrUnauthorized(http);
            if (file is null || file.Length == 0) return Results.BadRequest(new { code = "FILE_REQUIRED", message = "กรุณาเลือกไฟล์" });
            if (file.Length > MaxFileSize) return Results.BadRequest(new { code = "FILE_TOO_LARGE", message = "ไฟล์ต้องมีขนาดไม่เกิน 20 MB" });

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedTypes.TryGetValue(extension, out var expectedType)
                || (file.ContentType != expectedType && file.ContentType != "application/octet-stream"))
                return Results.BadRequest(new { code = "FILE_TYPE_NOT_ALLOWED", message = "รองรับ PDF, DOCX, PPTX, XLSX และรูปภาพ JPG, PNG, WEBP" });

            var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == courseId, ct);
            if (course is null) return Results.NotFound();
            var key = $"course-materials/{instituteId.Value}/{courseId}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            try
            {
                await using var stream = file.OpenReadStream();
                await storage.UploadPrivateAsync(stream, key, expectedType, ct);
                var material = new CourseMaterial
                {
                    InstituteId = instituteId.Value,
                    CourseId = courseId,
                    ObjectKey = key,
                    OriginalFileName = Path.GetFileName(file.FileName),
                    ContentType = expectedType,
                    FileSizeBytes = file.Length,
                    UploadedBy = userId.Value,
                    CreatedAt = DateTime.UtcNow
                };
                db.CourseMaterials.Add(material);
                await db.SaveChangesAsync(ct);
                return Results.Created($"/api/course-materials/{material.Id}", new MaterialResponse(material.Id, courseId, material.OriginalFileName, material.ContentType, material.FileSizeBytes, material.CreatedAt));
            }
            catch
            {
                await storage.DeleteAsync(storage.GetPublicUrl(key), ct);
                throw;
            }
        }).DisableAntiforgery();

        group.MapDelete("/{materialId:long}", async (long materialId, HttpContext http, TutoringDbContext db, IFileStorageService storage, CancellationToken ct) =>
        {
            var material = await db.CourseMaterials.FirstOrDefaultAsync(m => m.Id == materialId, ct);
            if (material is null) return Results.NotFound();
            if (!await CanManageCourseAsync(db, http, material.CourseId, ct)) return ForbiddenOrUnauthorized(http);
            await storage.DeleteAsync(storage.GetPublicUrl(material.ObjectKey), ct);
            db.CourseMaterials.Remove(material);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        group.MapGet("/{materialId:long}/download", async (long materialId, HttpContext http, TutoringDbContext db, IFileStorageService storage, CancellationToken ct) =>
        {
            var material = await db.CourseMaterials.FirstOrDefaultAsync(m => m.Id == materialId, ct);
            if (material is null) return Results.NotFound();
            if (!await CanAccessMaterialAsync(db, http, material, ct)) return ForbiddenOrUnauthorized(http);
            var url = storage.GetSignedUrl(material.ObjectKey, material.ContentType, material.OriginalFileName, TimeSpan.FromMinutes(5));
            return Results.Ok(new { url });
        });

        return app;
    }

    public static IEndpointRouteBuilder MapParentCourseMaterialEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/parents/children/{childId:int}/materials", async (int childId, HttpContext http, TutoringDbContext db, CancellationToken ct) =>
        {
            var userId = GetUserId(http);
            if (!userId.HasValue) return Results.Unauthorized();
            var ownsChild = await db.Parents.AnyAsync(p => p.UserId == userId.Value && p.StudentId == childId, ct);
            if (!ownsChild) return Results.Forbid();

            var rows = await (from enrollment in db.Enrollments
                              join course in db.Courses on enrollment.CourseId equals course.Id
                              join material in db.CourseMaterials on course.Id equals material.CourseId
                              where enrollment.StudentId == childId
                              orderby course.Name, material.CreatedAt descending
                              select new ParentMaterialResponse(material.Id, course.Id, course.Name, material.OriginalFileName, material.ContentType, material.FileSizeBytes, material.CreatedAt))
                .ToListAsync(ct);
            return Results.Ok(new { status = "success", data = rows });
        }).WithTags("Parents").RequireAuthorization();
        return app;
    }

    private static async Task<bool> CanAccessMaterialAsync(TutoringDbContext db, HttpContext http, CourseMaterial material, CancellationToken ct)
    {
        if (await CanManageCourseAsync(db, http, material.CourseId, ct)) return true;
        var userId = GetUserId(http);
        if (!userId.HasValue) return false;
        var role = http.User.FindFirst(ClaimTypes.Role)?.Value;
        if (string.Equals(role, "student", StringComparison.OrdinalIgnoreCase))
            return await (from student in db.Students
                          join enrollment in db.Enrollments on student.Id equals enrollment.StudentId
                          where student.UserId == userId.Value && enrollment.CourseId == material.CourseId
                          select student.Id).AnyAsync(ct);
        return await (from parent in db.Parents
                      join enrollment in db.Enrollments on parent.StudentId equals enrollment.StudentId
                      where parent.UserId == userId.Value && enrollment.CourseId == material.CourseId
                      select parent.StudentId).AnyAsync(ct);
    }

    private static async Task<bool> CanManageCourseAsync(TutoringDbContext db, HttpContext http, int courseId, CancellationToken ct)
    {
        var roles = http.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (!roles.Overlaps(["admin", "staff", "teacher"])) return false;
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == courseId, ct);
        if (course is null) return false;
        if (roles.Contains("admin") || roles.Contains("staff")) return true;
        var userId = GetUserId(http);
        return userId.HasValue && course.TeacherId.HasValue
            && await db.Teachers.AnyAsync(t => t.Id == course.TeacherId && t.UserId == userId.Value, ct);
    }

    private static int? GetUserId(HttpContext http)
    {
        var value = http.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? http.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    private static IResult ForbiddenOrUnauthorized(HttpContext http) =>
        http.User.Identity?.IsAuthenticated == true ? Results.Forbid() : Results.Unauthorized();

    private sealed record MaterialResponse(long Id, int CourseId, string FileName, string ContentType, long SizeBytes, DateTime CreatedAt);
    private sealed record ParentMaterialResponse(long Id, int CourseId, string CourseName, string FileName, string ContentType, long SizeBytes, DateTime CreatedAt);
}