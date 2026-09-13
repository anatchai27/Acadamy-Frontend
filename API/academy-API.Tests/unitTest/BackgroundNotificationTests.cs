using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using academy_API.Services.Contracts;
using Moq;

namespace academy_API.Tests.unitTest;

public class BackgroundNotificationTests
{
    private static BackgroundNotificationCandidate Candidate(string key = "late_attendance:1:2:2026-09-13") =>
        new(10, 1, "line-user", "Student", "Parent", "Reminder", "late_attendance", key);

    [Fact]
    public async Task Dispatcher_RetriesAfterTransientFailure_AndLogsSent()
    {
        var repository = new Mock<IBackgroundNotificationRepository>();
        var line = new Mock<ILineNotificationService>();
        var pending = new Notification { Id = 4, Status = "pending", RetryCount = 0, MaxRetries = 3 };
        repository.Setup(r => r.FindByIdempotencyKeyAsync("late_attendance", It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Notification?)null);
        repository.Setup(r => r.CreatePendingAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pending);
        line.SetupSequence(l => l.SendTextMessageAsync("line-user", "Reminder", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("temporary"))
            .Returns(Task.CompletedTask);
        var sut = new BackgroundNotificationDispatcher(repository.Object, line.Object);

        var result = await sut.DispatchAsync(Candidate());

        Assert.True(result.Sent);
        Assert.Equal(2, result.Attempts);
        repository.Verify(r => r.MarkFailedAsync(pending, "temporary", It.IsAny<CancellationToken>()), Times.Once);
        repository.Verify(r => r.MarkSentAsync(pending, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Dispatcher_WhenAlreadySent_SkipsDuplicateExecution()
    {
        var repository = new Mock<IBackgroundNotificationRepository>();
        var line = new Mock<ILineNotificationService>();
        var existing = new Notification { Id = 12, Status = "sent" };
        repository.Setup(r => r.FindByIdempotencyKeyAsync("late_attendance", It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);
        var sut = new BackgroundNotificationDispatcher(repository.Object, line.Object);

        var result = await sut.DispatchAsync(Candidate());

        Assert.True(result.Skipped);
        Assert.Equal(12, result.NotificationId);
        line.Verify(l => l.SendTextMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        repository.Verify(r => r.CreatePendingAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Dispatcher_WhenAllAttemptsFail_MarksNotificationFailed()
    {
        var repository = new Mock<IBackgroundNotificationRepository>();
        var line = new Mock<ILineNotificationService>();
        var pending = new Notification { Id = 8, Status = "pending", RetryCount = 0, MaxRetries = 3 };
        repository.Setup(r => r.FindByIdempotencyKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Notification?)null);
        repository.Setup(r => r.CreatePendingAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pending);
        line.Setup(l => l.SendTextMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("downstream unavailable"));
        var sut = new BackgroundNotificationDispatcher(repository.Object, line.Object);

        var result = await sut.DispatchAsync(Candidate());

        Assert.False(result.Sent);
        Assert.Equal(3, result.Attempts);
        repository.Verify(r => r.MarkFailedAsync(pending, "downstream unavailable", It.IsAny<CancellationToken>()), Times.Exactly(3));
        line.Verify(l => l.SendTextMessageAsync("line-user", "Reminder", It.IsAny<CancellationToken>()), Times.Exactly(3));
    }

    [Fact]
    public async Task LateAttendanceJob_DelegatesEveryCandidateOnce()
    {
        var repository = new Mock<IBackgroundNotificationRepository>();
        var dispatcher = new Mock<IBackgroundNotificationDispatcher>();
        repository.Setup(r => r.GetLateAttendanceCandidatesAsync(It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([Candidate("one"), Candidate("two")]);
        var sut = new LateAttendanceNotificationJob(repository.Object, dispatcher.Object);

        var count = await sut.RunOnceAsync(DateTime.UtcNow);

        Assert.Equal(2, count);
        dispatcher.Verify(d => d.DispatchAsync(It.IsAny<BackgroundNotificationCandidate>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}
