using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IBackgroundNotificationRepository
{
    Task<List<BackgroundNotificationCandidate>> GetLateAttendanceCandidatesAsync(DateTime now, CancellationToken ct = default);
    Task<List<BackgroundNotificationCandidate>> GetHomeworkReminderCandidatesAsync(DateTime now, CancellationToken ct = default);
    Task<List<BackgroundNotificationCandidate>> GetQuotaLowCandidatesAsync(CancellationToken ct = default);
    Task<Notification?> FindByIdempotencyKeyAsync(string notificationType, string idempotencyKey, CancellationToken ct = default);
    Task<Notification> CreatePendingAsync(Notification notification, CancellationToken ct = default);
    Task MarkSentAsync(Notification notification, DateTime sentAt, CancellationToken ct = default);
    Task MarkFailedAsync(Notification notification, string error, CancellationToken ct = default);
}