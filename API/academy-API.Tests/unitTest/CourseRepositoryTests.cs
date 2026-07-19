using academy_API.Data;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Tests;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Tests.unitTest;

public class CourseRepositoryTests
{
    private static TutoringDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TutoringDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new TutoringDbContext(options, new MockTenantProvider());
    }

    // ──────────────────── CourseRepository ────────────────────

    // 1
    [Fact]
    public async Task SearchAsync_ReturnsCoursesWithTeacherName()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var teacher = new Teacher { Id = 1, FullName = "ครูสมชาย" };
        context.Teachers.Add(teacher);
        context.Courses.Add(new Course { Id = 1, Name = "Math 101", Subject = "Math", TotalSessions = 10, Price = 5000, TeacherId = 1, Teacher = teacher });
        await context.SaveChangesAsync();

        var repo = new CourseRepository(context);
        var courses = await repo.SearchAsync(null, null);

        Assert.Single(courses);
        Assert.Equal("ครูสมชาย", courses[0].TeacherName);
    }

    // 2
    [Fact]
    public async Task SearchAsync_SearchByName_FindsMatch()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Courses.Add(new Course { Id = 1, Name = "Math", Subject = "", TotalSessions = 10, Price = 5000 });
        context.Courses.Add(new Course { Id = 2, Name = "English", Subject = "", TotalSessions = 10, Price = 4000 });
        await context.SaveChangesAsync();

        var repo = new CourseRepository(context);
        var courses = await repo.SearchAsync("Math", null);

        Assert.Single(courses);
        Assert.Equal("Math", courses[0].Name);
    }

    // 3
    [Fact]
    public async Task CreateAsync_PersistsCourse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var repo = new CourseRepository(context);

        var course = new Course { Name = "New", Subject = "Sub", TotalSessions = 5, Price = 1000, InstituteId = 1 };
        var result = await repo.CreateAsync(course);

        Assert.True(result.Id > 0);
        Assert.Single(context.Courses);
    }

    // 4
    [Fact]
    public async Task UpdateAsync_ExistingCourse_UpdatesFields()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Courses.Add(new Course { Id = 1, Name = "Old", Subject = "OldSub", TotalSessions = 10, Price = 5000, InstituteId = 1 });
        await context.SaveChangesAsync();

        var repo = new CourseRepository(context);
        var result = await repo.UpdateAsync(1, new DTOs.UpdateCourseRequest("New", null, null, null, null));

        Assert.NotNull(result);
        Assert.Equal("New", result!.Name);
    }

    // 5
    [Fact]
    public async Task GetByIdAsync_CrossInstitute_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Courses.Add(new Course { Id = 1, Name = "Math", Subject = "", TotalSessions = 10, Price = 5000, InstituteId = 2 });
        await context.SaveChangesAsync();

        var repo = new CourseRepository(context);
        var result = await repo.GetByIdAsync(1);

        Assert.Null(result);
    }

    // ──────────────────── SessionRepository ────────────────────

    // 6
    [Fact]
    public async Task SessionCreateAsync_PersistsSession()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Courses.Add(new Course { Id = 1, Name = "Math", Subject = "", TotalSessions = 10, Price = 5000 });
        await context.SaveChangesAsync();

        var repo = new SessionRepository(context);
        var session = new Session { CourseId = 1, ScheduledAt = DateTime.UtcNow, DurationMin = 60, RoomId = "R1", Status = "scheduled" };
        var result = await repo.CreateAsync(session);

        Assert.True(result.Id > 0);
    }

    // 7
    [Fact]
    public async Task SessionGetByCourseIdAsync_ReturnsSessionsForCourse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Courses.Add(new Course { Id = 1, Name = "Math", Subject = "", TotalSessions = 10, Price = 5000, InstituteId = 1 });
        context.Sessions.Add(new Session { Id = 1, CourseId = 1, ScheduledAt = DateTime.UtcNow, DurationMin = 60, Status = "scheduled" });
        await context.SaveChangesAsync();

        var repo = new SessionRepository(context);
        var sessions = await repo.GetByCourseIdAsync(1);

        Assert.Single(sessions);
        Assert.Equal("scheduled", sessions[0].Status);
    }

    // ──────────────────── LeaveRequestRepository ────────────────────

    // 8
    [Fact]
    public async Task LeaveRequestSearchAsync_ReturnsFilteredResults()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var student = new Student { Id = 1, FullName = "สมชาย", CreatedAt = DateTime.UtcNow, InstituteId = 1 };
        var session = new Session { Id = 1, CourseId = 1, Course = new Course { Id = 1, Name = "Math", Subject = "", TotalSessions = 10, Price = 5000 }, ScheduledAt = DateTime.UtcNow, DurationMin = 60, Status = "scheduled" };
        context.Students.Add(student);
        context.Sessions.Add(session);
        context.LeaveRequests.Add(new LeaveRequest { Id = 1, StudentId = 1, SessionId = 1, Status = "pending", Type = "leave", RequestedAt = DateTime.UtcNow, Student = student, Session = session });
        await context.SaveChangesAsync();

        var repo = new LeaveRequestRepository(context);
        var (items, total) = await repo.SearchAsync(null, 1, 20);

        Assert.Equal(1, total);
        Assert.Equal("สมชาย", items[0].StudentName);
    }

    // ──────────────────── HomeworkRepository ────────────────────

    // 9
    [Fact]
    public async Task HomeworkCreateAsync_PersistsHomework()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Courses.Add(new Course { Id = 1, Name = "Math", Subject = "", TotalSessions = 10, Price = 5000 });
        await context.SaveChangesAsync();

        var repo = new HomeworkRepository(context);
        var hw = new Homework { CourseId = 1, Title = "HW1", DueAt = DateTime.UtcNow.AddDays(7) };
        var result = await repo.CreateAsync(hw);

        Assert.True(result.Id > 0);
        Assert.Equal("HW1", result.Title);
    }

    // 10
    [Fact]
    public async Task HomeworkGetByCourseIdAsync_ReturnsHomeworks()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        context.Courses.Add(new Course { Id = 1, Name = "Math", Subject = "", TotalSessions = 10, Price = 5000 });
        context.Homeworks.Add(new Homework { Id = 1, CourseId = 1, Title = "HW1", DueAt = DateTime.UtcNow.AddDays(7) });
        await context.SaveChangesAsync();

        var repo = new HomeworkRepository(context);
        var items = await repo.GetByCourseIdAsync(1);

        Assert.Single(items);
        Assert.Equal("HW1", items[0].Title);
    }

    // 11
    [Fact]
    public async Task SkillScoreBatchUpsertAsync_InsertsAndUpdates()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        var repo = new SkillScoreRepository(context);

        await repo.BatchUpsertAsync(10, [new DTOs.SkillScoreItem(1, 4.0m, null)], 42);
        Assert.Single(context.SkillScores);

        await repo.BatchUpsertAsync(10, [new DTOs.SkillScoreItem(1, 4.5m, "better")], 42);
        var updated = await context.SkillScores.FirstAsync();
        Assert.Equal(4.5m, updated.Score);
        Assert.Equal("better", updated.Note);
    }
}
