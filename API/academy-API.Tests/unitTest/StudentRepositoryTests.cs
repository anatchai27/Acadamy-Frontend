using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Tests.unitTest;

public class StudentRepositoryTests
{
    private static TutoringDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TutoringDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new TutoringDbContext(options);
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
        var (items, total) = await repo.SearchAsync(null, null, 1, 20);

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
        var (items, total) = await repo.SearchAsync(null, "สมชาย", 1, 20);

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
        var (items, total) = await repo.SearchAsync(null, "105", 1, 20);

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
        var (items, total) = await repo.SearchAsync(null, "0812345678", 1, 20);

        Assert.Equal(1, total);
        Assert.Equal("0812345678", items[0].PrimaryParentPhone);
    }
}
