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
                var instituteId = httpContext.GetInstituteId();
                var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userId = !string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var id) ? id : 0;

                var result = await service.CreateAsync(request, instituteId, userId, ct);
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
            var instituteId = httpContext.GetInstituteId();
            var result = await service.GetByCourseIdAsync(courseId, instituteId, ct);
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
                var instituteId = httpContext.GetInstituteId();
                var result = await service.GetSubmissionsAsync(homeworkId, instituteId, ct);
                return Results.Ok(result);
            }
            catch (HomeworkValidationException ex)
            {
                return Results.NotFound(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
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
                var instituteId = httpContext.GetInstituteId();
                var result = await service.GradeSubmissionAsync(submissionId, request, instituteId, ct);
                return Results.Ok(result);
            }
            catch (HomeworkValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        return app;
    }
}
