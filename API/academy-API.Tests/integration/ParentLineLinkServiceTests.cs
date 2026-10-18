using System.Security.Cryptography;
using System.Text;
using academy_API.Data;
using academy_API.Models;
using academy_API.Services;
using academy_API.Services.Contracts;
using academy_API.Tests;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Tests.integration;

public sealed class ParentLineLinkServiceTests
{
    [Fact]
    public async Task IssueAndRedeem_StoresOnlyHash_BindsParentAndAllowsSingleUse()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var context = CreateContext(connection, 1);
        await context.Database.EnsureCreatedAsync();
        var parent = await SeedParentAsync(context, 1);
        var service = new ParentLineLinkService(context);

        var issued = await service.IssueAsync(parent.Id, 1, actorUserId: 99);

        Assert.NotNull(issued);
        Assert.Equal(12, issued!.Code.Length);
        Assert.Equal(issued.Code.ToUpperInvariant(), issued.Code);
        var stored = await context.ParentLineLinkCodes.SingleAsync();
        Assert.NotEqual(issued.Code, stored.CodeHash);
        Assert.Equal(Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(issued.Code))), stored.CodeHash);
        Assert.InRange(issued.ExpiresAt - DateTime.UtcNow, TimeSpan.FromDays(4.99), TimeSpan.FromDays(5));

        var redeemed = await service.RedeemAsync(issued.Code, "verified-line-user");

        Assert.Equal(ParentLineLinkStatus.Success, redeemed.Status);
        Assert.Equal(parent.Id, redeemed.Binding!.Parent.Id);
        Assert.Equal("verified-line-user", parent.LineUserId);
        Assert.Equal("verified-line-user", redeemed.Binding.User.LineUserId);
        Assert.Equal(parent.Id, await context.Parents.Where(p => p.UserId == redeemed.Binding.User.Id).Select(p => p.Id).SingleAsync());
        Assert.Equal(1, await context.ParentLineLinkCodes.CountAsync(c => c.RedeemedAt != null));

        var secondRedemption = await service.RedeemAsync(issued.Code, "verified-line-user");
        Assert.Equal(ParentLineLinkStatus.AlreadyUsed, secondRedemption.Status);
    }

    [Fact]
    public async Task IssueAsync_EnforcesInstituteScope()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var context = CreateContext(connection, 2);
        await context.Database.EnsureCreatedAsync();
        var parent = await SeedParentAsync(context, 1);
        var service = new ParentLineLinkService(context);

        var issued = await service.IssueAsync(parent.Id, 2, actorUserId: 99);

        Assert.Null(issued);
        Assert.Empty(await context.ParentLineLinkCodes.ToListAsync());
    }

    [Fact]
    public async Task IssueAsync_ClearsLegacyUnverifiedLineIdAndIssuesCode()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var context = CreateContext(connection, 1);
        await context.Database.EnsureCreatedAsync();
        var parent = await SeedParentAsync(context, 1);
        parent.LineUserId = "manually-entered-not-verified";
        await context.SaveChangesAsync();

        var issued = await new ParentLineLinkService(context).IssueAsync(parent.Id, 1, actorUserId: 99);

        Assert.NotNull(issued);
        Assert.Null(parent.LineUserId);
        Assert.Single(await context.ParentLineLinkCodes.ToListAsync());
    }

    [Fact]
    public async Task RedeemAsync_RejectsInvalidAndExpiredCodesWithoutBinding()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var context = CreateContext(connection, 1);
        await context.Database.EnsureCreatedAsync();
        var parent = await SeedParentAsync(context, 1);
        var service = new ParentLineLinkService(context);

        var invalid = await service.RedeemAsync("NOT-A-REAL-CODE", "line-user");
        Assert.Equal(ParentLineLinkStatus.InvalidCode, invalid.Status);

        var issued = await service.IssueAsync(parent.Id, 1, actorUserId: 99);
        var codeRow = await context.ParentLineLinkCodes.SingleAsync();
        codeRow.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        await context.SaveChangesAsync();

        var expired = await service.RedeemAsync(issued!.Code, "line-user");

        Assert.Equal(ParentLineLinkStatus.Expired, expired.Status);
        Assert.Null(parent.UserId);
        Assert.Null(parent.LineUserId);
    }

    [Fact]
    public async Task RedeemAsync_DoesNotMoveLineAccountFromAnotherInstitute()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var context = CreateContext(connection, 0);
        await context.Database.EnsureCreatedAsync();
        var parent = await SeedParentAsync(context, 1);
        var otherInstitute = new Institute { Id = 2, Name = "Other", Slug = "other", IsActive = true };
        context.Institutes.Add(otherInstitute);
        var existingUser = new User
        {
            Id = 20,
            InstituteId = 2,
            Email = "already-linked@example.test",
            Role = UserRole.parent,
            LineUserId = "line-user",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(existingUser);
        await context.SaveChangesAsync();
        var issued = await new ParentLineLinkService(context).IssueAsync(parent.Id, 1, actorUserId: 99);

        var result = await new ParentLineLinkService(context).RedeemAsync(issued!.Code, "line-user");

        Assert.Equal(ParentLineLinkStatus.Conflict, result.Status);
        Assert.Null(parent.UserId);
        Assert.Null(parent.LineUserId);
        Assert.Null((await context.ParentLineLinkCodes.SingleAsync()).RedeemedAt);
    }

    private static TutoringDbContext CreateContext(SqliteConnection connection, int instituteId) =>
        new(new DbContextOptionsBuilder<TutoringDbContext>().UseSqlite(connection).Options,
            new MockTenantProvider { InstituteId = instituteId });

    private static async Task<Parent> SeedParentAsync(TutoringDbContext context, int instituteId)
    {
        var institute = new Institute
        {
            Id = instituteId,
            Name = $"Institute {instituteId}",
            Slug = $"institute-{instituteId}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var student = new Student
        {
            Id = instituteId,
            InstituteId = instituteId,
            FullName = "Test student",
            CreatedAt = DateTime.UtcNow
        };
        var parent = new Parent
        {
            Id = instituteId,
            InstituteId = instituteId,
            StudentId = student.Id,
            Student = student,
            FullName = "Test parent",
            Phone = "0812345678",
            IsPrimary = true,
            IsActive = true
        };
        context.Institutes.Add(institute);
        context.Students.Add(student);
        context.Parents.Add(parent);
        await context.SaveChangesAsync();
        return parent;
    }
}
