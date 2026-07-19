using academy_API.Data;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Tests;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Tests.unitTest;

public class PaymentRepositoryTests
{
    private static TutoringDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TutoringDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new TutoringDbContext(options, new MockTenantProvider());
    }

    private static async Task SeedEnrollmentAsync(TutoringDbContext context, int enrollmentId, string studentName, string courseName)
    {
        var student = new Student { Id = enrollmentId, FullName = studentName, CreatedAt = DateTime.UtcNow };
        var course = new Course { Id = enrollmentId, Name = courseName, Subject = "", TotalSessions = 10, Price = 5000 };
        var enrollment = new Enrollment
        {
            Id = enrollmentId,
            StudentId = enrollmentId,
            CourseId = enrollmentId,
            SessionsRemaining = 10,
            PaidAmount = 0,
            CreatedAt = DateTime.UtcNow,
            Student = student,
            Course = course
        };
        context.Students.Add(student);
        context.Courses.Add(course);
        context.Enrollments.Add(enrollment);
        await context.SaveChangesAsync();
    }

    private static Payment MakePayment(decimal amount, string method, DateTime paidAt,
        int enrollmentId, string? invoiceNo = null)
    {
        return new Payment
        {
            EnrollmentId = enrollmentId,
            InvoiceNo = invoiceNo ?? $"INV-{paidAt:yyyyMM}-{Guid.NewGuid().ToString()[..4]}",
            Amount = amount,
            Method = method,
            PaidAt = paidAt,
            CreatedAt = paidAt
        };
    }

    // ──────────────────── GetPaymentsAsync ────────────────────

    // 1
    [Fact]
    public async Task GetPaymentsAsync_NoFilters_ReturnsAllPaymentsOrderedByCreatedAtDesc()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        await SeedEnrollmentAsync(context, 1, "สมชาย", "คณิตศาสตร์");

        context.Payments.Add(MakePayment(1000m, "cash", new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc), 1));
        context.Payments.Add(MakePayment(2000m, "transfer", new DateTime(2026, 6, 12, 0, 0, 0, DateTimeKind.Utc), 1));
        context.Payments.Add(MakePayment(3000m, "credit_card", new DateTime(2026, 6, 14, 0, 0, 0, DateTimeKind.Utc), 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(null, null, null, 1, 20);

        Assert.Equal(3, result.Count);
        Assert.Equal(3000m, result[0].Amount);
        Assert.Equal(2000m, result[1].Amount);
        Assert.Equal(1000m, result[2].Amount);
    }

    // 2
    [Fact]
    public async Task GetPaymentsAsync_WithStartDate_FiltersCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        await SeedEnrollmentAsync(context, 1, "สมชาย", "คณิตศาสตร์");

        context.Payments.Add(MakePayment(1000m, "cash", new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc), 1));
        context.Payments.Add(MakePayment(2000m, "transfer", new DateTime(2026, 6, 14, 0, 0, 0, DateTimeKind.Utc), 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(
            new DateTime(2026, 6, 14, 0, 0, 0, DateTimeKind.Utc), null, null, 1, 20);

        Assert.Single(result);
        Assert.Equal(2000m, result[0].Amount);
    }

    // 3
    [Fact]
    public async Task GetPaymentsAsync_WithEndDate_FiltersCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        await SeedEnrollmentAsync(context, 1, "สมชาย", "คณิตศาสตร์");

        context.Payments.Add(MakePayment(1000m, "cash", new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc), 1));
        context.Payments.Add(MakePayment(2000m, "transfer", new DateTime(2026, 6, 14, 0, 0, 0, DateTimeKind.Utc), 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(
            null, new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc), null, 1, 20);

        Assert.Single(result);
        Assert.Equal(1000m, result[0].Amount);
    }

    // 4
    [Fact]
    public async Task GetPaymentsAsync_WithDateRange_FiltersCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        await SeedEnrollmentAsync(context, 1, "สมชาย", "คณิตศาสตร์");

        context.Payments.Add(MakePayment(1000m, "cash", new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc), 1));
        context.Payments.Add(MakePayment(2000m, "transfer", new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc), 1));
        context.Payments.Add(MakePayment(3000m, "credit_card", new DateTime(2026, 6, 15, 0, 0, 0, DateTimeKind.Utc), 1));
        context.Payments.Add(MakePayment(4000m, "cash", new DateTime(2026, 6, 20, 0, 0, 0, DateTimeKind.Utc), 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(
            new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 6, 15, 0, 0, 0, DateTimeKind.Utc),
            null, 1, 20);

        Assert.Equal(2, result.Count);
        Assert.All(result, p => Assert.True(p.CreatedAt >= new DateTime(2026, 6, 10)));
        Assert.All(result, p => Assert.True(p.CreatedAt <= new DateTime(2026, 6, 15)));
    }

    // 5
    [Fact]
    public async Task GetPaymentsAsync_WithMethod_FiltersCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        await SeedEnrollmentAsync(context, 1, "สมชาย", "คณิตศาสตร์");

        context.Payments.Add(MakePayment(1000m, "cash", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(2000m, "transfer", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(3000m, "cash", DateTime.UtcNow, 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(null, null, "cash", 1, 20);

        Assert.Equal(2, result.Count);
        Assert.All(result, p => Assert.Equal("cash", p.Method));
    }

    // 6
    [Fact]
    public async Task GetPaymentsAsync_CombinedFilters_ReturnsMatchingPayments()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        await SeedEnrollmentAsync(context, 1, "สมชาย", "คณิตศาสตร์");

        context.Payments.Add(MakePayment(1000m, "cash", new DateTime(2026, 6, 10), 1, "INV-001"));
        context.Payments.Add(MakePayment(2000m, "transfer", new DateTime(2026, 6, 12), 1, "INV-002"));
        context.Payments.Add(MakePayment(3000m, "transfer", new DateTime(2026, 6, 14), 1, "INV-003"));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(
            new DateTime(2026, 6, 12),
            new DateTime(2026, 6, 14),
            "transfer", 1, 20);

        Assert.Equal(2, result.Count);
        Assert.Equal(2000m, result[1].Amount);
        Assert.Equal(3000m, result[0].Amount);
    }

    // 7
    [Fact]
    public async Task GetPaymentsAsync_Page1Limit2_ReturnsFirstTwo()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        await SeedEnrollmentAsync(context, 1, "สมชาย", "คณิตศาสตร์");

        context.Payments.Add(MakePayment(1000m, "cash", new DateTime(2026, 6, 10), 1));
        context.Payments.Add(MakePayment(2000m, "transfer", new DateTime(2026, 6, 11), 1));
        context.Payments.Add(MakePayment(3000m, "credit_card", new DateTime(2026, 6, 12), 1));
        context.Payments.Add(MakePayment(4000m, "cash", new DateTime(2026, 6, 13), 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(null, null, null, 1, 2);

        Assert.Equal(2, result.Count);
        Assert.Equal(4000m, result[0].Amount);
        Assert.Equal(3000m, result[1].Amount);
    }

    // 8
    [Fact]
    public async Task GetPaymentsAsync_Page2Limit2_ReturnsNextTwo()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        await SeedEnrollmentAsync(context, 1, "สมชาย", "คณิตศาสตร์");

        context.Payments.Add(MakePayment(1000m, "cash", new DateTime(2026, 6, 10), 1));
        context.Payments.Add(MakePayment(2000m, "transfer", new DateTime(2026, 6, 11), 1));
        context.Payments.Add(MakePayment(3000m, "credit_card", new DateTime(2026, 6, 12), 1));
        context.Payments.Add(MakePayment(4000m, "cash", new DateTime(2026, 6, 13), 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(null, null, null, 2, 2);

        Assert.Equal(2, result.Count);
        Assert.Equal(2000m, result[0].Amount);
        Assert.Equal(1000m, result[1].Amount);
    }

    // 9
    [Fact]
    public async Task GetPaymentsAsync_EmptyTable_ReturnsEmptyList()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(null, null, null, 1, 20);

        Assert.Empty(result);
    }

    // 10
    [Fact]
    public async Task GetPaymentsAsync_IncludesNavigationProperties()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);
        await SeedEnrollmentAsync(context, 1, "ด.ช. สมชาย รักเรียน", "คณิตศาสตร์ ม.1");

        context.Payments.Add(MakePayment(4500m, "transfer", DateTime.UtcNow, 1, "INV-202606-0001"));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var result = await repo.GetPaymentsAsync(null, null, null, 1, 20);

        Assert.Single(result);
        Assert.Equal("ด.ช. สมชาย รักเรียน", result[0].Enrollment?.Student?.FullName);
        Assert.Equal("คณิตศาสตร์ ม.1", result[0].Enrollment?.Course?.Name);
    }

    // ──────────────────── GetTotalAmountAsync ────────────────────

    // 11
    [Fact]
    public async Task GetTotalAmountAsync_NoFilters_ReturnsSumOfAllAmounts()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        context.Payments.Add(MakePayment(1500.50m, "cash", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(2750.25m, "transfer", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(100m, "credit_card", DateTime.UtcNow, 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var total = await repo.GetTotalAmountAsync(null, null, null);

        Assert.Equal(4350.75m, total);
    }

    // 12
    [Fact]
    public async Task GetTotalAmountAsync_WithDateFilter_SumsOnlyInRange()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        context.Payments.Add(MakePayment(1000m, "cash", new DateTime(2026, 6, 1), 1));
        context.Payments.Add(MakePayment(2000m, "transfer", new DateTime(2026, 6, 10), 1));
        context.Payments.Add(MakePayment(3000m, "cash", new DateTime(2026, 6, 20), 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var total = await repo.GetTotalAmountAsync(new DateTime(2026, 6, 10), new DateTime(2026, 6, 20), null);

        Assert.Equal(5000m, total);
    }

    // 13
    [Fact]
    public async Task GetTotalAmountAsync_WithMethodFilter_SumsOnlyThatMethod()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        context.Payments.Add(MakePayment(1000m, "cash", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(2000m, "transfer", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(3000m, "cash", DateTime.UtcNow, 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var total = await repo.GetTotalAmountAsync(null, null, "cash");

        Assert.Equal(4000m, total);
    }

    // 14
    [Fact]
    public async Task GetTotalAmountAsync_EmptyTable_ReturnsZero()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        var repo = new PaymentRepository(context);
        var total = await repo.GetTotalAmountAsync(null, null, null);

        Assert.Equal(0m, total);
    }

    // ──────────────────── GetPaymentCountAsync ────────────────────

    // 15
    [Fact]
    public async Task GetPaymentCountAsync_NoFilters_ReturnsTotalCount()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        context.Payments.Add(MakePayment(1000m, "cash", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(2000m, "transfer", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(3000m, "credit_card", DateTime.UtcNow, 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var count = await repo.GetPaymentCountAsync(null, null, null);

        Assert.Equal(3, count);
    }

    // 16
    [Fact]
    public async Task GetPaymentCountAsync_WithDateRange_ReturnsCountInRange()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        context.Payments.Add(MakePayment(1000m, "cash", new DateTime(2026, 6, 1), 1));
        context.Payments.Add(MakePayment(2000m, "transfer", new DateTime(2026, 6, 5), 1));
        context.Payments.Add(MakePayment(3000m, "cash", new DateTime(2026, 6, 10), 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var count = await repo.GetPaymentCountAsync(new DateTime(2026, 6, 5), new DateTime(2026, 6, 10), null);

        Assert.Equal(2, count);
    }

    // 17
    [Fact]
    public async Task GetPaymentCountAsync_WithMethod_ReturnsCountForMethod()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        context.Payments.Add(MakePayment(1000m, "transfer", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(2000m, "cash", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(3000m, "transfer", DateTime.UtcNow, 1));
        context.Payments.Add(MakePayment(4000m, "credit_card", DateTime.UtcNow, 1));
        await context.SaveChangesAsync();

        var repo = new PaymentRepository(context);
        var count = await repo.GetPaymentCountAsync(null, null, "transfer");

        Assert.Equal(2, count);
    }

    // 18
    [Fact]
    public async Task GetPaymentCountAsync_EmptyTable_ReturnsZero()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateInMemoryDbContext(dbName);

        var repo = new PaymentRepository(context);
        var count = await repo.GetPaymentCountAsync(null, null, null);

        Assert.Equal(0, count);
    }
}
