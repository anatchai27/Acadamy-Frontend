using academy_API.DTOs;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class AttendanceEndpoints
{
    public static IEndpointRouteBuilder MapAttendanceEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/attendance")
            .WithTags("Attendance")
            .WithOpenApi()
            .RequireAuthorization(policy => policy.RequireRole("admin", "teacher"));

        group.MapGet("/daily", async (
            IAttendanceService service,
            HttpContext httpContext,
            int? session_id,
            string? date,
            CancellationToken ct) =>
        {
            try
            {
                var result = await service.GetDailyAsync(session_id, date, ct);
                return Results.Ok(result);
            }
            catch (AttendanceValidationException ex)
            {
                return AttendanceError(ex);
            }
        });

        group.MapPost("/scan", async (
            ScanAttendanceRequest request,
            IAttendanceService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var idempotencyKey = httpContext.Request.Headers["Idempotency-Key"].FirstOrDefault();
                var effectiveRequest = string.IsNullOrWhiteSpace(idempotencyKey)
                    ? request
                    : request with { IdempotencyKey = idempotencyKey };
                var result = await service.ScanAsync(effectiveRequest, ct);
                return Results.Ok(result);
            }
            catch (AttendanceValidationException ex)
            {
                return AttendanceError(ex);
            }
            catch (DbUpdateException)
            {
                return Results.Problem("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง", statusCode: 500);
            }
        });

        group.MapPost("/manual", async (
            ManualAttendanceRequest request,
            IAttendanceService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var result = await service.ManualAsync(request, ct);
                return Results.Ok(result);
            }
            catch (AttendanceValidationException ex)
            {
                return AttendanceError(ex);
            }
            catch (DbUpdateException)
            {
                return Results.Problem("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง", statusCode: 500);
            }
        });

        group.MapPost("/{attendanceId:long}/checkout", async (
            long attendanceId,
            CheckoutAttendanceRequest request,
            IAttendanceService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                return Results.Ok(await service.CheckoutAsync(attendanceId, request, GetActorId(httpContext), ct));
            }
            catch (AttendanceValidationException ex)
            {
                return AttendanceError(ex);
            }
        });

        group.MapGet("/{attendanceId:long}/audit", async (
            long attendanceId,
            IAttendanceService service,
            CancellationToken ct) =>
        {
            var audit = await service.GetCheckoutAuditAsync(attendanceId, ct);
            return audit is null ? Results.NotFound() : Results.Ok(audit);
        });

        return app;
    }

    private static int? GetActorId(HttpContext context)
    {
        var value = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    private static IResult AttendanceError(AttendanceValidationException exception)
    {
        var statusCode = exception.ErrorCode switch
        {
            "FORBIDDEN" => StatusCodes.Status403Forbidden,
            "SESSION_NOT_FOUND" or "NOT_FOUND" => StatusCodes.Status404NotFound,
            "DUPLICATE_SCAN" or "NO_QUOTA" or "IDEMPOTENCY_KEY_REUSED"
                or "CHECKIN_REQUIRED" or "ALREADY_CHECKED_OUT" or "INVALID_PICKUP_AUTHORIZATION"
                => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status400BadRequest
        };

        return Results.Json(new AttendanceErrorResponse("error", exception.ErrorCode, exception.Message), statusCode: statusCode);
    }
}
