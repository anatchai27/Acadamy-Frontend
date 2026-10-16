using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IMakeupService
{
    Task<IReadOnlyList<MakeupCreditResponse>> ListCreditsAsync(int? studentId, int? userId, bool isParent, string? status, CancellationToken ct);
    Task<IReadOnlyList<MakeupSlotResponse>> ListSlotsAsync(DateTime? from, DateTime? to, int? teacherId, CancellationToken ct);
    Task<IReadOnlyList<MakeupBookingListItem>> ListBookingsAsync(int studentId, int? userId, bool isParent, CancellationToken ct);
    Task<MakeupSlotResponse> CreateSlotAsync(CreateMakeupSlotRequest request, CancellationToken ct);
    Task<MakeupBookingResponse> CreateBookingAsync(CreateMakeupBookingRequest request, int? actorId, CancellationToken ct);
    Task<MakeupBookingResponse> CreateBookingForUserAsync(CreateMakeupBookingRequest request, int? userId, bool isParent, CancellationToken ct);
    Task<MakeupBookingResponse> CreateBookingForUserAsync(CreateMakeupBookingRequest request, int? userId, bool isParent, string? idempotencyKey, CancellationToken ct);
    Task CancelSlotAsync(int slotId, int? actorId, CancellationToken ct);
    Task CancelBookingAsync(long bookingId, int? actorId, int? userId, bool isParent, CancellationToken ct);
    Task<MakeupBookingResponse> MarkNoShowAsync(long bookingId, int? actorId, CancellationToken ct);
}