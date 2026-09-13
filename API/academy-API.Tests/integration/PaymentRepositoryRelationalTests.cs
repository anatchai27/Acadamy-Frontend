using academy_API.Data;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Tests;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Tests.integration;

public sealed class PaymentRepositoryRelationalTests
{
    [Fact]
    public async Task GetPaymentsForExportAsync_UsesTenantAndInclusiveDateFilters_WithNavigation()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        await using var context = CreateContext(connection, 1);
        await context.Database.EnsureCreatedAsync();
        await SeedAsync(context);

        var result = await new PaymentRepository(context).GetPaymentsForExportAsync(
            new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 6, 10, 23, 59, 59, 999, DateTimeKind.Utc),
            null);

        var payment = Assert.Single(result);
        Assert.Equal(100m, payment.Amount);
        Assert.Equal("Tenant one student", payment.Enrollment.Student.FullName);
        Assert.Equal("Tenant one course", payment.Enrollment.Course.Name);
    }

    private static TutoringDbContext CreateContext(SqliteConnection connection, int instituteId) =>
        new(new DbContextOptionsBuilder<TutoringDbContext>()
            .UseSqlite(connection)
            .Options, new MockTenantProvider { InstituteId = instituteId });

    private static async Task SeedAsync(TutoringDbContext context)
    {
        var instituteOne = new Institute { Id = 1, Name = "Institute one", Slug = "one", IsActive = true };
        var instituteTwo = new Institute { Id = 2, Name = "Institute two", Slug = "two", IsActive = true };
        var studentOne = new Student { Id = 1, InstituteId = 1, FullName = "Tenant one student" };
        var studentTwo = new Student { Id = 2, InstituteId = 2, FullName = "Tenant two student" };
        var courseOne = new Course { Id = 1, InstituteId = 1, Name = "Tenant one course", Subject = "Math", TotalSessions = 10 };
        var courseTwo = new Course { Id = 2, InstituteId = 2, Name = "Tenant two course", Subject = "Science", TotalSessions = 10 };
        var enrollmentOne = new Enrollment { Id = 1, InstituteId = 1, StudentId = 1, CourseId = 1, Student = studentOne, Course = courseOne };
        var enrollmentTwo = new Enrollment { Id = 2, InstituteId = 2, StudentId = 2, CourseId = 2, Student = studentTwo, Course = courseTwo };

        context.Institutes.AddRange(instituteOne, instituteTwo);
        context.Students.AddRange(studentOne, studentTwo);
        context.Courses.AddRange(courseOne, courseTwo);
        context.Enrollments.AddRange(enrollmentOne, enrollmentTwo);
        context.Payments.AddRange(
            new Payment
            {
                Id = 1, InstituteId = 1, EnrollmentId = 1, Enrollment = enrollmentOne,
                Amount = 100m, Method = "cash", InvoiceNo = "INV-ONE",
                PaidAt = new DateTime(2026, 6, 10, 23, 59, 59, 999, DateTimeKind.Utc),
                CreatedAt = new DateTime(2026, 6, 10, 23, 59, 59, 999, DateTimeKind.Utc)
            },
            new Payment
            {
                Id = 2, InstituteId = 2, EnrollmentId = 2, Enrollment = enrollmentTwo,
                Amount = 200m, Method = "cash", InvoiceNo = "INV-TWO",
                PaidAt = new DateTime(2026, 6, 10, 12, 0, 0, DateTimeKind.Utc),
                CreatedAt = new DateTime(2026, 6, 10, 12, 0, 0, DateTimeKind.Utc)
            },
            new Payment
            {
                Id = 3, InstituteId = 1, EnrollmentId = 1, Enrollment = enrollmentOne,
                Amount = 300m, Method = "cash", InvoiceNo = "INV-OUTSIDE",
                PaidAt = new DateTime(2026, 6, 11, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = new DateTime(2026, 6, 11, 0, 0, 0, DateTimeKind.Utc)
            });

        await context.SaveChangesAsync();
    }
}
