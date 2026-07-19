using academy_API.DTOs;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class PaymentEndpoints
{
    public static IEndpointRouteBuilder MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/payments")
            .WithTags("Payments")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapPost("/", async (
            CreatePaymentRequest request,
            IPaymentService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var result = await service.CreateAsync(request, ct);
                return Results.Created($"/api/payments/{result.Data.PaymentId}", result);
            }
            catch (PaymentValidationException ex)
            {
                return Results.BadRequest(new AttendanceErrorResponse("error", ex.ErrorCode, ex.Message));
            }
            catch (DbUpdateException)
            {
                return Results.Problem("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง", statusCode: 500);
            }
        });

        group.MapGet("/", async (
            IPaymentService service,
            HttpContext httpContext,
            string? start_date,
            string? end_date,
            string? method,
            int page = 1,
            int limit = 20,
            CancellationToken ct = default) =>
        {
            DateTime? startDate = null;
            DateTime? endDate = null;

            if (!string.IsNullOrEmpty(start_date) && DateTime.TryParse(start_date, out var sd))
                startDate = sd.ToUniversalTime();
            if (!string.IsNullOrEmpty(end_date) && DateTime.TryParse(end_date, out var ed))
                endDate = ed.Date.AddDays(1).AddTicks(-1);

            var result = await service.GetHistoryAsync(startDate, endDate, method, page, limit, ct);
            return Results.Ok(result);
        });

        return app;
    }
}