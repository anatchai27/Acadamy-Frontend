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
            .RequireAuthorization();

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
                return Results.BadRequest(new AttendanceErrorResponse(
                    "error",
                    ex.ErrorCode,
                    ex.Message
                ));
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
                var result = await service.ScanAsync(request, ct);
                return Results.Ok(result);
            }
            catch (AttendanceValidationException ex)
            {
                return Results.BadRequest(new AttendanceErrorResponse(
                    "error",
                    ex.ErrorCode,
                    ex.Message
                ));
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
                return Results.BadRequest(new AttendanceErrorResponse(
                    "error",
                    ex.ErrorCode,
                    ex.Message
                ));
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
            catch (AttendanceValidationException ex) when (ex.ErrorCode == "NOT_FOUND")
            {
                return Results.NotFound(new AttendanceErrorResponse("error", ex.ErrorCode, ex.Message));
            }
            catch (AttendanceValidationException ex) when (ex.ErrorCode is "CHECKIN_REQUIRED" or "ALREADY_CHECKED_OUT" or "INVALID_PICKUP_AUTHORIZATION")
            {
                return Results.Conflict(new AttendanceErrorResponse("error", ex.ErrorCode, ex.Message));
            }
            catch (AttendanceValidationException ex)
            {
                return Results.BadRequest(new AttendanceErrorResponse("error", ex.ErrorCode, ex.Message));
            }
        });

        return app;
    }

    private static int? GetActorId(HttpContext context)
    {
        var value = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }
}