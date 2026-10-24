using System.Security.Claims;
using academy_API.DTOs;
using academy_API.Services;
using academy_API.Utilities;

namespace academy_API.Controllers;

public static class HomeworkEndpoints
{
    public static IEndpointRouteBuilder MapHomeworkEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/homeworks")
            .WithTags("Homeworks")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapPost("/", async (
            HomeworkRequest request,
            IHomeworkService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId) || userId <= 0)
                    return Results.Unauthorized();

                var result = await service.CreateAsync(request, userId, ct);
                return Results.Created($"/api/homeworks/{result.Data.HomeworkId}", result);
            }
            catch (HomeworkValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapGet("/course/{courseId:int}", async (
            int courseId,
            IHomeworkService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var result = await service.GetByCourseIdAsync(courseId, ct);
            return Results.Ok(result);
        });

        group.MapGet("/{homeworkId:int}/submissions", async (
            int homeworkId,
            IHomeworkService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var result = await service.GetSubmissionsAsync(homeworkId, ct);
                return Results.Ok(result);
            }
            catch (HomeworkValidationException ex)
            {
                return Results.NotFound(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapGet("/{homeworkId:int}/submission-roster", async (
            int homeworkId,
            IHomeworkService service,
            HttpContext context,
            CancellationToken ct) =>
        {
            if (!TryGetStaffIdentity(context, out var userId, out var isAdmin))
                return context.User.Identity?.IsAuthenticated == true ? Results.Forbid() : Results.Unauthorized();
            var instituteId = context.GetInstituteId();
            if (!instituteId.HasValue) return Results.BadRequest(new { error = "User not associated with any institute." });

            try
            {
                var students = await service.GetSubmissionRosterAsync(homeworkId, instituteId.Value, userId, isAdmin, ct);
                return Results.Ok(new { status = "success", data = new { students } });
            }
            catch (HomeworkValidationException ex)
            {
                return ex.ErrorCode == "FORBIDDEN"
                    ? Results.Forbid()
                    : Results.NotFound(new { status = "error", code = ex.ErrorCode, error = ex.Message });
            }
        });

        group.MapPost("/{homeworkId:int}/students/{studentId:int}/submission", async (
            int homeworkId,
            int studentId,
            IHomeworkService service,
            HttpContext context,
            CancellationToken ct) =>
        {
            if (!TryGetStaffIdentity(context, out var userId, out var isAdmin))
                return context.User.Identity?.IsAuthenticated == true ? Results.Forbid() : Results.Unauthorized();
            var instituteId = context.GetInstituteId();
            if (!instituteId.HasValue) return Results.BadRequest(new { error = "User not associated with any institute." });

            try
            {
                var submission = await service.CreateOrGetSubmissionForStudentAsync(
                    homeworkId, studentId, instituteId.Value, userId, isAdmin, ct);
                return Results.Ok(new
                {
                    status = "success",
                    data = new { submissionId = submission.Id, fileUrl = submission.FileUrl, submittedAt = submission.SubmittedAt }
                });
            }
            catch (HomeworkValidationException ex)
            {
                return ex.ErrorCode == "FORBIDDEN"
                    ? Results.Forbid()
                    : Results.NotFound(new { status = "error", code = ex.ErrorCode, error = ex.Message });
            }
        });

        group.MapPut("/submissions/{submissionId:int}/grade", async (
            int submissionId,
            GradeSubmissionRequest request,
            IHomeworkService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var result = await service.GradeSubmissionAsync(submissionId, request, ct);
                return Results.Ok(result);
            }
            catch (HomeworkValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapGet("/{homeworkId:int}/skill-topics", async (
            int homeworkId,
            IHomeworkService service,
            CancellationToken ct) =>
        {
            try { return Results.Ok(await service.GetSkillMappingAsync(homeworkId, ct)); }
            catch (HomeworkValidationException ex) { return Results.NotFound(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message }); }
        });

        group.MapPut("/{homeworkId:int}/skill-topics", async (
            int homeworkId,
            HomeworkSkillMappingRequest request,
            IHomeworkService service,
            CancellationToken ct) =>
        {
            try { return Results.Ok(await service.SetSkillMappingAsync(homeworkId, request, ct)); }
            catch (HomeworkValidationException ex) { return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message }); }
        });

        return app;
    }

    private static bool TryGetStaffIdentity(HttpContext context, out int userId, out bool isAdmin)
    {
        userId = 0;
        isAdmin = context.User.IsInRole("admin");
        var isTeacher = context.User.IsInRole("teacher");
        return (isAdmin || isTeacher)
            && int.TryParse(context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out userId)
            && userId > 0;
    }
}
