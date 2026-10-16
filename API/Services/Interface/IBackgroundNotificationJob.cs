namespace academy_API.Services.Interface;

public interface IBackgroundNotificationJob
{
    Task<int> RunOnceAsync(DateTime now, CancellationToken ct = default);
}