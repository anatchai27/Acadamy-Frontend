using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Tests;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Tests.unitTest;

public class StudentRepositoryTests
{
    private static TutoringDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TutoringDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new TutoringDbContext(options, new MockTenantProvider());
    }

    // 1 ──────────────────── SearchAsync ────────────────────

    [Fact]
    public async Task SearchAsync_NoSearchTerm_ReturnsAllStudents()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Students.Add(new Student { Id = 1, FullName = "สมชาย", CreatedAt = DateTime.UtcNow });
        context.Students.Add(new Student { Id = 2, FullName = "สมหญิง", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var repo = new StudentRepository(context);
        var (items, total) = await repo.SearchAsync(null, 1, 20);

        Assert.Equal(2, total);
        Assert.Equal(2, items.Count);
    }

    // 2
    [Fact]
    public async Task SearchAsync_SearchByName_FindsMatch()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Students.Add(new Student { Id = 1, FullName = "สมชาย รักเรียน", CreatedAt = DateTime.UtcNow });
        context.Students.Add(new Student { Id = 2, FullName = "สมหญิง ตั้งใจ", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var repo = new StudentRepository(context);
        var (items, total) = await repo.SearchAsync("สมชาย", 1, 20);

        Assert.Equal(1, total);
        Assert.Equal("สมชาย รักเรียน", items[0].FullName);
    }

    // 3
    [Fact]
    public async Task SearchAsync_SearchByStudentId_FindsMatch()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Students.Add(new Student { Id = 105, FullName = "สมชาย", CreatedAt = DateTime.UtcNow });
        context.Students.Add(new Student { Id = 200, FullName = "สมหญิง", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var repo = new StudentRepository(context);
        var (items, total) = await repo.SearchAsync("105", 1, 20);

        Assert.Equal(1, total);
        Assert.Equal(105, items[0].Id);
    }

    // 4
    [Fact]
    public async Task SearchAsync_SearchByParentPhone_FindsMatch()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var student = new Student { Id = 1, FullName = "สมชาย", CreatedAt = DateTime.UtcNow };
        student.Parents.Add(new Parent { Id = 1, StudentId = 1, FullName = "แม่", Phone = "0812345678" });
        context.Students.Add(student);
        await context.SaveChangesAsync();

        var repo = new StudentRepository(context);
        var (items, total) = await repo.SearchAsync("0812345678", 1, 20);

        Assert.Equal(1, total);
        Assert.Equal("0812345678", items[0].PrimaryParentPhone);
    }

    [Fact]
    public async Task SearchAsync_IncludesOnlyCurrentlyAuthorizedPickupContacts()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var now = DateTime.UtcNow;
        context.Students.Add(new Student { Id = 1, FullName = "สมชาย", CreatedAt = now });
        context.StudentPickupAuthorizations.AddRange(
            new StudentPickupAuthorization { Id = 1, StudentId = 1, FullName = "คุณแม่", Phone = "0811111111", Relationship = "แม่", IsActive = true },
            new StudentPickupAuthorization { Id = 2, StudentId = 1, FullName = "หมดอายุ", IsActive = true, ValidUntil = now.AddDays(-1) },
            new StudentPickupAuthorization { Id = 3, StudentId = 1, FullName = "ถูกยกเลิก", IsActive = false },
            new StudentPickupAuthorization { Id = 4, StudentId = 1, FullName = "ยังไม่เริ่ม", IsActive = true, ValidFrom = now.AddDays(1) });
        await context.SaveChangesAsync();

        var repository = new StudentRepository(context);
        var (items, _) = await repository.SearchAsync(null, 1, 20);

        var pickup = Assert.Single(items[0].AuthorizedPickups!);
        Assert.Equal("คุณแม่", pickup.FullName);
        Assert.Equal("แม่", pickup.Relationship);
    }

    [Fact]
    public async Task StreamExportAsync_UsesTenantFilter()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        await using (var seed = CreateInMemoryDbContext(dbName))
        {
            seed.Students.AddRange(
                new Student { Id = 1, InstituteId = 1, FullName = "Tenant One" },
                new Student { Id = 2, InstituteId = 2, FullName = "Tenant Two" });
            await seed.SaveChangesAsync();
        }

        await using var context = new TutoringDbContext(
            new DbContextOptionsBuilder<TutoringDbContext>().UseInMemoryDatabase(dbName).Options,
            new MockTenantProvider { InstituteId = 1 });
        var repository = new StudentRepository(context);

        // Act
        var rows = new List<StudentExportRow>();
        await foreach (var row in repository.StreamExportAsync()) rows.Add(row);

        // Assert
        var student = Assert.Single(rows);
        Assert.Equal(1, student.Id);
        Assert.Equal("Tenant One", student.FullName);
    }
}
