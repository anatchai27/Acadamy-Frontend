using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Repositories.Interface;
using academy_API.Services;
using academy_API.Services.Contracts;
using Moq;

namespace academy_API.Tests.unitTest;

public class ParentServiceTests
{
    [Fact]
    public async Task BindLineAsync_ReturnsAmbiguousForDuplicatePhoneWithoutWriting()
    {
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.FindByLineUserAsync("line-user", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repository.Setup(r => r.FindByPhoneAsync("0812345678", It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new Parent { Id = 1, InstituteId = 1, Phone = "0812345678" },
                new Parent { Id = 2, InstituteId = 2, Phone = "0812345678" }
            ]);
        var sut = new ParentService(repository.Object);

        var result = await sut.BindLineAsync("line-user", "081-234-5678");

        Assert.Equal(ParentBindingStatus.Ambiguous, result.Status);
        repository.Verify(r => r.CreateUserAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
        repository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task BindLineAsync_RejectsPhoneMatchAlreadyBoundToAnotherLineUser()
    {
        var existingUser = new User
        {
            Id = 10,
            Role = UserRole.parent,
            LineUserId = "different-line-user"
        };
        var parent = new Parent
        {
            Id = 1,
            UserId = existingUser.Id,
            User = existingUser,
            InstituteId = 1,
            Phone = "0812345678",
            LineUserId = "different-line-user"
        };
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.FindByLineUserAsync("new-line-user", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repository.Setup(r => r.FindByPhoneAsync("0812345678", It.IsAny<CancellationToken>()))
            .ReturnsAsync([parent]);
        var sut = new ParentService(repository.Object);

        var result = await sut.BindLineAsync("new-line-user", "0812345678");

        Assert.Equal(ParentBindingStatus.Conflict, result.Status);
        Assert.Equal("different-line-user", parent.LineUserId);
        Assert.Equal("different-line-user", existingUser.LineUserId);
        repository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task BindLineAsync_RequiresVerificationForUniquePhoneMatch()
    {
        var parent = new Parent { Id = 1, InstituteId = 1, Phone = "0812345678" };
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.FindByLineUserAsync("line-user", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repository.Setup(r => r.FindByPhoneAsync("0812345678", It.IsAny<CancellationToken>()))
            .ReturnsAsync([parent]);
        var sut = new ParentService(repository.Object);

        var result = await sut.BindLineAsync("line-user", "0812345678");

        Assert.Equal(ParentBindingStatus.VerificationRequired, result.Status);
        Assert.Null(parent.LineUserId);
        Assert.Null(parent.UserId);
        repository.Verify(r => r.CreateUserAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
        repository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task BindLineAsync_AllowsUniquePhoneBindingOnlyWhenTestModeIsEnabled()
    {
        var parent = new Parent { Id = 1, InstituteId = 1, Phone = "0812345678" };
        var user = new User { Id = 10, Role = UserRole.parent, InstituteId = 1 };
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.FindByLineUserAsync("line-user", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        repository.Setup(r => r.FindByPhoneAsync("0812345678", It.IsAny<CancellationToken>()))
            .ReturnsAsync([parent]);
        repository.Setup(r => r.CreateUserAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        repository.Setup(r => r.GetChildrenForInstituteAsync(user.Id, parent.InstituteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        var sut = new ParentService(repository.Object);

        var result = await sut.BindLineAsync("line-user", "0812345678", allowTestPhoneBinding: true);

        Assert.Equal(ParentBindingStatus.Success, result.Status);
        Assert.Equal(user.Id, parent.UserId);
        Assert.Equal("line-user", parent.LineUserId);
        Assert.Equal("line-user", user.LineUserId);
        repository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task BindLineAsync_UsesAccountInstituteForExistingLineMatch()
    {
        var user = new User { Id = 10, InstituteId = 2, Role = UserRole.parent, LineUserId = "line-user" };
        var otherInstituteParent = new Parent
        {
            Id = 1, UserId = user.Id, User = user, InstituteId = 1,
            Phone = "0812345678", LineUserId = "line-user"
        };
        var accountInstituteParent = new Parent
        {
            Id = 2, UserId = user.Id, User = user, InstituteId = 2,
            Phone = "0812345678", LineUserId = "line-user"
        };
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.FindByLineUserAsync("line-user", It.IsAny<CancellationToken>()))
            .ReturnsAsync([otherInstituteParent, accountInstituteParent]);
        repository.Setup(r => r.GetChildrenForInstituteAsync(user.Id, 2, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new ChildSummary(20, "Child", "G1", 2)]);
        var sut = new ParentService(repository.Object);

        var result = await sut.BindLineAsync("line-user", null);

        Assert.Equal(ParentBindingStatus.Success, result.Status);
        Assert.Same(accountInstituteParent, result.Binding!.Parent);
        Assert.All(result.Binding.Children, child => Assert.Equal(2, child.InstituteId));
        repository.Verify(r => r.GetChildrenForInstituteAsync(user.Id, 2, It.IsAny<CancellationToken>()), Times.Once);
    }

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
    public async Task IsParentOfPaymentAsync_DelegatesOwnershipCheck()
    {
        var repository = new Mock<IParentRepository>();
        repository.Setup(r => r.IsParentOfPaymentAsync(10, 44, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var sut = new ParentService(repository.Object);

        Assert.True(await sut.IsParentOfPaymentAsync(10, 44));
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
