using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class HomeworkServiceTests
{
    private static Mock<academy_API.Repositories.Interface.IHomeworkRepository> CreateMockRepo()
    {
        var repository = new Mock<academy_API.Repositories.Interface.IHomeworkRepository>();
        repository.Setup(r => r.GetCourseInstituteIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(7);
        return repository;
    }

    // 1
    [Fact]
    public async Task CreateAsync_ValidRequest_ReturnsCreateResponse()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.CreateAsync(It.IsAny<Homework>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Homework h, CancellationToken _) => { h.Id = 10; return h; });
        repoMock.Setup(r => r.GetTeacherIdByUserIdAsync(42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(24);

        var sut = new HomeworkService(repoMock.Object);
        var result = await sut.CreateAsync(
            new HomeworkRequest(1, "HW1", "desc", null, DateTime.UtcNow.AddDays(7)), 42);

        Assert.Equal("success", result.Status);
        Assert.Equal(10, result.Data.HomeworkId);
        Assert.Equal("HW1", result.Data.Title);
        repoMock.Verify(r => r.CreateAsync(
            It.Is<Homework>(homework => homework.AssignedBy == 24 && homework.InstituteId == 7),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_UserWithoutTeacherProfile_CreatesHomeworkWithNoAssignedTeacher()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetTeacherIdByUserIdAsync(42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((int?)null);
        repoMock.Setup(r => r.CreateAsync(It.IsAny<Homework>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Homework h, CancellationToken _) => { h.Id = 10; return h; });

        var sut = new HomeworkService(repoMock.Object);
        await sut.CreateAsync(new HomeworkRequest(1, "HW1", "desc", null, DateTime.UtcNow.AddDays(7)), 42);

        repoMock.Verify(r => r.CreateAsync(
            It.Is<Homework>(homework => homework.AssignedBy == null && homework.InstituteId == 7),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_CourseNotFound_ThrowsValidationExceptionWithoutCreatingHomework()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetCourseInstituteIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((int?)null);
        var sut = new HomeworkService(repoMock.Object);

        var exception = await Assert.ThrowsAsync<HomeworkValidationException>(() =>
            sut.CreateAsync(new HomeworkRequest(999, "HW1", null, null, DateTime.UtcNow.AddDays(1)), 42));

        Assert.Equal("COURSE_NOT_FOUND", exception.ErrorCode);
        repoMock.Verify(r => r.CreateAsync(It.IsAny<Homework>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // 2
    [Fact]
    public async Task CreateAsync_EmptyTitle_ThrowsException()
    {
        var sut = new HomeworkService(CreateMockRepo().Object);
        var ex = await Assert.ThrowsAsync<HomeworkValidationException>(
            () => sut.CreateAsync(new HomeworkRequest(1, "", null, null, DateTime.UtcNow), 42));
        Assert.Equal("TITLE_REQUIRED", ex.ErrorCode);
    }

    // 3
    [Fact]
    public async Task GetByCourseIdAsync_ReturnsList()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetByCourseIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new HomeworkItem(1, "HW1", null, null, DateTime.UtcNow, 0)]);

        var sut = new HomeworkService(repoMock.Object);
        var result = await sut.GetByCourseIdAsync(1);

        Assert.Equal("success", result.Status);
        Assert.Single(result.Data.Homeworks);
    }

    // 4
    [Fact]
    public async Task GetSubmissionsAsync_HomeworkNotFound_ThrowsException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetHomeworkByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Homework?)null);

        var sut = new HomeworkService(repoMock.Object);
        var ex = await Assert.ThrowsAsync<HomeworkValidationException>(
            () => sut.GetSubmissionsAsync(999));
        Assert.Equal("NOT_FOUND", ex.ErrorCode);
    }

    // 5
    [Fact]
    public async Task GradeSubmissionAsync_ValidRequest_ReturnsSuccess()
    {
        var submission = new HomeworkSubmission { Id = 5, HomeworkId = 1, StudentId = 10 };
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetSubmissionByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(submission);
        repoMock.Setup(r => r.UpdateSubmissionGradeAsync(submission, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = new HomeworkService(repoMock.Object);
        var result = await sut.GradeSubmissionAsync(5, new GradeSubmissionRequest(9.5m, "Good"));

        Assert.Equal("success", result.Status);
        Assert.Equal(9.5m, submission.Score);
        Assert.Equal("Good", submission.Feedback);
    }

    // 6
    [Fact]
    public async Task GradeSubmissionAsync_SubmissionNotFound_ThrowsException()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetSubmissionByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((HomeworkSubmission?)null);

        var sut = new HomeworkService(repoMock.Object);
        var ex = await Assert.ThrowsAsync<HomeworkValidationException>(
            () => sut.GradeSubmissionAsync(999, new GradeSubmissionRequest(5, null)));
        Assert.Equal("NOT_FOUND", ex.ErrorCode);
    }
}
