using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class ParentServiceTests
{
    [Fact]
    public async Task IsParentOfStudentAsync_ReturnsTrueOnlyForLinkedChild()
    {
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.IsParentOfStudentAsync(10, 20, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        repository.Setup(r => r.IsParentOfStudentAsync(10, 99, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var sut = new ParentService(repository.Object);

        Assert.True(await sut.IsParentOfStudentAsync(10, 20));
        Assert.False(await sut.IsParentOfStudentAsync(10, 99));
    }

    [Fact]
    public async Task GetProfileAsync_UsesUserAndChildrenFromRepository()
    {
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.FindByUserIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Parent { Id = 1, UserId = 10, FullName = "ผู้ปกครอง", Phone = "0812345678" });
        repository.Setup(r => r.FindUserByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Id = 10, Email = "parent@example.com" });
        repository.Setup(r => r.GetChildrenAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new ChildSummary(20, "เด็กชายหนึ่ง", "ป.1", 3)]);
        var sut = new ParentService(repository.Object);

        var result = await sut.GetProfileAsync(10);

        Assert.NotNull(result);
        Assert.Equal("parent@example.com", result!.Email);
        Assert.Single(result.Children);
        Assert.Equal(20, result.Children[0].Id);
    }

    [Fact]
    public async Task UpdateProfileAsync_UpdatesParentAndUserThroughRepository()
    {
        var parent = new Parent { Id = 1, UserId = 10, FullName = "เก่า", Phone = "0811111111" };
        var user = new User { Id = 10, Email = "old@example.com" };
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.FindByUserIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(parent);
        repository.Setup(r => r.FindUserByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        repository.Setup(r => r.GetChildrenAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        var sut = new ParentService(repository.Object);

        var result = await sut.UpdateProfileAsync(10, new UpdateParentProfileRequest("ใหม่", "0822222222", "new@example.com"));

        Assert.NotNull(result);
        Assert.Equal("ใหม่", parent.FullName);
        Assert.Equal("0822222222", parent.Phone);
        Assert.Equal("new@example.com", user.Email);
        repository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateOrGetHomeworkSubmissionAsync_DelegatesOwnershipScopedRequest()
    {
        var submission = new HomeworkSubmission { Id = 15, StudentId = 20, HomeworkId = 30 };
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.CreateOrGetHomeworkSubmissionAsync(10, 20, 30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(submission);
        var sut = new ParentService(repository.Object);

        var result = await sut.CreateOrGetHomeworkSubmissionAsync(10, 20, 30);

        Assert.Same(submission, result);
        repository.Verify(r => r.CreateOrGetHomeworkSubmissionAsync(10, 20, 30, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task IsParentOfHomeworkSubmissionAsync_DelegatesOwnershipCheck()
    {
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.IsParentOfHomeworkSubmissionAsync(10, 15, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var sut = new ParentService(repository.Object);

        Assert.True(await sut.IsParentOfHomeworkSubmissionAsync(10, 15));
    }
}
