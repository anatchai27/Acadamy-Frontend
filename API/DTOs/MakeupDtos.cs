namespace academy_API.DTOs;

public sealed record CreateMakeupSlotRequest(int TeacherId, DateTime ScheduledAt, int Capacity, string? RoomId);
public sealed record CreateMakeupBookingRequest(int SlotId, int StudentId, long CreditId);
public sealed record MakeupCreditResponse(long Id, int StudentId, int CourseId, string Status, DateTime ExpiresAt);
public sealed record MakeupSlotResponse(int Id, int TeacherId, DateTime ScheduledAt, int Capacity, int BookedCount, string? RoomId, string Status);
public sealed record MakeupBookingResponse(long Id, int SlotId, int StudentId, long CreditId, string Status);
