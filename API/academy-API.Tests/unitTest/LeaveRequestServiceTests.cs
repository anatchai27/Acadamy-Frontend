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
        repoMock.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LeaveRequest { Id = 5, StudentId = 10, Status = "pending", Session = new Session { CourseId = 3 } });
        repoMock.Setup(r => r.ApproveAsync(It.IsAny<LeaveRequest>(), 42, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = new LeaveRequestService(repoMock.Object);
        await sut.ApproveAsync(5, 42);

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
            .ReturnsAsync(new LeaveRequest { Id = 5, StudentId = 10, Status = "pending" });
        repoMock.Setup(r => r.RejectAsync(It.IsAny<LeaveRequest>(), 42, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = new LeaveRequestService(repoMock.Object);
        await sut.RejectAsync(5, 42);

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
