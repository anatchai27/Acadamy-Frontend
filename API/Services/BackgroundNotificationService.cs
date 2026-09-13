using System.Text.Json;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services.Contracts;

namespace academy_API.Services;

public interface IBackgroundNotificationDispatcher
{
    Task<BackgroundNotificationResult> DispatchAsync(BackgroundNotificationCandidate candidate, CancellationToken ct = default);
}

public sealed class BackgroundNotificationDispatcher(
    IBackgroundNotificationRepository repository,
    ILineNotificationService lineNotificationService) : IBackgroundNotificationDispatcher
{
    private const int MaxRetries = 3;

    public async Task<BackgroundNotificationResult> DispatchAsync(BackgroundNotificationCandidate candidate, CancellationToken ct = default)
    {
        var existing = await repository.FindByIdempotencyKeyAsync(candidate.NotificationType, candidate.IdempotencyKey, ct);
        if (existing?.Status == "sent")
            return new BackgroundNotificationResult(false, true, 0, existing.Id);
        if (existing is not null && existing.RetryCount >= existing.MaxRetries)
            return new BackgroundNotificationResult(false, true, 0, existing.Id);

        var notification = existing ?? await repository.CreatePendingAsync(new Notification
        {
            UserId = candidate.UserId,
            InstituteId = candidate.InstituteId,
            Channel = "line",
            Message = candidate.Message,
            Status = "pending",
            RecipientId = candidate.RecipientId,
            RetryCount = 0,
            MaxRetries = MaxRetries,
            ScheduledAt = DateTime.UtcNow,
            NotificationType = candidate.NotificationType,
            Payload = JsonSerializer.Serialize(new { idempotencyKey = candidate.IdempotencyKey })
        }, ct);

        var attempts = 0;
        while (attempts < MaxRetries && notification.Status != "sent")
        {
            attempts++;
            try
            {
                await lineNotificationService.SendTextMessageAsync(candidate.RecipientId, candidate.Message, ct);
                await repository.MarkSentAsync(notification, DateTime.UtcNow, ct);
                return new BackgroundNotificationResult(true, false, attempts, notification.Id);
            }
            catch (Exception ex) when (attempts < MaxRetries)
            {
                await repository.MarkFailedAsync(notification, ex.Message, ct);
            }
            catch (Exception ex)
            {
                await repository.MarkFailedAsync(notification, ex.Message, ct);
                return new BackgroundNotificationResult(false, false, attempts, notification.Id);
            }
        }

        return new BackgroundNotificationResult(false, false, attempts, notification.Id);
    }
}
