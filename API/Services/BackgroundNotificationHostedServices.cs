using Microsoft.Extensions.DependencyInjection;

namespace academy_API.Services;

public sealed class BackgroundNotificationOptions
{
    public TimeSpan PollInterval { get; init; } = TimeSpan.FromMinutes(1);
}

public abstract class NotificationJobHostedService<TJob>(
    IServiceScopeFactory scopeFactory,
    BackgroundNotificationOptions options,
    ILogger<NotificationJobHostedService<TJob>> logger) : BackgroundService where TJob : IBackgroundNotificationJob
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = scopeFactory.CreateScope();
            var job = scope.ServiceProvider.GetRequiredService<TJob>();
            try
            {
                await job.RunOnceAsync(DateTime.UtcNow, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Background notification job {JobType} failed", typeof(TJob).Name);
            }
            await Task.Delay(options.PollInterval, stoppingToken);
        }
    }
}

public sealed class LateAttendanceNotificationHostedService(
    IServiceScopeFactory scopeFactory,
    BackgroundNotificationOptions options,
    ILogger<NotificationJobHostedService<LateAttendanceNotificationJob>> logger)
    : NotificationJobHostedService<LateAttendanceNotificationJob>(scopeFactory, options, logger);

public sealed class HomeworkReminderNotificationHostedService(
    IServiceScopeFactory scopeFactory,
    BackgroundNotificationOptions options,
    ILogger<NotificationJobHostedService<HomeworkReminderNotificationJob>> logger)
    : NotificationJobHostedService<HomeworkReminderNotificationJob>(scopeFactory, options, logger);

public sealed class QuotaLowNotificationHostedService(
    IServiceScopeFactory scopeFactory,
    BackgroundNotificationOptions options,
    ILogger<NotificationJobHostedService<QuotaLowNotificationJob>> logger)
    : NotificationJobHostedService<QuotaLowNotificationJob>(scopeFactory, options, logger);
