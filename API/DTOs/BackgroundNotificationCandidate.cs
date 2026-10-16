namespace academy_API.DTOs;

public sealed record BackgroundNotificationCandidate(
    int UserId,
    int InstituteId,
    string RecipientId,
    string StudentName,
    string ParentName,
    string Message,
    string NotificationType,
    string IdempotencyKey);