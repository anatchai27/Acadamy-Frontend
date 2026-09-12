using academy_API.Data;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IMakeupRepository
{
    Task<List<MakeupCredit>> ListCreditsAsync(int? studentId, string? status, CancellationToken ct);
    Task<List<MakeupSlot>> ListSlotsAsync(DateTime? from, DateTime? to, int? teacherId, CancellationToken ct);
    Task<MakeupSlot?> GetSlotAsync(int slotId, CancellationToken ct);
    Task<MakeupCredit?> GetCreditAsync(long creditId, CancellationToken ct);
    Task<MakeupBooking?> GetBookingAsync(long bookingId, CancellationToken ct);
    Task<int?> GetTeacherInstituteIdAsync(int teacherId, CancellationToken ct);
    Task<MakeupSlot> CreateSlotAsync(MakeupSlot slot, CancellationToken ct);
    Task<MakeupBooking> CreateBookingAsync(MakeupSlot slot, MakeupCredit credit, MakeupBooking booking, int? actorId, CancellationToken ct);
    Task CancelSlotAsync(MakeupSlot slot, IReadOnlyCollection<MakeupBooking> bookings, IReadOnlyCollection<MakeupCredit> credits, int? actorId, CancellationToken ct);
    Task CancelSlotAsync(int slotId, int? actorId, CancellationToken ct);
    Task CancelBookingAsync(MakeupBooking booking, MakeupCredit credit, MakeupSlot? slot, int? actorId, CancellationToken ct);
    Task MarkNoShowAsync(MakeupBooking booking, MakeupCredit credit, int? actorId, CancellationToken ct);
}

public sealed class MakeupRepository(TutoringDbContext db) : IMakeupRepository
{
    public Task<List<MakeupCredit>> ListCreditsAsync(int? studentId, string? status, CancellationToken ct)
    {
        var query = db.MakeupCredits.AsNoTracking().AsQueryable();
        if (studentId.HasValue) query = query.Where(x => x.StudentId == studentId.Value);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        return query.OrderByDescending(x => x.ExpiresAt).ToListAsync(ct);
    }

    public Task<List<MakeupSlot>> ListSlotsAsync(DateTime? from, DateTime? to, int? teacherId, CancellationToken ct)
    {
        var query = db.MakeupSlots.AsNoTracking().AsQueryable();
        if (from.HasValue) query = query.Where(x => x.ScheduledAt >= from.Value);
        if (to.HasValue) query = query.Where(x => x.ScheduledAt <= to.Value);
        if (teacherId.HasValue) query = query.Where(x => x.TeacherId == teacherId.Value);
        return query.OrderBy(x => x.ScheduledAt).ToListAsync(ct);
    }

    public Task<MakeupSlot?> GetSlotAsync(int slotId, CancellationToken ct) =>
        db.MakeupSlots.FirstOrDefaultAsync(x => x.Id == slotId, ct);

    public Task<MakeupCredit?> GetCreditAsync(long creditId, CancellationToken ct) =>
        db.MakeupCredits.FirstOrDefaultAsync(x => x.Id == creditId, ct);

    public Task<MakeupBooking?> GetBookingAsync(long bookingId, CancellationToken ct) =>
        db.MakeupBookings.FirstOrDefaultAsync(x => x.Id == bookingId, ct);

    public Task<int?> GetTeacherInstituteIdAsync(int teacherId, CancellationToken ct) =>
        db.Teachers.Where(x => x.Id == teacherId).Select(x => (int?)x.InstituteId).FirstOrDefaultAsync(ct);

    public async Task<MakeupSlot> CreateSlotAsync(MakeupSlot slot, CancellationToken ct)
    {
        db.MakeupSlots.Add(slot);
        await db.SaveChangesAsync(ct);
        return slot;
    }

    public async Task<MakeupBooking> CreateBookingAsync(MakeupSlot slot, MakeupCredit credit, MakeupBooking booking, int? actorId, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        credit.Status = "reserved";
        slot.BookedCount++;
        db.MakeupBookings.Add(booking);
        AddTransaction(credit, "reserve", -1, "makeup_booking", null, "Credit reserved for make-up booking", actorId);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return booking;
    }

    public async Task CancelSlotAsync(MakeupSlot slot, IReadOnlyCollection<MakeupBooking> bookings, IReadOnlyCollection<MakeupCredit> credits, int? actorId, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var booking in bookings)
        {
            booking.Status = "cancelled";
            booking.ActiveMarker = 0;
            booking.CancelledAt = now;
            booking.CancelReason = "slot_cancelled";
            booking.UpdatedAt = now;
        }
        foreach (var credit in credits)
        {
            credit.Status = "available";
            credit.UsedAt = null;
            AddTransaction(credit, "restore", 1, "makeup_slot", slot.Id, "Credit restored after slot cancellation", actorId);
        }
        db.MakeupSlots.Remove(slot);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    public async Task CancelSlotAsync(int slotId, int? actorId, CancellationToken ct)
    {
        var slot = await GetSlotAsync(slotId, ct) ?? throw new InvalidOperationException("Make-up slot not found.");
        var bookings = await db.MakeupBookings.Where(x => x.SlotId == slotId && x.Status == "reserved").ToListAsync(ct);
        var creditIds = bookings.Select(x => x.CreditId).ToArray();
        var credits = await db.MakeupCredits.Where(x => creditIds.Contains(x.Id)).ToListAsync(ct);
        await CancelSlotAsync(slot, bookings, credits, actorId, ct);
    }

    public async Task CancelBookingAsync(MakeupBooking booking, MakeupCredit credit, MakeupSlot? slot, int? actorId, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        booking.Status = "cancelled";
        booking.ActiveMarker = 0;
        booking.CancelledAt = DateTime.UtcNow;
        booking.CancelReason = "booking_cancelled";
        booking.UpdatedAt = DateTime.UtcNow;
        credit.Status = "available";
        if (slot is not null && slot.BookedCount > 0) slot.BookedCount--;
        AddTransaction(credit, "restore", 1, "makeup_booking", booking.Id, "Credit restored after booking cancellation", actorId);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    public async Task MarkNoShowAsync(MakeupBooking booking, MakeupCredit credit, int? actorId, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        booking.Status = "no_show";
        booking.ActiveMarker = 0;
        booking.UpdatedAt = DateTime.UtcNow;
        credit.Status = "used";
        credit.UsedAt = DateTime.UtcNow;
        AddTransaction(credit, "consume_no_show", -1, "makeup_booking", booking.Id, "Credit consumed because student was a no-show", actorId);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    private void AddTransaction(MakeupCredit credit, string type, short amount, string referenceType, long? referenceId, string note, int? actorId) =>
        db.MakeupCreditTransactions.Add(new MakeupCreditTransaction
        {
            InstituteId = credit.InstituteId,
            CreditId = credit.Id,
            StudentId = credit.StudentId,
            TransactionType = type,
            Amount = amount,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            Note = note,
            CreatedBy = actorId,
            CreatedAt = DateTime.UtcNow
        });
}
