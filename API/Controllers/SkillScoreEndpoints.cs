using System.Security.Claims;
using academy_API.DTOs;
using academy_API.Services;
using academy_API.Utilities;

namespace academy_API.Controllers;

public static class SkillScoreEndpoints
{
    public static IEndpointRouteBuilder MapSkillScoreEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/skill-scores")
            .WithTags("SkillScores")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/student/{studentId:int}", async (
            int studentId,
            ISkillScoreService service,
            CancellationToken ct) =>
        {
            var result = await service.GetByStudentIdAsync(studentId, ct);
            return Results.Ok(result);
        });

        group.MapPost("/batch-update", async (
            BatchSkillScoreRequest request,
            ISkillScoreService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var instituteId = httpContext.GetInstituteId();
                var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userId = !string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var id) ? id : 0;

                var result = await service.BatchUpdateAsync(request, instituteId, userId, ct);
                return Results.Ok(result);
            }
            catch (SkillScoreValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapGet("/topics", async (
            int courseId,
            ISkillScoreService service,
            CancellationToken ct) =>
        {
            var result = await service.GetTopicsByCourseIdAsync(courseId, ct);
            return Results.Ok(result);
        });

        group.MapPost("/topics", async (
            SkillTopicRequest request,
            ISkillScoreService service,
            CancellationToken ct) =>
        {
            try
            {
                await service.CreateTopicAsync(request, ct);
                return Results.Created($"/api/skill-scores/topics?courseId={request.CourseId}", new { Status = "success", Message = "สร้างหัวข้อทักษะสำเร็จ" });
            }
            catch (SkillScoreValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapPut("/topics/{id:int}", async (
            int id,
            SkillTopicRequest request,
            ISkillScoreService service,
            CancellationToken ct) =>
        {
            try
            {
                await service.UpdateTopicAsync(id, request, ct);
                return Results.Ok(new { Status = "success", Message = "แก้ไขหัวข้อทักษะสำเร็จ" });
            }
            catch (SkillScoreValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapDelete("/topics/{id:int}", async (
            int id,
            ISkillScoreService service,
            CancellationToken ct) =>
        {
            try
            {
                await service.DeleteTopicAsync(id, ct);
                return Results.Ok(new { Status = "success", Message = "ลบหัวข้อทักษะสำเร็จ" });
            }
            catch (SkillScoreValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        return app;
    }
}
