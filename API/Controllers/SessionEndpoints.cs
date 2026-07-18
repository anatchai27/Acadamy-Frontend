using academy_API.DTOs;
using academy_API.Services;

namespace academy_API.Controllers;

public static class SessionEndpoints
{
    public static IEndpointRouteBuilder MapSessionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/courses/{courseId:int}/sessions")
            .WithTags("Sessions")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/", async (
            int courseId,
            ISessionService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var result = await service.GetByCourseIdAsync(courseId, ct);
            return Results.Ok(result);
        });

        group.MapPost("/", async (
            int courseId,
            CreateSessionRequest request,
            ISessionService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var instituteIdClaim = httpContext.User.FindFirst("institute_id")?.Value;
                if (string.IsNullOrEmpty(instituteIdClaim) || !int.TryParse(instituteIdClaim, out var instituteId))
                    return Results.BadRequest(new { Status = "error", Message = "Institute not identified." });

                var result = await service.CreateAsync(courseId, request, instituteId, ct);
                return Results.Created($"/api/sessions/{result.Data.SessionId}", result);
            }
            catch (SessionValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        return app;
    }
}