using System.Security.Claims;
using academy_API.Data;
using academy_API.DTOs;
using Microsoft.EntityFrameworkCore;
using academy_API.Services;

namespace academy_API.Controllers;

public static class MakeupEndpoints
{
    public static IEndpointRouteBuilder MapMakeupEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/makeup").WithTags("Makeup").WithOpenApi().RequireAuthorization();

        group.MapGet("/credits", async (IMakeupService service, TutoringDbContext db, HttpContext context, int? student_id, string? status, CancellationToken ct) =>
            await CanParentAccessStudent(db, context, student_id, ct)
                ? Results.Ok(await service.ListCreditsAsync(student_id, status, ct))
                : Results.Forbid());
        group.MapGet("/slots", async (IMakeupService service, DateTime? from, DateTime? to, int? teacher_id, CancellationToken ct) =>
            Results.Ok(await service.ListSlotsAsync(from, to, teacher_id, ct)));
        group.MapPost("/slots", async (CreateMakeupSlotRequest request, IMakeupService service, CancellationToken ct) =>
            await Execute(() => service.CreateSlotAsync(request, ct), result => Results.Created("/api/makeup/slots", result)));
        group.MapPost("/slots/{slotId:int}/cancel", async (int slotId, IMakeupService service, HttpContext context, CancellationToken ct) =>
            await Execute(async () => { await service.CancelSlotAsync(slotId, ActorId(context), ct); return new { status = "cancelled" }; }, Results.Ok));
        group.MapPost("/bookings", async (CreateMakeupBookingRequest request, IMakeupService service, TutoringDbContext db, HttpContext context, CancellationToken ct) =>
            await CanParentAccessStudent(db, context, request.StudentId, ct)
                ? await Execute(() => service.CreateBookingAsync(request, ActorId(context), ct), result => Results.Created("/api/makeup/bookings", result))
                : Results.Forbid());
        group.MapDelete("/bookings/{bookingId:long}", async (long bookingId, IMakeupService service, TutoringDbContext db, HttpContext context, CancellationToken ct) =>
            await CanParentAccessBooking(db, context, bookingId, ct)
                ? await Execute(async () => { await service.CancelBookingAsync(bookingId, ActorId(context), ct); return Results.NoContent(); }, result => result)
                : Results.Forbid());
        group.MapPost("/bookings/{bookingId:long}/no-show", async (long bookingId, IMakeupService service, HttpContext context, CancellationToken ct) =>
            context.User.IsInRole("parent") ? Results.Forbid() : await Execute(() => service.MarkNoShowAsync(bookingId, ActorId(context), ct), Results.Ok));

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

    private static async Task<bool> CanParentAccessStudent(TutoringDbContext db, HttpContext context, int? studentId, CancellationToken ct)
    {
        if (!context.User.IsInRole("parent")) return true;
        if (!studentId.HasValue || !int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return false;
        return await db.Parents.AnyAsync(parent => parent.UserId == userId && parent.StudentId == studentId.Value, ct);
    }

    private static async Task<bool> CanParentAccessBooking(TutoringDbContext db, HttpContext context, long bookingId, CancellationToken ct)
    {
        if (!context.User.IsInRole("parent")) return true;
        if (!int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return false;
        return await db.MakeupBookings.AnyAsync(booking => booking.Id == bookingId && db.Parents.Any(parent =>
            parent.UserId == userId && parent.StudentId == booking.StudentId), ct);
    }
}

