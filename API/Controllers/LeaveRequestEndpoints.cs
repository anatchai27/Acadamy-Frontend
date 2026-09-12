using academy_API.DTOs;
using academy_API.Services;
using academy_API.Utilities;

namespace academy_API.Controllers;

public static class LeaveRequestEndpoints
{
    public static IEndpointRouteBuilder MapLeaveRequestEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/leave-requests")
            .WithTags("LeaveRequests")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/", async (
            ILeaveRequestService service,
            HttpContext httpContext,
            string? status,
            int page = 1,
            int limit = 20,
            CancellationToken ct = default) =>
        {
            var result = await service.GetAllAsync(status, page, limit, ct);
            return Results.Ok(result);
        });

        group.MapPost("/{id:long}/approve", async (
            long id,
            ILeaveRequestService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var userIdClaim = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                    return Results.Unauthorized();

                return Results.Ok(await service.ApproveAsync(id, userId, ct));
            }
            catch (LeaveRequestValidationException ex) when (ex.ErrorCode == "NOT_FOUND")
            { return Results.NotFound(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message }); }
            catch (LeaveRequestValidationException ex) when (ex.ErrorCode == "INVALID_STATUS")
            { return Results.Conflict(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message }); }
            catch (LeaveRequestValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapPost("/{id:long}/reject", async (
            long id,
            ILeaveRequestService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var userIdClaim = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                    return Results.Unauthorized();

                return Results.Ok(await service.RejectAsync(id, userId, ct));
            }
            catch (LeaveRequestValidationException ex) when (ex.ErrorCode == "NOT_FOUND")
            { return Results.NotFound(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message }); }
            catch (LeaveRequestValidationException ex) when (ex.ErrorCode == "INVALID_STATUS")
            { return Results.Conflict(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message }); }
            catch (LeaveRequestValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapPost("/{id:long}/attachment", async (
            long id,
            IFormFile file,
            ILeaveRequestAttachmentService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userIdValue = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdValue, out var userId)) return Results.Unauthorized();
            var instituteId = httpContext.GetInstituteId();
            if (!instituteId.HasValue) return Results.BadRequest(new { error = "Institute not identified." });

            var isParent = httpContext.User.IsInRole("parent");
            try
            {
                var result = await service.UploadAsync(id, userId, isParent, instituteId.Value, file, ct);
                return Results.Created($"/api/leave-requests/{id}/attachment/{result.Id}", result);
            }
            catch (LeaveAttachmentValidationException ex) when (ex.Code == "FORBIDDEN")
            { return Results.Forbid(); }
            catch (LeaveAttachmentValidationException ex)
            { return Results.BadRequest(new { error = ex.Message, code = ex.Code }); }
        }).DisableAntiforgery();

        return app;
    }
}