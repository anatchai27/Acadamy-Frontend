using academy_API.Services.Interface;
using academy_API.Utilities;
using Microsoft.EntityFrameworkCore;
using academy_API.Data;

namespace academy_API.Controllers;

public static class FileUploadEndpoints
{
    public static IEndpointRouteBuilder MapFileUploadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/uploads")
            .WithTags("File Uploads")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapPost("/logo", async (
            HttpContext httpContext,
            TutoringDbContext db,
            IFormFile file,
            IFileStorageService storage,
            CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No file uploaded." });

            if (!file.ContentType.StartsWith("image/"))
                return Results.BadRequest(new { error = "Only image files are allowed." });

            if (file.Length > 2 * 1024 * 1024)
                return Results.BadRequest(new { error = "File size must not exceed 2MB." });

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"logos/institute_{instituteId}_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";

            await using var stream = file.OpenReadStream();
            var fileUrl = await storage.UploadAsync(stream, fileName, file.ContentType, ct);

            var institute = await db.Institutes.FirstOrDefaultAsync(i => i.Id == instituteId, ct);
            if (institute is not null)
            {
                institute.LogoUrl = fileUrl;
                institute.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);
            }

            return Results.Ok(new { status = "success", data = new { logoUrl = fileUrl } });
        })
        .DisableAntiforgery();

        group.MapPost("/payment-slip", async (
            HttpContext httpContext,
            TutoringDbContext db,
            IFormFile file,
            int paymentId,
            IFileStorageService storage,
            CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No file uploaded." });

            if (!file.ContentType.StartsWith("image/"))
                return Results.BadRequest(new { error = "Only image files are allowed." });

            if (file.Length > 5 * 1024 * 1024)
                return Results.BadRequest(new { error = "File size must not exceed 5MB." });

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"slips/payment_{paymentId}_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";

            await using var stream = file.OpenReadStream();
            var fileUrl = await storage.UploadAsync(stream, fileName, file.ContentType, ct);

            var payment = await db.Payments
                .Where(p => p.Id == paymentId && p.Enrollment.Course.InstituteId == instituteId)
                .FirstOrDefaultAsync(ct);

            if (payment is not null)
            {
                payment.SlipUrl = fileUrl;
                await db.SaveChangesAsync(ct);
            }

            return Results.Ok(new { status = "success", data = new { slipUrl = fileUrl } });
        })
        .DisableAntiforgery();

        group.MapPost("/homework", async (
            HttpContext httpContext,
            IFormFile file,
            int homeworkId,
            IFileStorageService storage,
            CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No file uploaded." });

            if (file.Length > 10 * 1024 * 1024)
                return Results.BadRequest(new { error = "File size must not exceed 10MB." });

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"homeworks/homework_{homeworkId}_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";

            await using var stream = file.OpenReadStream();
            var fileUrl = await storage.UploadAsync(stream, fileName, file.ContentType, ct);

            return Results.Ok(new { status = "success", data = new { fileUrl } });
        })
        .DisableAntiforgery();

        group.MapPost("/homework-submission", async (
            HttpContext httpContext,
            IFormFile file,
            int submissionId,
            IFileStorageService storage,
            CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No file uploaded." });

            if (file.Length > 10 * 1024 * 1024)
                return Results.BadRequest(new { error = "File size must not exceed 10MB." });

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"submissions/submission_{submissionId}_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";

            await using var stream = file.OpenReadStream();
            var fileUrl = await storage.UploadAsync(stream, fileName, file.ContentType, ct);

            return Results.Ok(new { status = "success", data = new { fileUrl } });
        })
        .DisableAntiforgery();

        group.MapPost("/student-photo", async (
            HttpContext httpContext,
            IFormFile file,
            int studentId,
            IFileStorageService storage,
            TutoringDbContext db,
            CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No file uploaded." });

            if (!file.ContentType.StartsWith("image/"))
                return Results.BadRequest(new { error = "Only image files are allowed." });

            if (file.Length > 5 * 1024 * 1024)
                return Results.BadRequest(new { error = "File size must not exceed 5MB." });

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"photos/student_{studentId}_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}";

            await using var stream = file.OpenReadStream();
            var fileUrl = await storage.UploadAsync(stream, fileName, file.ContentType, ct);

            var student = await db.Students
                .Where(s => s.Id == studentId && s.InstituteId == instituteId)
                .FirstOrDefaultAsync(ct);

            if (student is not null)
            {
                student.PhotoUrl = fileUrl;
                await db.SaveChangesAsync(ct);
            }

            return Results.Ok(new { status = "success", data = new { photoUrl = fileUrl } });
        })
        .DisableAntiforgery();

        return app;
    }
}