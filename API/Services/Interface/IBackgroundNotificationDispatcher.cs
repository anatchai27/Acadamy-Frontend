using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IBackgroundNotificationDispatcher
{
    Task<BackgroundNotificationResult> DispatchAsync(BackgroundNotificationCandidate candidate, CancellationToken ct = default);
}