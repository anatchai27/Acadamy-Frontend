using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IMakeupRepository
{
    Task<List<MakeupCredit>> ListCreditsAsync(int? studentId, string? status, CancellationToken ct);
    Task<List<MakeupSlot>> ListSlotsAsync(DateTime? from, DateTime? to, int? teacherId, CancellationToken ct);
    Task<MakeupSlot?> GetSlotAsync(int slotId, CancellationToken ct);
    Task<MakeupCredit?> GetCreditAsync(long creditId, CancellationToken ct);
    Task<MakeupBooking?> GetBookingAsync(long bookingId, CancellationToken ct);
    Task<MakeupBooking?> GetBookingByIdempotencyKeyAsync(string key, CancellationToken ct);
    Task<List<MakeupBookingListItem>> ListBookingsAsync(int studentId, CancellationToken ct);
    Task<bool> ParentOwnsStudentAsync(int userId, int studentId, CancellationToken ct);
    Task<bool> ParentOwnsBookingAsync(int userId, long bookingId, CancellationToken ct);
    Task<int?> GetTeacherInstituteIdAsync(int teacherId, CancellationToken ct);
    Task<MakeupSlot> CreateSlotAsync(MakeupSlot slot, CancellationToken ct);
    Task<MakeupBooking> CreateBookingAsync(MakeupSlot slot, MakeupCredit credit, MakeupBooking booking, int? actorId, CancellationToken ct);
    Task<MakeupBooking> CreateBookingAsync(MakeupSlot slot, MakeupCredit credit, MakeupBooking booking, int? actorId, CancellationToken ct, string? idempotencyKey);
    Task CancelSlotAsync(MakeupSlot slot, IReadOnlyCollection<MakeupBooking> bookings, IReadOnlyCollection<MakeupCredit> credits, int? actorId, CancellationToken ct);
    Task CancelSlotAsync(int slotId, int? actorId, CancellationToken ct);
    Task CancelBookingAsync(MakeupBooking booking, MakeupCredit credit, MakeupSlot? slot, int? actorId, CancellationToken ct);
    Task MarkNoShowAsync(MakeupBooking booking, MakeupCredit credit, int? actorId, CancellationToken ct);
}