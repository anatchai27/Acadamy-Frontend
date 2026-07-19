using academy_API.Data;
using academy_API.Models;
using academy_API.Services;
using academy_API.Services.Contracts;
using academy_API.Tests;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace academy_API.Tests.unitTest;

public class UserServiceTests
{
    private static TutoringDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TutoringDbContext>()
            .UseInMemoryDatabase(dbName)
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new TutoringDbContext(options, new MockTenantProvider());
    }

    private static User CreateTestUser(string email = "test@example.com", string passwordHash = "$2a$11$hashedpassword", UserRole role = UserRole.student) => new()
    {
        Id = 1,
        Role = role,
        Email = email,
        PasswordHash = passwordHash,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    private static Mock<ITokenService> CreateMockTokenService(
        bool verifyResult = true,
        string generatedToken = "eyJhbGciOiJIUzI1NiJ9.mock-token",
        string passwordHash = "$2a$11$hashedpassword")
    {
        var mock = new Mock<ITokenService>();
        mock.Setup(s => s.VerifyPassword(It.IsAny<string>(), It.IsAny<string>()))
            .Returns((string pwd, string hash) => verifyResult && hash == passwordHash);
        mock.Setup(s => s.GenerateToken(It.IsAny<User>())).Returns(generatedToken);
        mock.Setup(s => s.HashPassword(It.IsAny<string>())).Returns(passwordHash);
        return mock;
    }

    private static UserService CreateUserService(TutoringDbContext context, Mock<ITokenService>? tokenMock = null)
    {
        var userRepoMock = new Mock<academy_API.Repositories.IUserRepository>();
        var pdpaRepoMock = new Mock<academy_API.Repositories.IPdpaConsentRepository>();
        tokenMock ??= CreateMockTokenService();
        return new UserService(userRepoMock.Object, pdpaRepoMock.Object, tokenMock.Object, context);
    }

    // 1 ──────────────────── LoginAsync ────────────────────

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsLoginResult()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "user@example.com"));
        await context.SaveChangesAsync();

        var tokenMock = CreateMockTokenService(generatedToken: "valid.jwt.token");
        var sut = CreateUserService(context, tokenMock);
        var result = await sut.LoginAsync("user@example.com", "correct-password");

        Assert.NotNull(result);
        Assert.Equal("valid.jwt.token", result!.Token);
        Assert.Equal(1, result.UserId);
        Assert.Equal("user@example.com", result.Email);
        Assert.Equal("student", result.Role);
    }

    // 2
    [Fact]
    public async Task LoginAsync_WrongPassword_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "user@example.com", passwordHash: "correct-hash"));
        await context.SaveChangesAsync();

        var tokenMock = CreateMockTokenService(verifyResult: false);
        var sut = CreateUserService(context, tokenMock);
        var result = await sut.LoginAsync("user@example.com", "wrong-password");

        Assert.Null(result);
        tokenMock.Verify(v => v.GenerateToken(It.IsAny<User>()), Times.Never);
    }

    // 3
    [Fact]
    public async Task LoginAsync_UserNotFound_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var tokenMock = CreateMockTokenService();
        var sut = CreateUserService(context, tokenMock);
        var result = await sut.LoginAsync("nonexistent@example.com", "any-password");

        Assert.Null(result);
        tokenMock.Verify(v => v.GenerateToken(It.IsAny<User>()), Times.Never);
    }

    // 4
    [Fact]
    public async Task LoginAsync_AdminRole_ReturnsCorrectRole()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "admin@ex.com", role: UserRole.admin));
        await context.SaveChangesAsync();

        var sut = CreateUserService(context, CreateMockTokenService(generatedToken: "admin.jwt.token"));
        var result = await sut.LoginAsync("admin@ex.com", "password");

        Assert.Equal("admin", result!.Role);
    }

    // 5
    [Fact]
    public async Task LoginAsync_TeacherRole_ReturnsTeacher()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "t@ex.com", role: UserRole.teacher));
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        Assert.Equal("teacher", (await sut.LoginAsync("t@ex.com", "password"))!.Role);
    }

    // 6
    [Fact]
    public async Task LoginAsync_ParentRole_ReturnsParent()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "p@ex.com", role: UserRole.parent));
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        Assert.Equal("parent", (await sut.LoginAsync("p@ex.com", "password"))!.Role);
    }

    // 7
    [Fact]
    public async Task LoginAsync_ReturnsCorrectUserId()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "u@ex.com");
        user.Id = 999;
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        Assert.Equal(999, (await sut.LoginAsync("u@ex.com", "password"))!.UserId);
    }

    // 8
    [Fact]
    public async Task LoginAsync_ReturnsCorrectEmail()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "correct@ex.com"));
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        Assert.Equal("correct@ex.com", (await sut.LoginAsync("correct@ex.com", "password"))!.Email);
    }

    // 9
    [Fact]
    public async Task LoginAsync_EmptyEmail_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var sut = CreateUserService(context);
        Assert.Null(await sut.LoginAsync("", "password"));
    }

    // 10
    [Fact]
    public async Task LoginAsync_EmptyPassword_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "u@ex.com", passwordHash: "stored-hash"));
        await context.SaveChangesAsync();

        var tokenMock = CreateMockTokenService(verifyResult: false, passwordHash: "stored-hash");
        var sut = CreateUserService(context, tokenMock);
        var result = await sut.LoginAsync("u@ex.com", "");

        Assert.Null(result);
        tokenMock.Verify(v => v.VerifyPassword("", "stored-hash"), Times.Once);
        tokenMock.Verify(v => v.GenerateToken(It.IsAny<User>()), Times.Never);
    }

    // 11
    [Fact]
    public async Task LoginAsync_CaseSensitiveEmail_MismatchReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "User@Example.com"));
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        Assert.Null(await sut.LoginAsync("user@example.com", "password"));
    }

    // 12
    [Fact]
    public async Task LoginAsync_MultipleUsers_ReturnsOnlyMatchingUser()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user1 = CreateTestUser(email: "a@ex.com");
        user1.Id = 100;
        var user2 = CreateTestUser(email: "b@ex.com");
        user2.Id = 200;
        context.Users.Add(user1);
        context.Users.Add(user2);
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        var result = await sut.LoginAsync("b@ex.com", "password");
        Assert.Equal("b@ex.com", result!.Email);
    }

    // 13
    [Fact]
    public async Task LoginAsync_VerifyPasswordCalledWithCorrectHash()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "u@ex.com", passwordHash: "stored-hash-123"));
        await context.SaveChangesAsync();

        var tokenMock = new Mock<ITokenService>();
        tokenMock.Setup(s => s.VerifyPassword("mypass", "stored-hash-123")).Returns(true);
        tokenMock.Setup(s => s.GenerateToken(It.IsAny<User>())).Returns("token");
        var sut = CreateUserService(context, tokenMock);

        await sut.LoginAsync("u@ex.com", "mypass");
        tokenMock.Verify(v => v.VerifyPassword("mypass", "stored-hash-123"), Times.Once);
    }

    // 14 ──────────────────── ForgetPasswordAsync ────────────────────

    [Fact]
    public async Task ForgetPasswordAsync_UserExists_SetsResetTokenAndReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "user@example.com"));
        await context.SaveChangesAsync();

        var tokenMock = CreateMockTokenService(passwordHash: "reset-token-hash");
        tokenMock.Setup(s => s.HashPassword(It.IsAny<string>())).Returns("reset-token-hash");
        var sut = CreateUserService(context, tokenMock);
        var result = await sut.ForgetPasswordAsync("user@example.com", "https://frontend.com/reset");

        Assert.True(result);
        tokenMock.Verify(v => v.HashPassword(It.IsAny<string>()), Times.Once);
        var updatedUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "user@example.com");
        Assert.Equal("reset-token-hash", updatedUser!.ResetToken);
        Assert.NotNull(updatedUser.ResetTokenExpiry);
    }

    // 15
    [Fact]
    public async Task ForgetPasswordAsync_UserNotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var sut = CreateUserService(context);
        Assert.False(await sut.ForgetPasswordAsync("nx@ex.com", "link"));
    }

    // 16
    [Fact]
    public async Task ForgetPasswordAsync_UpdatesUpdatedAtTimestamp()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "u@ex.com");
        user.UpdatedAt = DateTime.UtcNow.AddDays(-5);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        await sut.ForgetPasswordAsync("u@ex.com", "link");

        var updated = await context.Users.FirstAsync(u => u.Email == "u@ex.com");
        Assert.True(updated.UpdatedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    // 17
    [Fact]
    public async Task ForgetPasswordAsync_OverwritesExistingResetToken()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "u@ex.com");
        user.ResetToken = "old-token-hash";
        user.ResetTokenExpiry = DateTime.UtcNow.AddDays(1);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var tokenMock = CreateMockTokenService();
        tokenMock.Setup(s => s.HashPassword(It.IsAny<string>())).Returns("new-hash");
        var sut = CreateUserService(context, tokenMock);
        await sut.ForgetPasswordAsync("u@ex.com", "link");

        var updated = await context.Users.FirstAsync(u => u.Email == "u@ex.com");
        Assert.Equal("new-hash", updated.ResetToken);
    }

    // 18
    [Fact]
    public async Task ForgetPasswordAsync_SetsExpiryToOneHour()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "u@ex.com"));
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        await sut.ForgetPasswordAsync("u@ex.com", "link");

        var updated = await context.Users.FirstAsync(u => u.Email == "u@ex.com");
        var diff = updated.ResetTokenExpiry!.Value - DateTime.UtcNow;
        Assert.True(diff.TotalMinutes > 59);
        Assert.True(diff.TotalMinutes < 61);
    }

    // 19
    [Fact]
    public async Task ForgetPasswordAsync_DoesNotAffectOtherUsers()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var target = CreateTestUser(email: "target@ex.com");
        target.Id = 10;
        var other = CreateTestUser(email: "other@ex.com");
        other.Id = 20;
        context.Users.Add(target);
        context.Users.Add(other);
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        await sut.ForgetPasswordAsync("target@ex.com", "link");

        var remain = await context.Users.FirstAsync(u => u.Email == "other@ex.com");
        Assert.Null(remain.ResetToken);
        Assert.Null(remain.ResetTokenExpiry);
    }

    // 20
    [Fact]
    public async Task ForgetPasswordAsync_StoresHashedTokenNotPlaintext()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "u@ex.com"));
        await context.SaveChangesAsync();

        var tokenMock = CreateMockTokenService();
        tokenMock.Setup(s => s.HashPassword(It.IsAny<string>())).Returns("$2a$11$specific-hash");
        var sut = CreateUserService(context, tokenMock);
        await sut.ForgetPasswordAsync("u@ex.com", "link");

        var updated = await context.Users.FirstAsync(u => u.Email == "u@ex.com");
        Assert.Equal("$2a$11$specific-hash", updated.ResetToken);
    }

    // 21 ──────────────────── ResetPasswordAsync ────────────────────

    [Fact]
    public async Task ResetPasswordAsync_ValidToken_UpdatesPasswordAndReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "user@example.com");
        user.ResetToken = "$2a$11$hashedresettoken";
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var tokenMock = new Mock<ITokenService>();
        tokenMock.Setup(s => s.VerifyPassword("valid-token", "$2a$11$hashedresettoken")).Returns(true);
        tokenMock.Setup(s => s.HashPassword("new-password")).Returns("new-hashed-password");
        var sut = CreateUserService(context, tokenMock);
        var result = await sut.ResetPasswordAsync("user@example.com", "valid-token", "new-password");

        Assert.True(result);
        var updatedUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "user@example.com");
        Assert.Equal("new-hashed-password", updatedUser!.PasswordHash);
        Assert.Null(updatedUser.ResetToken);
        Assert.Null(updatedUser.ResetTokenExpiry);
    }

    // 22
    [Fact]
    public async Task ResetPasswordAsync_ExpiredToken_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "u@ex.com");
        user.ResetToken = "$2a$11$hash";
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(-1);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        Assert.False(await sut.ResetPasswordAsync("u@ex.com", "token", "new"));
    }

    // 23
    [Fact]
    public async Task ResetPasswordAsync_UserNotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var sut = CreateUserService(context);
        Assert.False(await sut.ResetPasswordAsync("nx@ex.com", "token", "new"));
    }

    // 24
    [Fact]
    public async Task ResetPasswordAsync_NullResetToken_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(CreateTestUser(email: "u@ex.com"));
        await context.SaveChangesAsync();

        var sut = CreateUserService(context);
        Assert.False(await sut.ResetPasswordAsync("u@ex.com", "any-token", "new"));
    }

    // 25
    [Fact]
    public async Task ResetPasswordAsync_WrongToken_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "u@ex.com");
        user.ResetToken = "$2a$11$hashedresettoken";
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var tokenMock = CreateMockTokenService(verifyResult: false);
        var sut = CreateUserService(context, tokenMock);
        Assert.False(await sut.ResetPasswordAsync("u@ex.com", "wrong-token", "new"));
    }

    // 26
    [Fact]
    public async Task ResetPasswordAsync_ClearsResetTokenOnSuccess()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "u@ex.com");
        user.ResetToken = "something";
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var tokenMock = new Mock<ITokenService>();
        tokenMock.Setup(s => s.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
        tokenMock.Setup(s => s.HashPassword(It.IsAny<string>())).Returns("new-hash");
        var sut = CreateUserService(context, tokenMock);
        await sut.ResetPasswordAsync("u@ex.com", "valid", "new");

        var updated = await context.Users.FirstAsync(u => u.Email == "u@ex.com");
        Assert.Null(updated.ResetToken);
    }

    // 27
    [Fact]
    public async Task ResetPasswordAsync_ClearsExpiryOnSuccess()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "u@ex.com");
        user.ResetToken = "something";
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var tokenMock = new Mock<ITokenService>();
        tokenMock.Setup(s => s.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
        tokenMock.Setup(s => s.HashPassword(It.IsAny<string>())).Returns("new-hash");
        var sut = CreateUserService(context, tokenMock);
        await sut.ResetPasswordAsync("u@ex.com", "valid", "new");

        var updated = await context.Users.FirstAsync(u => u.Email == "u@ex.com");
        Assert.Null(updated.ResetTokenExpiry);
    }

    // 28
    [Fact]
    public async Task ResetPasswordAsync_UpdatesUpdatedAtTimestamp()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "u@ex.com");
        user.ResetToken = "something";
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        user.UpdatedAt = DateTime.UtcNow.AddDays(-10);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var tokenMock = new Mock<ITokenService>();
        tokenMock.Setup(s => s.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
        tokenMock.Setup(s => s.HashPassword(It.IsAny<string>())).Returns("new-hash");
        var sut = CreateUserService(context, tokenMock);
        await sut.ResetPasswordAsync("u@ex.com", "valid", "new");

        var updated = await context.Users.FirstAsync(u => u.Email == "u@ex.com");
        Assert.True(updated.UpdatedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    // 29
    [Fact]
    public async Task ResetPasswordAsync_DoesNotAffectOtherUsers()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var target = CreateTestUser(email: "target@ex.com");
        target.Id = 10;
        target.ResetToken = "target-token-hash";
        target.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        var other = CreateTestUser(email: "other@ex.com");
        other.Id = 20;
        other.ResetToken = "remain-token-hash";
        other.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        other.PasswordHash = "remain-pass-hash";
        context.Users.Add(target);
        context.Users.Add(other);
        await context.SaveChangesAsync();

        var tokenMock = new Mock<ITokenService>();
        tokenMock.Setup(s => s.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
        tokenMock.Setup(s => s.HashPassword(It.IsAny<string>())).Returns("new-target-hash");
        var sut = CreateUserService(context, tokenMock);
        await sut.ResetPasswordAsync("target@ex.com", "valid", "new");

        var remainUser = await context.Users.FirstAsync(u => u.Email == "other@ex.com");
        Assert.Equal("remain-pass-hash", remainUser.PasswordHash);
        Assert.Equal("remain-token-hash", remainUser.ResetToken);
        Assert.NotNull(remainUser.ResetTokenExpiry);
    }

    // 30
    [Fact]
    public async Task ResetPasswordAsync_PasswordHashUpdatedToProvidedHash()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = CreateTestUser(email: "u@ex.com", passwordHash: "old-hash");
        user.ResetToken = "tok-hash";
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var tokenMock = new Mock<ITokenService>();
        tokenMock.Setup(s => s.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
        tokenMock.Setup(s => s.HashPassword("MyN3wP@ss!")).Returns("final-password-hash");
        var sut = CreateUserService(context, tokenMock);
        await sut.ResetPasswordAsync("u@ex.com", "valid", "MyN3wP@ss!");

        tokenMock.Verify(v => v.HashPassword("MyN3wP@ss!"), Times.Once);
        var updated = await context.Users.FirstAsync(u => u.Email == "u@ex.com");
        Assert.Equal("final-password-hash", updated.PasswordHash);
    }

    // 31 ──────────────────── GetByInstituteIdAsync ────────────────────

    [Fact]
    public async Task GetByInstituteIdAsync_ReturnsUsersForInstitute()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.AddRange(
            new User { Id = 1, InstituteId = 5, Email = "a@ex.com", Role = UserRole.admin, PasswordHash = "h", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = 2, InstituteId = 5, Email = "b@ex.com", Role = UserRole.teacher, PasswordHash = "h", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = 3, InstituteId = 10, Email = "c@ex.com", Role = UserRole.student, PasswordHash = "h", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var mockToken = CreateMockTokenService();
        var pdpaRepoMock = new Mock<academy_API.Repositories.IPdpaConsentRepository>();
        var userRepoMock = new Mock<academy_API.Repositories.IUserRepository>();
        userRepoMock.Setup(r => r.GetByInstituteIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(context.Users.Where(u => u.InstituteId == 5).ToList());

        var sut = new UserService(userRepoMock.Object, pdpaRepoMock.Object, mockToken.Object, context);
        var results = await sut.GetByInstituteIdAsync(5);

        Assert.Equal(2, results.Count());
        Assert.Contains(results, u => u.Email == "a@ex.com");
        Assert.Contains(results, u => u.Email == "b@ex.com");
    }

    [Fact]
    public async Task GetByInstituteIdAsync_NoUsers_ReturnsEmpty()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var mockToken = CreateMockTokenService();
        var userRepoMock = new Mock<academy_API.Repositories.IUserRepository>();
        userRepoMock.Setup(r => r.GetByInstituteIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var sut = new UserService(userRepoMock.Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, mockToken.Object, context);
        Assert.Empty(await sut.GetByInstituteIdAsync(99));
    }

    // 33 ──────────────────── UpdateRoleAsync ────────────────────

    [Fact]
    public async Task UpdateRoleAsync_ExistingUser_UpdatesRole()
    {
        var mockRepo = new Mock<academy_API.Repositories.IUserRepository>();
        mockRepo.Setup(r => r.UpdateRoleAsync(1, UserRole.teacher, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = new UserService(mockRepo.Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, CreateMockTokenService().Object, null!);
        Assert.True(await sut.UpdateRoleAsync(1, UserRole.teacher));
        mockRepo.Verify(r => r.UpdateRoleAsync(1, UserRole.teacher, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateRoleAsync_NotFound_ReturnsFalse()
    {
        var mockRepo = new Mock<academy_API.Repositories.IUserRepository>();
        mockRepo.Setup(r => r.UpdateRoleAsync(999, UserRole.staff, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var sut = new UserService(mockRepo.Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, CreateMockTokenService().Object, null!);
        Assert.False(await sut.UpdateRoleAsync(999, UserRole.staff));
    }

    // 35 ──────────────────── DeleteUserAsync ────────────────────

    [Fact]
    public async Task DeleteUserAsync_Existing_ReturnsTrue()
    {
        var mockRepo = new Mock<academy_API.Repositories.IUserRepository>();
        mockRepo.Setup(r => r.DeleteAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = new UserService(mockRepo.Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, CreateMockTokenService().Object, null!);
        Assert.True(await sut.DeleteUserAsync(1));
    }

    [Fact]
    public async Task DeleteUserAsync_NotFound_ReturnsFalse()
    {
        var mockRepo = new Mock<academy_API.Repositories.IUserRepository>();
        mockRepo.Setup(r => r.DeleteAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var sut = new UserService(mockRepo.Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, CreateMockTokenService().Object, null!);
        Assert.False(await sut.DeleteUserAsync(999));
    }

    // 37 ──────────────────── CreateWithConsentAsync ────────────────────

    [Fact]
    public async Task CreateWithConsentAsync_ValidRequest_CreatesUserAndPdpaConsent()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        var tokenService = CreateMockTokenService();
        tokenService.Setup(s => s.HashPassword(It.IsAny<string>())).Returns("hashed-pw");

        var userRepoMock = new Mock<academy_API.Repositories.IUserRepository>();
        var pdpaRepoMock = new Mock<academy_API.Repositories.IPdpaConsentRepository>();

        var sut = new UserService(userRepoMock.Object, pdpaRepoMock.Object, tokenService.Object, context);
        var user = await sut.CreateWithConsentAsync(new UserCreateRequest
        {
            Email = "new@user.com",
            Password = "Secure123!",
            Phone = "0812345678",
            Role = UserRole.staff,
            AcceptPdpa = true,
            PdpaConsentVersion = "1.0"
        }, "127.0.0.1");

        Assert.NotNull(user);
        Assert.Equal("new@user.com", user.Email);
        Assert.Equal(UserRole.staff, user.Role);
        Assert.Equal("hashed-pw", user.PasswordHash);

        var pdpa = await context.PdpaConsents.FirstOrDefaultAsync(p => p.UserId == user.Id);
        Assert.NotNull(pdpa);
        Assert.True(pdpa!.IsAccepted);
        Assert.Equal("1.0", pdpa.ConsentVersion);
    }

    [Fact]
    public async Task CreateWithConsentAsync_NoPdpa_ThrowsInvalidOperation()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        var sut = new UserService(new Mock<academy_API.Repositories.IUserRepository>().Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, CreateMockTokenService().Object, context);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.CreateWithConsentAsync(new UserCreateRequest
            {
                Email = "u@ex.com", Password = "P@ss1234", AcceptPdpa = false
            }, null));
        Assert.Contains("PDPA", ex.Message);
    }

    [Fact]
    public async Task CreateWithConsentAsync_DuplicateEmail_Throws()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Users.Add(new User { Email = "dup@ex.com", PasswordHash = "h", Role = UserRole.student, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var tokenService = CreateMockTokenService();
        tokenService.Setup(s => s.HashPassword(It.IsAny<string>())).Returns("h");

        var sut = new UserService(new Mock<academy_API.Repositories.IUserRepository>().Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, tokenService.Object, context);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.CreateWithConsentAsync(new UserCreateRequest
            {
                Email = "dup@ex.com", Password = "P@ss1234", AcceptPdpa = true
            }, null));
        Assert.Contains("already registered", ex.Message);
    }

    [Fact]
    public async Task CreateWithConsentAsync_EmptyPassword_Throws()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        var sut = new UserService(new Mock<academy_API.Repositories.IUserRepository>().Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, CreateMockTokenService().Object, context);

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            sut.CreateWithConsentAsync(new UserCreateRequest
            {
                Email = "u@ex.com", Password = "", AcceptPdpa = true
            }, null));
        Assert.Contains("Password", ex.Message);
    }

    // 41 ──────────────────── GetCurrentUserAsync ────────────────────

    [Fact]
    public async Task GetCurrentUserAsync_ExistingUser_ReturnsProfile()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = new User
        {
            Id = 10,
            Email = "profile@ex.com",
            Role = UserRole.teacher,
            PasswordHash = "h",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Teacher = new Teacher { FullName = "คุณครูสมชาย", Specialization = "คณิตศาสตร์", PhotoUrl = "/photo.jpg" }
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var userRepoMock = new Mock<academy_API.Repositories.IUserRepository>();
        userRepoMock.Setup(r => r.GetByIdWithProfileAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var sut = new UserService(userRepoMock.Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, CreateMockTokenService().Object, context);
        var result = await sut.GetCurrentUserAsync(10);

        Assert.NotNull(result);
        Assert.Equal("success", result!.Status);
        Assert.Equal(10, result.Data.UserId);
        Assert.Equal("คุณครูสมชาย", result.Data.Profile.FullName);
        Assert.Equal("/photo.jpg", result.Data.Profile.PhotoUrl);
        Assert.Equal("คณิตศาสตร์", result.Data.Profile.Subjects);
    }

    [Fact]
    public async Task GetCurrentUserAsync_NotFound_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var userRepoMock = new Mock<academy_API.Repositories.IUserRepository>();
        userRepoMock.Setup(r => r.GetByIdWithProfileAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var sut = new UserService(userRepoMock.Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, CreateMockTokenService().Object, context);
        Assert.Null(await sut.GetCurrentUserAsync(999));
    }

    [Fact]
    public async Task GetCurrentUserAsync_NoTeacherProfile_UsesEmailFallback()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var user = new User
        {
            Id = 20,
            Email = "student@ex.com",
            Role = UserRole.student,
            PasswordHash = "h",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var userRepoMock = new Mock<academy_API.Repositories.IUserRepository>();
        userRepoMock.Setup(r => r.GetByIdWithProfileAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var sut = new UserService(userRepoMock.Object, new Mock<academy_API.Repositories.IPdpaConsentRepository>().Object, CreateMockTokenService().Object, context);
        var result = await sut.GetCurrentUserAsync(20);

        Assert.NotNull(result);
        Assert.Equal("student@ex.com", result!.Data.Profile.FullName);
        Assert.Null(result.Data.Profile.PhotoUrl);
        Assert.Null(result.Data.Profile.Subjects);
    }
}
