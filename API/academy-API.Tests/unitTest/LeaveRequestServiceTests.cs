using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class LeaveRequestServiceTests
{
    private static Mock<academy_API.Repositories.ILeaveRequestRepository> CreateMockRepo() => new();

    // 1
    [Fact]
    public async Task GetAllAsync_ReturnsPaginatedResponse()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.SearchAsync(null, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new List<LeaveRequestItem>(), 0));

        var sut = new LeaveRequestService(repoMock.Object);
        var result = await sut.GetAllAsync(null, 1, 20);

        Assert.Equal("success", result.Status);
        Assert.Equal(1, result.Data.Pagination.CurrentPage);
    }

    // 2
    [Fact]
    public async Task GetAllAsync_WithStatusFilter_PassesToRepo()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.SearchAsync("pending", 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new List<LeaveRequestItem>(), 0));

        var sut = new LeaveRequestService(repoMock.Object);
        await sut.GetAllAsync("pending", 1, 20);

        repoMock.Verify(r => r.SearchAsync("pending", 1, 20, It.IsAny<CancellationToken>()), Times.Once);
    }

    // 3
    [Fact]
    public async Task ApproveAsync_ValidPendingRequest_CallsApprove()
    {
        var repoMock = CreateMockRepo();
        var request = new LeaveRequest
        {
            Id = 5,
            StudentId = 10,
            Status = "pending",
            Reason = "ป่วย",
            Type = "advance",
            RequestedAt = DateTime.UtcNow,
            Session = new Session { Id = 7, CourseId = 3, ScheduledAt = DateTime.UtcNow.AddDays(2) },
            Student = new Student { Id = 10, FullName = "สมชาย" }
        };
        repoMock.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);
        repoMock.Setup(r => r.ApproveAsync(It.IsAny<LeaveRequest>(), 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((request, new MakeupCredit { Id = 8, StudentId = 10, CourseId = 3, Status = "available", ExpiresAt = DateTime.UtcNow.AddMonths(3) }));

        var sut = new LeaveRequestService(repoMock.Object);
        var result = await sut.ApproveAsync(5, 42);

        Assert.Equal("approved", result.Status);
        Assert.NotNull(result.MakeupCredit);
        repoMock.Verify(r => r.ApproveAsync(It.Is<LeaveRequest>(lr => lr.Id == 5), 42, It.IsAny<CancellationToken>()), Times.Once);
    }

    // 4
    [Fact]
    public async Task ApproveAsync_NotFound_ThrowsException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((LeaveRequest?)null);

        var sut = new LeaveRequestService(repoMock.Object);
        var ex = await Assert.ThrowsAsync<LeaveRequestValidationException>(
            () => sut.ApproveAsync(999, 42));
        Assert.Equal("NOT_FOUND", ex.ErrorCode);
    }

    // 5
    [Fact]
    public async Task ApproveAsync_AlreadyApproved_ThrowsException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LeaveRequest { Id = 5, Status = "approved" });

        var sut = new LeaveRequestService(repoMock.Object);
        var ex = await Assert.ThrowsAsync<LeaveRequestValidationException>(
            () => sut.ApproveAsync(5, 42));
        Assert.Equal("INVALID_STATUS", ex.ErrorCode);
    }

    // 6
    [Fact]
    public async Task RejectAsync_ValidPendingRequest_CallsReject()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LeaveRequest
            {
                Id = 5,
                StudentId = 10,
                SessionId = 7,
                Status = "pending",
                Type = "urgent",
                RequestedAt = DateTime.UtcNow,
                Session = new Session { Id = 7, CourseId = 3, ScheduledAt = DateTime.UtcNow.AddHours(2) },
                Student = new Student { Id = 10, FullName = "สมชาย" }
            });
        repoMock.Setup(r => r.RejectAsync(It.IsAny<LeaveRequest>(), 42, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = new LeaveRequestService(repoMock.Object);
        var result = await sut.RejectAsync(5, 42);

        Assert.Equal("rejected", result.Status);
        repoMock.Verify(r => r.RejectAsync(It.Is<LeaveRequest>(lr => lr.Id == 5), 42, It.IsAny<CancellationToken>()), Times.Once);
    }

    // 7
    [Fact]
    public async Task RejectAsync_AlreadyRejected_ThrowsException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LeaveRequest { Id = 5, Status = "rejected" });

        var sut = new LeaveRequestService(repoMock.Object);
        var ex = await Assert.ThrowsAsync<LeaveRequestValidationException>(
            () => sut.RejectAsync(5, 42));
        Assert.Equal("INVALID_STATUS", ex.ErrorCode);
    }
}

public class LeaveRequestCreateServiceTests
{
    [Fact]
    public async Task CreateAsync_MoreThan24HoursBeforeSession_CalculatesAdvanceType()
    {
        // Arrange
        var repository = new Mock<academy_API.Repositories.ILeaveRequestRepository>();
        var session = new Session { Id = 7, CourseId = 3, ScheduledAt = DateTime.UtcNow.AddDays(2) };
        repository.Setup(x => x.GetSessionForStudentAsync(10, 7, It.IsAny<CancellationToken>())).ReturnsAsync(session);
        repository.Setup(x => x.CreateAsync(It.IsAny<LeaveRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((LeaveRequest request, CancellationToken _) => request);
        var sut = new LeaveRequestService(repository.Object);

        // Act
        var result = await sut.CreateAsync(10, 1, new CreateLeaveRequestRequest(7, "ติดธุระ"), CancellationToken.None);

        // Assert
        Assert.Equal("advance", result.Type);
        Assert.Equal("pending", result.Status);
        repository.Verify(x => x.CreateAsync(It.Is<LeaveRequest>(request => request.Type == "advance"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_SessionAlreadyStarted_CalculatesAbsenceType()
    {
        // Arrange
        var repository = new Mock<academy_API.Repositories.ILeaveRequestRepository>();
        repository.Setup(x => x.GetSessionForStudentAsync(10, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Session { Id = 7, CourseId = 3, ScheduledAt = DateTime.UtcNow.AddMinutes(-5) });
        repository.Setup(x => x.CreateAsync(It.IsAny<LeaveRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((LeaveRequest request, CancellationToken _) => request);
        var sut = new LeaveRequestService(repository.Object);

        // Act
        var result = await sut.CreateAsync(10, 1, new CreateLeaveRequestRequest(7, "ป่วย"), CancellationToken.None);

        // Assert
        Assert.Equal("absence", result.Type);
    }

    [Fact]
    public async Task ApproveAsync_AlreadyApproved_RejectsSecondDecision()
    {
        // Arrange
        var repository = new Mock<academy_API.Repositories.ILeaveRequestRepository>();
        repository.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LeaveRequest { Id = 5, Status = "approved" });
        var sut = new LeaveRequestService(repository.Object);

        // Act
        var exception = await Assert.ThrowsAsync<LeaveRequestValidationException>(() => sut.ApproveAsync(5, 42, CancellationToken.None));

        // Assert
        Assert.Equal("INVALID_STATUS", exception.ErrorCode);
        repository.Verify(x => x.ApproveAsync(It.IsAny<LeaveRequest>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
