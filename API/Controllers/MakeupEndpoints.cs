using System.Security.Claims;
using academy_API.DTOs;
using academy_API.Services;

namespace academy_API.Controllers;

public static class MakeupEndpoints
{
    public static IEndpointRouteBuilder MapMakeupEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/makeup").WithTags("Makeup").WithOpenApi().RequireAuthorization();

        group.MapGet("/credits", async (IMakeupService service, int? student_id, string? status, CancellationToken ct) =>
            Results.Ok(await service.ListCreditsAsync(student_id, status, ct)));
        group.MapGet("/slots", async (IMakeupService service, DateTime? from, DateTime? to, int? teacher_id, CancellationToken ct) =>
            Results.Ok(await service.ListSlotsAsync(from, to, teacher_id, ct)));
        group.MapPost("/slots", async (CreateMakeupSlotRequest request, IMakeupService service, CancellationToken ct) =>
            await Execute(() => service.CreateSlotAsync(request, ct), result => Results.Created("/api/makeup/slots", result)));
        group.MapPost("/slots/{slotId:int}/cancel", async (int slotId, IMakeupService service, HttpContext context, CancellationToken ct) =>
            await Execute(async () => { await service.CancelSlotAsync(slotId, ActorId(context), ct); return new { status = "cancelled" }; }, Results.Ok));
        group.MapPost("/bookings", async (CreateMakeupBookingRequest request, IMakeupService service, HttpContext context, CancellationToken ct) =>
            await Execute(() => service.CreateBookingAsync(request, ActorId(context), ct), result => Results.Created("/api/makeup/bookings", result)));
        group.MapDelete("/bookings/{bookingId:long}", async (long bookingId, IMakeupService service, HttpContext context, CancellationToken ct) =>
            await Execute(async () => { await service.CancelBookingAsync(bookingId, ActorId(context), ct); return Results.NoContent(); }, result => result));
        group.MapPost("/bookings/{bookingId:long}/no-show", async (long bookingId, IMakeupService service, HttpContext context, CancellationToken ct) =>
            await Execute(() => service.MarkNoShowAsync(bookingId, ActorId(context), ct), Results.Ok));

        return app;
    }

    private static async Task<IResult> Execute<T>(Func<Task<T>> action, Func<T, IResult> success)
    {
        try { return success(await action()); }
        catch (MakeupValidationException ex) when (ex.Code == "NOT_FOUND") { return Results.NotFound(new { error = ex.Message }); }
        catch (MakeupValidationException ex) when (ex.Code is "INVALID_STATE" or "CREDIT_UNAVAILABLE" or "SLOT_UNAVAILABLE") { return Results.Conflict(new { error = ex.Message }); }
        catch (MakeupValidationException ex) { return Results.BadRequest(new { error = ex.Message, code = ex.Code }); }
    }

    private static int? ActorId(HttpContext context) =>
        int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}

