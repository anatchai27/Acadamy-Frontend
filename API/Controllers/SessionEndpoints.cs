using academy_API.DTOs;
using academy_API.Services;
using academy_API.Utilities;

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
            var instituteId = httpContext.GetInstituteId();
            var result = await service.GetByCourseIdAsync(courseId, instituteId, ct);
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
                var instituteId = httpContext.GetInstituteId();
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
