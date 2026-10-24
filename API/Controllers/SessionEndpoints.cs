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

        group.MapPost("/recurring", async (
            int courseId,
            CreateRecurringSessionsRequest request,
            ISessionService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var instituteIdClaim = httpContext.User.FindFirst("institute_id")?.Value;
                if (string.IsNullOrEmpty(instituteIdClaim) || !int.TryParse(instituteIdClaim, out var instituteId))
                    return Results.BadRequest(new { Status = "error", Message = "Institute not identified." });
                return Results.Created($"/api/courses/{courseId}/sessions", await service.CreateRecurringAsync(courseId, request, instituteId, ct));
            }
            catch (SessionValidationException ex)
            {
                return ex.ErrorCode == "ROOM_OVERLAP"
                    ? Results.Conflict(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message })
                    : Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
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
                return ex.ErrorCode == "ROOM_OVERLAP"
                    ? Results.Conflict(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message })
                    : Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapPut("/{sessionId:int}", async (
            int courseId,
            int sessionId,
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

                await service.UpdateAsync(courseId, sessionId, request, instituteId, ct);
                return Results.Ok(new { Status = "success", Message = "อัปเดตตารางเรียนสำเร็จ" });
            }
            catch (SessionValidationException ex)
            {
                var statusCode = ex.ErrorCode switch
                {
                    "SESSION_NOT_FOUND" => StatusCodes.Status404NotFound,
                    "SESSION_NOT_EDITABLE" or "SESSION_HAS_ATTENDANCE" or "ROOM_OVERLAP" => StatusCodes.Status409Conflict,
                    _ => StatusCodes.Status400BadRequest
                };
                return Results.Json(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message }, statusCode: statusCode);
            }
        });

        group.MapPut("/replace-future", async (
            int courseId,
            CreateRecurringSessionsRequest request,
            ISessionService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var instituteIdClaim = httpContext.User.FindFirst("institute_id")?.Value;
                if (string.IsNullOrEmpty(instituteIdClaim) || !int.TryParse(instituteIdClaim, out var instituteId))
                    return Results.BadRequest(new { Status = "error", Message = "Institute not identified." });

                var result = await service.ReplaceFutureAsync(courseId, request, instituteId, ct);
                return Results.Ok(result);
            }
            catch (SessionValidationException ex)
            {
                var statusCode = ex.ErrorCode switch
                {
                    "COURSE_NOT_FOUND" => StatusCodes.Status404NotFound,
                    "ROOM_OVERLAP" => StatusCodes.Status409Conflict,
                    _ => StatusCodes.Status400BadRequest
                };
                return Results.Json(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message }, statusCode: statusCode);
            }
        });

        return app;
    }
}
