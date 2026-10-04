using academy_API.DTOs;
using academy_API.Services;

namespace academy_API.Controllers;

public static class PaymentBatchEndpoints
{
    public static IEndpointRouteBuilder MapPaymentBatchEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/payment-batches")
            .WithTags("Payment Batches")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapPost("/", async (CreatePaymentBatchRequest request, IPaymentBatchService service, HttpContext context, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("admin")) return Results.Forbid();
            try
            {
                var result = await service.CreateAsync(request, ct);
                return Results.Ok(result);
            }
            catch (PaymentValidationException ex)
            {
                return Results.BadRequest(new AttendanceErrorResponse("error", ex.ErrorCode, ex.Message));
            }
        });

        group.MapPost("/{batchId:long}/verify-slip", async (long batchId, IPaymentBatchService service, HttpContext context, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("admin")) return Results.Forbid();
            var actorId = int.TryParse(context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : (int?)null;
            try { return Results.Ok(await service.VerifySlipAsync(batchId, actorId, ct)); }
            catch (PaymentValidationException ex) when (ex.ErrorCode is "PAYMENT_BATCH_NOT_FOUND" or "SLIP_NOT_FOUND")
            { return Results.NotFound(new { error = ex.Message, code = ex.ErrorCode }); }
            catch (PaymentValidationException ex) when (ex.ErrorCode is "AMOUNT_MISMATCH" or "ALREADY_VERIFIED" or "DUPLICATE_SLIP")
            { return Results.Conflict(new { error = ex.Message, code = ex.ErrorCode }); }
            catch (PaymentValidationException ex) when (ex.ErrorCode == "VERIFICATION_UNAVAILABLE")
            { return Results.Json(new { error = ex.Message, code = ex.ErrorCode }, statusCode: StatusCodes.Status503ServiceUnavailable); }
            catch (PaymentValidationException ex)
            { return Results.BadRequest(new { error = ex.Message, code = ex.ErrorCode }); }
        });

        group.MapPost("/{batchId:long}/issue-receipt", async (long batchId, IPaymentBatchService service, HttpContext context, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("admin")) return Results.Forbid();
            try { return Results.Ok(new { receiptPdfUrl = await service.IssueReceiptAsync(batchId, ct) }); }
            catch (PaymentValidationException ex)
            {
                return Results.BadRequest(new AttendanceErrorResponse("error", ex.ErrorCode, ex.Message));
            }
        });

        return app;
    }
}
