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

        return app;
    }
}