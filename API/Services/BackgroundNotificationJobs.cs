using academy_API.Repositories;

namespace academy_API.Services;

public interface IBackgroundNotificationJob
{
    Task<int> RunOnceAsync(DateTime now, CancellationToken ct = default);
}

public sealed class LateAttendanceNotificationJob(
    IBackgroundNotificationRepository repository,
    IBackgroundNotificationDispatcher dispatcher) : IBackgroundNotificationJob
{
    public async Task<int> RunOnceAsync(DateTime now, CancellationToken ct = default)
    {
        var candidates = await repository.GetLateAttendanceCandidatesAsync(now, ct);
        foreach (var candidate in candidates) await dispatcher.DispatchAsync(candidate, ct);
        return candidates.Count;
    }
}

public sealed class HomeworkReminderNotificationJob(
    IBackgroundNotificationRepository repository,
    IBackgroundNotificationDispatcher dispatcher) : IBackgroundNotificationJob
{
    public async Task<int> RunOnceAsync(DateTime now, CancellationToken ct = default)
    {
        var candidates = await repository.GetHomeworkReminderCandidatesAsync(now, ct);
        foreach (var candidate in candidates) await dispatcher.DispatchAsync(candidate, ct);
        return candidates.Count;
    }
}

public sealed class QuotaLowNotificationJob(
    IBackgroundNotificationRepository repository,
    IBackgroundNotificationDispatcher dispatcher) : IBackgroundNotificationJob
{
    public async Task<int> RunOnceAsync(DateTime now, CancellationToken ct = default)
    {
        var candidates = await repository.GetQuotaLowCandidatesAsync(ct);
        foreach (var candidate in candidates) await dispatcher.DispatchAsync(candidate, ct);
        return candidates.Count;
    }
}
