namespace academy_API.Services;

public sealed record BackgroundNotificationCandidate(
    int UserId,
    int InstituteId,
    string RecipientId,
    string StudentName,
    string ParentName,
    string Message,
    string NotificationType,
    string IdempotencyKey);

public sealed record BackgroundNotificationResult(
    bool Sent,
    bool Skipped,
    int Attempts,
    long? NotificationId);
