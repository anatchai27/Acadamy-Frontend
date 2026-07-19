using academy_API.Data;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

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

            return await query
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
                    UserEmail = t.User != null ? t.User.Email : null
                })
                .ToListAsync(ct);
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
                    UserEmail = t.User != null ? t.User.Email : null
                })
                .FirstOrDefaultAsync(ct);

            if (teacher is null)
                return Results.NotFound(new { Error = "Teacher not found." });

            return Results.Ok(teacher);
        });

        group.MapPost("/", async (TeacherRequest request, HttpContext httpContext, TutoringDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                return Results.BadRequest(new { Error = "FullName is required." });

            var teacher = new Models.Teacher
            {
                InstituteId = 0,
                FullName = request.FullName.Trim(),
                Specialization = request.Specialization?.Trim(),
                Bio = request.Bio?.Trim(),
                HourlyRate = request.HourlyRate,
                PhotoUrl = request.PhotoUrl?.Trim()
            };

            db.Teachers.Add(teacher);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/teachers/{teacher.Id}", new
            {
                teacher.Id,
                teacher.InstituteId,
                teacher.UserId,
                teacher.FullName,
                teacher.Specialization,
                teacher.Bio,
                teacher.HourlyRate,
                teacher.PhotoUrl
            });
        });

        group.MapPut("/{id:int}", async (int id, TeacherRequest request, HttpContext httpContext, TutoringDbContext db, CancellationToken ct) =>
        {
            var teacher = await db.Teachers.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (teacher is null)
                return Results.NotFound(new { error = "Teacher not found." });

            if (string.IsNullOrWhiteSpace(request.FullName))
                return Results.BadRequest(new { error = "FullName is required." });

            teacher.FullName = request.FullName.Trim();
            teacher.Specialization = request.Specialization?.Trim();
            teacher.Bio = request.Bio?.Trim();
            teacher.HourlyRate = request.HourlyRate;
            teacher.PhotoUrl = request.PhotoUrl?.Trim();

            await db.SaveChangesAsync(ct);

            return Results.Ok(new { status = "success", message = "แก้ไขข้อมูลครูสำเร็จ" });
        });

        group.MapDelete("/{id:int}", async (int id, HttpContext httpContext, TutoringDbContext db, CancellationToken ct) =>
        {
            var teacher = await db.Teachers.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (teacher is null)
                return Results.NotFound(new { error = "Teacher not found." });

            db.Teachers.Remove(teacher);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new { status = "success", message = "ลบครูผู้สอนสำเร็จ" });
        });

        return app;
    }
}

public record TeacherRequest(
    string FullName,
    string? Specialization,
    string? Bio,
    decimal? HourlyRate,
    string? PhotoUrl
);