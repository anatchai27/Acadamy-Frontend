using academy_API.Models;
using academy_API.DTOs;
using academy_API.Repositories;

namespace academy_API.Services;

public interface IMakeupService
{
    Task<IReadOnlyList<MakeupCreditResponse>> ListCreditsAsync(int? studentId, string? status, CancellationToken ct);
    Task<IReadOnlyList<MakeupSlotResponse>> ListSlotsAsync(DateTime? from, DateTime? to, int? teacherId, CancellationToken ct);
    Task<MakeupSlotResponse> CreateSlotAsync(CreateMakeupSlotRequest request, CancellationToken ct);
    Task<MakeupBookingResponse> CreateBookingAsync(CreateMakeupBookingRequest request, int? actorId, CancellationToken ct);
    Task CancelSlotAsync(int slotId, int? actorId, CancellationToken ct);
    Task CancelBookingAsync(long bookingId, int? actorId, CancellationToken ct);
    Task<MakeupBookingResponse> MarkNoShowAsync(long bookingId, int? actorId, CancellationToken ct);
}

public sealed class MakeupService(IMakeupRepository repository) : IMakeupService
{
    private readonly IMakeupRepository _repository = repository;

    public async Task<IReadOnlyList<MakeupCreditResponse>> ListCreditsAsync(int? studentId, string? status, CancellationToken ct) =>
        (await _repository.ListCreditsAsync(studentId, status, ct))
        .Select(x => new MakeupCreditResponse(x.Id, x.StudentId, x.CourseId, x.Status, x.ExpiresAt))
        .ToList();

    public async Task<IReadOnlyList<MakeupSlotResponse>> ListSlotsAsync(DateTime? from, DateTime? to, int? teacherId, CancellationToken ct) =>
        (await _repository.ListSlotsAsync(from, to, teacherId, ct))
        .Select(ToSlotResponse)
        .ToList();

    public async Task<MakeupSlotResponse> CreateSlotAsync(CreateMakeupSlotRequest request, CancellationToken ct)
    {
        if (request.Capacity < 1 || request.ScheduledAt <= DateTime.UtcNow)
            throw new MakeupValidationException("INVALID_SLOT", "scheduledAt must be in the future and capacity must be at least 1.");

        var instituteId = await _repository.GetTeacherInstituteIdAsync(request.TeacherId, ct);
        if (!instituteId.HasValue) throw new MakeupValidationException("TEACHER_NOT_FOUND", "Teacher not found.");

        var slot = await _repository.CreateSlotAsync(new MakeupSlot
        {
            InstituteId = instituteId.Value,
            TeacherId = request.TeacherId,
            ScheduledAt = request.ScheduledAt,
            Capacity = request.Capacity,
            RoomId = request.RoomId
        }, ct);
        return ToSlotResponse(slot);
    }

    public async Task<MakeupBookingResponse> CreateBookingAsync(CreateMakeupBookingRequest request, int? actorId, CancellationToken ct)
    {
        var slot = await _repository.GetSlotAsync(request.SlotId, ct);
        var credit = await _repository.GetCreditAsync(request.CreditId, ct);
        if (slot is null || credit is null) throw new MakeupValidationException("NOT_FOUND", "Slot or credit not found.");
        if (credit.StudentId != request.StudentId) throw new MakeupValidationException("CREDIT_STUDENT_MISMATCH", "Credit does not belong to the student.");
        if (credit.Status != "available" || credit.ExpiresAt <= DateTime.UtcNow) throw new MakeupValidationException("CREDIT_UNAVAILABLE", "Credit is not available.");
        if (slot.ScheduledAt <= DateTime.UtcNow || slot.BookedCount >= slot.Capacity) throw new MakeupValidationException("SLOT_UNAVAILABLE", "Make-up slot is full or has already started.");

        var booking = await _repository.CreateBookingAsync(slot, credit, new MakeupBooking
        {
            InstituteId = credit.InstituteId,
            SlotId = slot.Id,
            StudentId = request.StudentId,
            CreditId = credit.Id,
            Status = "reserved",
            ActiveMarker = 1,
            BookedAt = DateTime.UtcNow,
            CreatedBy = actorId,
            UpdatedAt = DateTime.UtcNow
        }, actorId, ct);
        return ToBookingResponse(booking);
    }

    public async Task CancelSlotAsync(int slotId, int? actorId, CancellationToken ct)
    {
        var slot = await _repository.GetSlotAsync(slotId, ct);
        if (slot is null) throw new MakeupValidationException("NOT_FOUND", "Make-up slot not found.");
        await _repository.CancelSlotAsync(slotId, actorId, ct);
    }

    public async Task CancelBookingAsync(long bookingId, int? actorId, CancellationToken ct)
    {
        var booking = await _repository.GetBookingAsync(bookingId, ct);
        if (booking is null) throw new MakeupValidationException("NOT_FOUND", "Make-up booking not found.");
        if (booking.Status != "reserved") throw new MakeupValidationException("INVALID_STATE", "Only reserved bookings can be cancelled.");
        var credit = await _repository.GetCreditAsync(booking.CreditId, ct) ?? throw new MakeupValidationException("NOT_FOUND", "Credit not found.");
        var slot = await _repository.GetSlotAsync(booking.SlotId, ct);
        await _repository.CancelBookingAsync(booking, credit, slot, actorId, ct);
    }

    public async Task<MakeupBookingResponse> MarkNoShowAsync(long bookingId, int? actorId, CancellationToken ct)
    {
        var booking = await _repository.GetBookingAsync(bookingId, ct);
        if (booking is null) throw new MakeupValidationException("NOT_FOUND", "Make-up booking not found.");
        if (booking.Status != "reserved") throw new MakeupValidationException("INVALID_STATE", "Only reserved bookings can be marked no-show.");
        var credit = await _repository.GetCreditAsync(booking.CreditId, ct) ?? throw new MakeupValidationException("NOT_FOUND", "Credit not found.");
        await _repository.MarkNoShowAsync(booking, credit, actorId, ct);
        return ToBookingResponse(booking);
    }

    private static MakeupSlotResponse ToSlotResponse(MakeupSlot x) => new(x.Id, x.TeacherId, x.ScheduledAt, x.Capacity, x.BookedCount, x.RoomId, "open");
    private static MakeupBookingResponse ToBookingResponse(MakeupBooking x) => new(x.Id, x.SlotId, x.StudentId, x.CreditId, x.Status);
}

public sealed class MakeupValidationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

