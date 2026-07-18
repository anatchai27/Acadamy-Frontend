using academy_API.DTOs;
using academy_API.Services;

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

        group.MapPost("/{id:int}/approve", async (
            int id,
            ILeaveRequestService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var userIdClaim = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                    return Results.Unauthorized();

                await service.ApproveAsync(id, userId, ct);
                return Results.Ok(new { Status = "success", Message = "อนุมัติคำร้องขอสำเร็จ" });
            }
            catch (LeaveRequestValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        group.MapPost("/{id:int}/reject", async (
            int id,
            ILeaveRequestService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var userIdClaim = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                    return Results.Unauthorized();

                await service.RejectAsync(id, userId, ct);
                return Results.Ok(new { Status = "success", Message = "ปฏิเสธคำร้องขอสำเร็จ" });
            }
            catch (LeaveRequestValidationException ex)
            {
                return Results.BadRequest(new { Status = "error", ErrorCode = ex.ErrorCode, Message = ex.Message });
            }
        });

        return app;
    }
}