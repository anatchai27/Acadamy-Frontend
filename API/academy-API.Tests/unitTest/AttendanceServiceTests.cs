using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class AttendanceServiceTests
{
    private static Mock<academy_API.Repositories.IAttendanceRepository> CreateMockRepo() => new();
    private static Mock<IBackgroundNotificationDispatcher> CreateMockDispatcher() => new();

    private static AttendanceService CreateSut(
        Mock<academy_API.Repositories.IAttendanceRepository>? repoMock = null,
        Mock<IBackgroundNotificationDispatcher>? dispatcherMock = null) =>
        new(repoMock?.Object ?? CreateMockRepo().Object, dispatcherMock?.Object ?? CreateMockDispatcher().Object);

    // 1 ──────────────────── ScanAsync ────────────────────

    [Fact]
    public async Task ScanAsync_ValidQrToken_ReturnsScanResponse()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.ValidateQrTokenAsync("valid-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { Id = 105, FullName = "สมชาย" });
        repoMock.Setup(r => r.IsDuplicateScanAsync(105, 12, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        repoMock.Setup(r => r.ScanCheckinWithTransactionAsync(105, 12, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repoMock.Setup(r => r.GetParentsWithLineAsync(105, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var sut = CreateSut(repoMock);
        var result = await sut.ScanAsync(new ScanAttendanceRequest("valid-token", 12));

        Assert.Equal("success", result.Status);
        Assert.Equal(105, result.Data.StudentId);
        Assert.Equal("สมชาย", result.Data.StudentName);
        Assert.Equal("present", result.Data.Status);
    }

    [Fact]
    public async Task ScanAsync_WithLineParent_DispatchesLoggedAttendanceNotification()
    {
        var repoMock = CreateMockRepo();
        var dispatcherMock = CreateMockDispatcher();
        BackgroundNotificationCandidate? candidate = null;
        repoMock.Setup(r => r.ValidateQrTokenAsync("valid-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { Id = 105, InstituteId = 7, FullName = "สมชาย" });
        repoMock.Setup(r => r.IsDuplicateScanAsync(105, 12, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        repoMock.Setup(r => r.ScanCheckinWithTransactionAsync(105, 12, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repoMock.Setup(r => r.GetParentsWithLineAsync(105, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Parent { Id = 22, UserId = 31, FullName = "ผู้ปกครอง", LineUserId = "line-user" }]);
        dispatcherMock
            .Setup(d => d.DispatchAsync(It.IsAny<BackgroundNotificationCandidate>(), It.IsAny<CancellationToken>()))
            .Callback<BackgroundNotificationCandidate, CancellationToken>((value, _) => candidate = value)
            .ReturnsAsync(new BackgroundNotificationResult(true, false, 1, 9));

        var sut = CreateSut(repoMock, dispatcherMock);
        await sut.ScanAsync(new ScanAttendanceRequest("valid-token", 12));

        Assert.NotNull(candidate);
        Assert.Equal("attendance_checkin", candidate!.NotificationType);
        Assert.Equal("attendance_checkin:12:105:22", candidate.IdempotencyKey);
        Assert.Equal(7, candidate.InstituteId);
        Assert.Contains("สมชาย", candidate.Message);
    }

    // 2
    [Fact]
    public async Task ScanAsync_InvalidQrToken_ThrowsInvalidQrException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.ValidateQrTokenAsync("bad-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Student?)null);

        var sut = CreateSut(repoMock);
        var ex = await Assert.ThrowsAsync<AttendanceValidationException>(
            () => sut.ScanAsync(new ScanAttendanceRequest("bad-token", 12)));
        Assert.Equal("INVALID_QR", ex.ErrorCode);
    }

    // 3
    [Fact]
    public async Task ScanAsync_DuplicateScan_ThrowsDuplicateException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.ValidateQrTokenAsync("valid-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { Id = 105 });
        repoMock.Setup(r => r.IsDuplicateScanAsync(105, 12, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = CreateSut(repoMock);
        var ex = await Assert.ThrowsAsync<AttendanceValidationException>(
            () => sut.ScanAsync(new ScanAttendanceRequest("valid-token", 12)));
        Assert.Equal("DUPLICATE_SCAN", ex.ErrorCode);
    }

    // 4
    [Fact]
    public async Task ScanAsync_CallsTransactionMethod()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.ValidateQrTokenAsync("token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Student { Id = 105 });
        repoMock.Setup(r => r.IsDuplicateScanAsync(105, 12, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        repoMock.Setup(r => r.ScanCheckinWithTransactionAsync(105, 12, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repoMock.Setup(r => r.GetParentsWithLineAsync(105, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var sut = CreateSut(repoMock);
        await sut.ScanAsync(new ScanAttendanceRequest("token", 12));

        repoMock.Verify(r => r.ScanCheckinWithTransactionAsync(105, 12, It.IsAny<CancellationToken>()), Times.Once);
    }

    // 5 ──────────────────── ManualAsync ────────────────────

    [Fact]
    public async Task ManualAsync_ValidPresent_ReturnsManualResponse()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.IsDuplicateScanAsync(105, 12, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        repoMock.Setup(r => r.ManualCheckinWithTransactionAsync(105, 12, "present", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut(repoMock);
        var result = await sut.ManualAsync(new ManualAttendanceRequest(12, 105, "present"));

        Assert.Equal("success", result.Status);
        Assert.Equal("present", result.Data.StatusRecorded);
    }

    // 6
    [Fact]
    public async Task ManualAsync_AbsentStatus_CallsTransactionMethod()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.IsDuplicateScanAsync(105, 12, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        repoMock.Setup(r => r.ManualCheckinWithTransactionAsync(105, 12, "absent", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut(repoMock);
        await sut.ManualAsync(new ManualAttendanceRequest(12, 105, "absent"));

        repoMock.Verify(r => r.ManualCheckinWithTransactionAsync(105, 12, "absent", It.IsAny<CancellationToken>()), Times.Once);
    }

    // 7
    [Fact]
    public async Task ManualAsync_InvalidStatus_ThrowsException()
    {
        var sut = CreateSut();
        var ex = await Assert.ThrowsAsync<AttendanceValidationException>(
            () => sut.ManualAsync(new ManualAttendanceRequest(12, 105, "invalid")));
        Assert.Equal("INVALID_STATUS", ex.ErrorCode);
    }

    // 8
    [Fact]
    public async Task ManualAsync_DuplicateScan_ThrowsException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.IsDuplicateScanAsync(105, 12, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = CreateSut(repoMock);
        var ex = await Assert.ThrowsAsync<AttendanceValidationException>(
            () => sut.ManualAsync(new ManualAttendanceRequest(12, 105, "present")));
        Assert.Equal("DUPLICATE_SCAN", ex.ErrorCode);
    }

    // 9 ──────────────────── GetDailyAsync ────────────────────

    [Fact]
    public async Task GetDailyAsync_ValidDate_ReturnsDailyResponse()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetSessionByIdAsync(12, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Session { Id = 12, Course = new Course { Name = "คณิต ม.1" }, ScheduledAt = new DateTime(2026, 6, 14, 13, 0, 0, DateTimeKind.Utc) });
        repoMock.Setup(r => r.GetDailyAttendanceAsync(12, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new DailyAttendanceRow(1, 105, "สมชาย", "ชาย", "present", DateTime.UtcNow, null, null)]);

        var sut = CreateSut(repoMock);
        var result = await sut.GetDailyAsync(12, "2026-06-14");

        Assert.Equal("success", result.Status);
        Assert.NotNull(result.Data.SessionInfo);
        Assert.Equal("คณิต ม.1", result.Data.SessionInfo!.CourseName);
        Assert.Single(result.Data.Attendances);
    }

    // 10
    [Fact]
    public async Task GetDailyAsync_InvalidDateFormat_ThrowsException()
    {
        var sut = CreateSut();
        var ex = await Assert.ThrowsAsync<AttendanceValidationException>(
            () => sut.GetDailyAsync(null, "14-06-2026"));
        Assert.Equal("INVALID_DATE", ex.ErrorCode);
    }
}
