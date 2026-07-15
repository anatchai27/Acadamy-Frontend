using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class CourseServiceTests
{
    private static Mock<academy_API.Repositories.ICourseRepository> CreateMockRepo() => new();
    private static Mock<academy_API.Repositories.ISessionRepository> CreateMockSessionRepo() => new();

    // ──────────────────── CourseService ────────────────────

    // 1
    [Fact]
    public async Task CreateCourseAsync_ValidRequest_ReturnsCreateResponse()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.CreateAsync(It.IsAny<Course>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Course c, CancellationToken _) => { c.Id = 10; c.CreatedAt = DateTime.UtcNow; return c; });

        var sut = new CourseService(repoMock.Object);
        var result = await sut.CreateAsync(new CreateCourseRequest("Math 101", "Math", 10, 5000, 2), 1);

        Assert.Equal("success", result.Status);
        Assert.Equal(10, result.Data.CourseId);
        Assert.Equal("Math 101", result.Data.Name);
    }

    // 2
    [Fact]
    public async Task CreateCourseAsync_EmptyName_ThrowsValidationException()
    {
        var sut = new CourseService(CreateMockRepo().Object);
        var ex = await Assert.ThrowsAsync<CourseValidationException>(
            () => sut.CreateAsync(new CreateCourseRequest("", "Math", 10, 5000, 2), 1));
        Assert.Equal("NAME_REQUIRED", ex.ErrorCode);
    }

    // 3
    [Fact]
    public async Task CreateCourseAsync_WhitespaceName_ThrowsValidationException()
    {
        var sut = new CourseService(CreateMockRepo().Object);
        var ex = await Assert.ThrowsAsync<CourseValidationException>(
            () => sut.CreateAsync(new CreateCourseRequest("   ", "Math", 10, 5000, 2), 1));
        Assert.Equal("NAME_REQUIRED", ex.ErrorCode);
    }

    // 4
    [Fact]
    public async Task GetByIdAsync_ExistingCourse_ReturnsCourse()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetByIdAsync(10, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Course { Id = 10, Name = "Math 101", Subject = "Math", InstituteId = 1 });

        var sut = new CourseService(repoMock.Object);
        var result = await sut.GetByIdAsync(10, 1);

        Assert.NotNull(result);
        Assert.Equal("Math 101", result!.Name);
    }

    // 5
    [Fact]
    public async Task GetByIdAsync_NotFound_ReturnsNull()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetByIdAsync(999, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Course?)null);

        var sut = new CourseService(repoMock.Object);
        var result = await sut.GetByIdAsync(999, 1);
        Assert.Null(result);
    }

    // 6
    [Fact]
    public async Task UpdateAsync_ExistingCourse_ReturnsSuccess()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.UpdateAsync(10, It.IsAny<UpdateCourseRequest>(), 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Course { Id = 10, Name = "Updated Name" });

        var sut = new CourseService(repoMock.Object);
        var result = await sut.UpdateAsync(10, new UpdateCourseRequest("Updated Name", null, null, null, null), 1);

        Assert.Equal("success", result.Status);
        Assert.Equal("อัปเดตคอร์สเรียนสำเร็จ", result.Message);
    }

    // 7
    [Fact]
    public async Task UpdateAsync_NotFound_ThrowsNotFoundException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.UpdateAsync(999, It.IsAny<UpdateCourseRequest>(), 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Course?)null);

        var sut = new CourseService(repoMock.Object);
        var ex = await Assert.ThrowsAsync<CourseValidationException>(
            () => sut.UpdateAsync(999, new UpdateCourseRequest(null, null, null, null, null), 1));
        Assert.Equal("NOT_FOUND", ex.ErrorCode);
    }

    // 8
    [Fact]
    public async Task UpdateAsync_CrossInstitute_ThrowsForbiddenException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.UpdateAsync(10, It.IsAny<UpdateCourseRequest>(), 2, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("FORBIDDEN"));

        var sut = new CourseService(repoMock.Object);
        var ex = await Assert.ThrowsAsync<CourseValidationException>(
            () => sut.UpdateAsync(10, new UpdateCourseRequest(null, null, null, null, null), 2));
        Assert.Equal("FORBIDDEN", ex.ErrorCode);
    }

    // ──────────────────── SessionService ────────────────────

    // 9
    [Fact]
    public async Task CreateSessionAsync_ValidRequest_ReturnsCreateResponse()
    {
        var sessionRepoMock = CreateMockSessionRepo();
        sessionRepoMock.Setup(r => r.GetCourseByIdAsync(1, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Course { Id = 1, Name = "Math 101" });
        sessionRepoMock.Setup(r => r.CreateAsync(It.IsAny<Session>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Session s, CancellationToken _) => { s.Id = 5; return s; });

        var sut = new SessionService(sessionRepoMock.Object);
        var scheduledAt = new DateTime(2026, 7, 1, 10, 0, 0, DateTimeKind.Utc);
        var result = await sut.CreateAsync(1, new CreateSessionRequest(scheduledAt, 120, "Room A"), 1);

        Assert.Equal("success", result.Status);
        Assert.Equal(5, result.Data.SessionId);
    }

    // 10
    [Fact]
    public async Task CreateSessionAsync_CourseNotFound_ThrowsException()
    {
        var sessionRepoMock = CreateMockSessionRepo();
        sessionRepoMock.Setup(r => r.GetCourseByIdAsync(999, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Course?)null);

        var sut = new SessionService(sessionRepoMock.Object);
        var ex = await Assert.ThrowsAsync<SessionValidationException>(
            () => sut.CreateAsync(999, new CreateSessionRequest(DateTime.UtcNow, 60, null), 1));
        Assert.Equal("COURSE_NOT_FOUND", ex.ErrorCode);
    }

    // 11
    [Fact]
    public async Task CreateSessionAsync_UsesScheduledStatus()
    {
        Session? captured = null;
        var sessionRepoMock = CreateMockSessionRepo();
        sessionRepoMock.Setup(r => r.GetCourseByIdAsync(1, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Course { Id = 1, Name = "Math" });
        sessionRepoMock.Setup(r => r.CreateAsync(It.IsAny<Session>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Session s, CancellationToken _) => { captured = s; s.Id = 5; return s; });

        var sut = new SessionService(sessionRepoMock.Object);
        await sut.CreateAsync(1, new CreateSessionRequest(DateTime.UtcNow, 60, "R1"), 1);

        Assert.Equal("scheduled", captured!.Status);
    }

    // 12
    [Fact]
    public async Task GetByCourseIdAsync_ReturnsSessionsList()
    {
        var sessionRepoMock = CreateMockSessionRepo();
        sessionRepoMock.Setup(r => r.GetByCourseIdAsync(1, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new Session { Id = 1, CourseId = 1, Course = new Course { Name = "Math" }, ScheduledAt = DateTime.UtcNow, DurationMin = 60, Status = "scheduled" }
            ]);

        var sut = new SessionService(sessionRepoMock.Object);
        var result = await sut.GetByCourseIdAsync(1, 1);

        Assert.Equal("success", result.Status);
        Assert.Single(result.Data.Sessions);
        Assert.Equal("Math", result.Data.Sessions[0].CourseName);
    }
}
