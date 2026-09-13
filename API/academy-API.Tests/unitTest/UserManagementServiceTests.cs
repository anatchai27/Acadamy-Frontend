using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using academy_API.Services.Contracts;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace academy_API.Tests.unitTest;

public class UserManagementServiceTests
{
    private static UserService CreateSut(Mock<IUserRepository> repository, Mock<ITokenService>? token = null)
    {
        var options = new DbContextOptionsBuilder<TutoringDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new TutoringDbContext(options, new academy_API.Tests.MockTenantProvider());
        token ??= new Mock<ITokenService>();
        token.Setup(t => t.HashPassword(It.IsAny<string>())).Returns("hashed-password");
        return new UserService(repository.Object, Mock.Of<IPdpaConsentRepository>(), token.Object, context);
    }

    [Fact]
    public async Task CreateStaffAsync_ValidTeacher_CreatesTenantScopedUserAndProfile()
    {
        var repository = new Mock<IUserRepository>();
        repository.Setup(r => r.GetByEmailOrPhoneAsync("teacher@example.com", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        repository.Setup(r => r.CreateStaffAsync(It.IsAny<User>(), It.IsAny<Teacher>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User user, Teacher? _, CancellationToken _) => { user.Id = 12; return user; });
        var sut = CreateSut(repository);

        var result = await sut.CreateStaffAsync(new CreateStaffRequest("teacher@example.com", "secret", null, UserRole.teacher, "Teacher"), 9);

        Assert.Equal(12, result.Id);
        repository.Verify(r => r.CreateStaffAsync(
            It.Is<User>(u => u.InstituteId == 9 && u.Email == "teacher@example.com"),
            It.Is<Teacher>(t => t.InstituteId == 9 && t.FullName == "Teacher"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateStaffAsync_DuplicateEmail_ThrowsValidationAndDoesNotPersist()
    {
        var repository = new Mock<IUserRepository>();
        repository.Setup(r => r.GetByEmailOrPhoneAsync("duplicate@example.com", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Id = 1, Email = "duplicate@example.com" });
        var sut = CreateSut(repository);

        var exception = await Assert.ThrowsAsync<UserValidationException>(() => sut.CreateStaffAsync(
            new CreateStaffRequest("duplicate@example.com", "secret", null, UserRole.staff, "Staff"), 9));

        Assert.Equal("EMAIL_CONFLICT", exception.Code);
        repository.Verify(r => r.CreateStaffAsync(It.IsAny<User>(), It.IsAny<Teacher?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateRoleForManagementAsync_PrimaryAdmin_IsRejected()
    {
        var repository = new Mock<IUserRepository>();
        repository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Id = 1, Role = UserRole.admin });
        var sut = CreateSut(repository);

        var result = await sut.UpdateRoleForManagementAsync(1, UserRole.staff);

        Assert.Equal(UserManagementResult.PrimaryAdmin, result);
        repository.Verify(r => r.UpdateRoleAsync(It.IsAny<int>(), It.IsAny<UserRole>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteForManagementAsync_RegularUser_DeletesUser()
    {
        var repository = new Mock<IUserRepository>();
        repository.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Id = 5, Role = UserRole.staff });
        repository.Setup(r => r.DeleteAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var sut = CreateSut(repository);

        var result = await sut.DeleteForManagementAsync(5);

        Assert.Equal(UserManagementResult.Deleted, result);
        repository.Verify(r => r.DeleteAsync(5, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithoutPdpa_RejectsBeforePersistence()
    {
        var repository = new Mock<IUserRepository>();
        var sut = CreateSut(repository);

        var exception = await Assert.ThrowsAsync<UserValidationException>(() => sut.RegisterAsync(new RegisterUserRequest
        {
            Email = "admin@example.com",
            Password = "secret",
            Role = UserRole.admin,
            AcceptPdpa = false
        }, null));

        Assert.Equal("PDPA_REQUIRED", exception.Code);
        repository.Verify(r => r.RegisterAsync(It.IsAny<Institute?>(), It.IsAny<User>(), It.IsAny<PdpaConsent>(), It.IsAny<Teacher?>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
