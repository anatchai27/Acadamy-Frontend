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
            if (!TryParseDateRange(start_date, end_date, out var startDate, out var endDate, out var error))
                return Results.BadRequest(new { error });

            var result = await service.GetHistoryAsync(startDate, endDate, method, page, limit, ct);
            return Results.Ok(result);
        });

        group.MapGet("/export", async (
            IPaymentService service,
            string? start_date,
            string? end_date,
            string? method,
            CancellationToken ct = default) =>
        {
            if (!TryParseDateRange(start_date, end_date, out var startDate, out var endDate, out var error))
                return Results.BadRequest(new { error });

            var csv = await service.ExportCsvAsync(startDate, endDate, method, ct);
            return Results.File(csv, "text/csv; charset=utf-8", "payments.csv");
        });

        group.MapPost("/{paymentId:long}/verify-slip", async (
            long paymentId,
            IPaymentSlipVerificationService service,
            HttpContext context,
            CancellationToken ct) =>
        {
            var actorId = int.TryParse(context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : (int?)null;
            try { return Results.Ok(await service.VerifyAsync(paymentId, actorId, ct)); }
            catch (PaymentValidationException ex) when (ex.ErrorCode == "PAYMENT_NOT_FOUND" || ex.ErrorCode == "SLIP_NOT_FOUND")
            { return Results.NotFound(new { error = ex.Message, code = ex.ErrorCode }); }
            catch (PaymentValidationException ex) when (ex.ErrorCode is "AMOUNT_MISMATCH" or "ALREADY_VERIFIED")
            { return Results.Conflict(new { error = ex.Message, code = ex.ErrorCode }); }
            catch (PaymentValidationException ex) when (ex.ErrorCode == "VERIFICATION_UNAVAILABLE")
            { return Results.StatusCode(StatusCodes.Status503ServiceUnavailable); }
        });

        return app;
    }

    private static bool TryParseDateRange(
        string? startText,
        string? endText,
        out DateTime? startDate,
        out DateTime? endDate,
        out string? error)
    {
        startDate = null;
        endDate = null;
        error = null;
        DateTime parsedStart = default;
        DateTime parsedEnd = default;

        if (!string.IsNullOrWhiteSpace(startText) && !DateTime.TryParse(startText, out parsedStart))
        {
            error = "start_date must be a valid date.";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(endText) && !DateTime.TryParse(endText, out parsedEnd))
        {
            error = "end_date must be a valid date.";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(startText))
            startDate = parsedStart.Date.ToUniversalTime();

        if (!string.IsNullOrWhiteSpace(endText))
            endDate = parsedEnd.Date.AddDays(1).AddTicks(-1).ToUniversalTime();

        if (startDate.HasValue && endDate.HasValue && startDate > endDate)
        {
            error = "start_date must be on or before end_date.";
            return false;
        }

        return true;
    }
}
