using academy_API.DTOs;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class CourseEndpoints
{
    public static IEndpointRouteBuilder MapCourseEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/courses")
            .WithTags("Courses")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/", async (
            ICourseService service,
            HttpContext httpContext,
            string? search,
            int? teacher_id,
            CancellationToken ct) =>
        {
            var result = await service.GetAllAsync(search, teacher_id, ct);
            return Results.Ok(result);
        });

        group.MapGet("/{id:int}", async (
            int id,
            ICourseService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var course = await service.GetByIdAsync(id, ct);
            return course is null
                ? Results.NotFound(new { Status = "error", Message = "ไม่พบคอร์สเรียน" })
                : Results.Ok(new
                {
                    course.Id,
                    course.InstituteId,
                    course.Name,
                    course.Subject,
                    course.TotalSessions,
                    course.Price,
                    course.TeacherId,
                    course.CreatedAt,
                    TeacherName = course.Teacher?.FullName
                });
        });

        group.MapPost("/", async (
            CreateCourseRequest request,
            ICourseService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var instituteIdClaim = httpContext.User.FindFirst("institute_id")?.Value;
                if (string.IsNullOrEmpty(instituteIdClaim) || !int.TryParse(instituteIdClaim, out var instituteId))
                    return Results.BadRequest(new { Status = "error", Message = "Institute not identified." });

                var result = await service.CreateAsync(request, instituteId, ct);
                return Results.Created($"/api/courses/{result.Data.CourseId}", result);
            }
            catch (CourseValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
            catch (DbUpdateException)
            {
                return Results.Problem("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง", statusCode: 500);
            }
        });

        group.MapPut("/{id:int}", async (
            int id,
            UpdateCourseRequest request,
            ICourseService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var result = await service.UpdateAsync(id, request, ct);
                return Results.Ok(result);
            }
            catch (CourseValidationException ex) when (ex.ErrorCode == "NOT_FOUND")
            {
                return Results.NotFound(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
            catch (CourseValidationException ex) when (ex.ErrorCode == "FORBIDDEN")
            {
                return Results.Json(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message }, statusCode: 403);
            }
            catch (CourseValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
            catch (DbUpdateException)
            {
                return Results.Problem("เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง", statusCode: 500);
            }
        });

        return app;
    }
}