using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class TeacherServiceTests
{
    private static CreateTeacherRequest CreateRequest(
        string fullName = "  Teacher One  ",
        string? email = null,
        string? password = null) => new(
            fullName, "Math", "Bio", 500m, " photo.jpg ", " bank ", " tax ", null, email, password, "teacher");

    [Fact]
    public async Task CreateAsync_ValidRequest_TrimsFieldsAndCreatesTeacher()
    {
        var repository = new Mock<ITeacherRepository>();
        repository.Setup(r => r.CreateAsync(It.IsAny<Teacher>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Teacher teacher, User? _, CancellationToken _) =>
            {
                teacher.Id = 12;
                return teacher;
            });
        var service = new TeacherService(repository.Object);

        var result = await service.CreateAsync(CreateRequest(), 7);

        Assert.Equal(12, result.Id);
        Assert.Equal(7, result.InstituteId);
        Assert.Equal("Teacher One", result.FullName);
        Assert.Equal("Math", result.Specialization);
        Assert.Equal("photo.jpg", result.PhotoUrl);
        Assert.Equal("active", result.Status);
    }

    [Fact]
    public async Task CreateAsync_WithUser_CreatesTeacherAndHashedUser()
    {
        var repository = new Mock<ITeacherRepository>();
        repository.Setup(r => r.GetUserByEmailAsync("teacher@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        repository.Setup(r => r.CreateAsync(It.IsAny<Teacher>(), It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Teacher teacher, User? user, CancellationToken _) =>
            {
                teacher.Id = 13;
                teacher.UserId = 20;
                teacher.User = user;
                return teacher;
            });
        var service = new TeacherService(repository.Object);

        var result = await service.CreateAsync(CreateRequest(email: " teacher@example.com ", password: "Password123!"), 7);

        Assert.Equal(20, result.UserId);
        repository.Verify(r => r.CreateAsync(
            It.Is<Teacher>(teacher => teacher.InstituteId == 7),
            It.Is<User>(user => user.Email == "teacher@example.com" && user.Role == UserRole.teacher && user.PasswordHash != "Password123!"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateEmail_ThrowsConflict()
    {
        var repository = new Mock<ITeacherRepository>();
        repository.Setup(r => r.GetUserByEmailAsync("teacher@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Id = 1, Email = "teacher@example.com" });
        var service = new TeacherService(repository.Object);

        var exception = await Assert.ThrowsAsync<TeacherValidationException>(() =>
            service.CreateAsync(CreateRequest(email: "teacher@example.com", password: "secret"), 7));

        Assert.Equal("EMAIL_CONFLICT", exception.Code);
        repository.Verify(r => r.CreateAsync(It.IsAny<Teacher>(), It.IsAny<User?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PatchAsync_ValidRequest_UpdatesProvidedFieldsOnly()
    {
        var teacher = new Teacher { Id = 4, FullName = "Old", Specialization = "Old specialization", Status = "active" };
        var repository = new Mock<ITeacherRepository>();
        repository.Setup(r => r.GetByIdAsync(4, It.IsAny<CancellationToken>())).ReturnsAsync(teacher);
        var service = new TeacherService(repository.Object);

        var result = await service.PatchAsync(4, new PatchTeacherRequest(" New ", null, null, null, null, null, null, null));

        Assert.Equal(PatchTeacherResult.Updated, result);
        Assert.Equal("New", teacher.FullName);
        Assert.Equal("Old specialization", teacher.Specialization);
        repository.Verify(r => r.SaveAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task PatchAsync_EmptyFullName_ThrowsValidation()
    {
        var repository = new Mock<ITeacherRepository>();
        repository.Setup(r => r.GetByIdAsync(4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Teacher { Id = 4, FullName = "Teacher" });
        var service = new TeacherService(repository.Object);

        var exception = await Assert.ThrowsAsync<TeacherValidationException>(() =>
            service.PatchAsync(4, new PatchTeacherRequest(" ", null, null, null, null, null, null, null)));

        Assert.Equal("FULL_NAME_EMPTY", exception.Code);
        repository.Verify(r => r.SaveAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_MissingTeacher_ReturnsFalseWithoutPersistence()
    {
        var repository = new Mock<ITeacherRepository>();
        repository.Setup(r => r.GetByIdAsync(404, It.IsAny<CancellationToken>())).ReturnsAsync((Teacher?)null);
        var service = new TeacherService(repository.Object);

        Assert.False(await service.DeleteAsync(404));
        repository.Verify(r => r.DeleteAsync(It.IsAny<Teacher>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
