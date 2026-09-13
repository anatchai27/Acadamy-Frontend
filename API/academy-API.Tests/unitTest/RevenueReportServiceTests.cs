using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class RevenueReportServiceTests
{
    [Fact]
    public async Task GetAsync_GroupsRealPaymentsByMonth()
    {
        var repository = new Mock<IPaymentRepository>();
        repository.Setup(x => x.GetPaymentsForExportAsync(
                It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new Payment { Amount = 100m, Status = PaymentStatus.Succeeded, PaidAt = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc) },
                new Payment { Amount = 250m, Status = PaymentStatus.Succeeded, PaidAt = new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc) },
                new Payment { Amount = 75m, Status = PaymentStatus.Succeeded, PaidAt = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Payment { Amount = 999m, Status = PaymentStatus.Pending, PaidAt = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc) }
            ]);

        var result = await new RevenueReportService(repository.Object).GetAsync(
            new DateTime(2026, 1, 1), new DateTime(2026, 2, 28), "month");

        Assert.Equal(2, result.Count);
        Assert.Equal("2026-01", result[0].Period);
        Assert.Equal(350m, result[0].GrossAmount);
        Assert.Equal(2, result[0].PaymentCount);
    }

    [Fact]
    public async Task GetAsync_ExcludesPendingAndUsesNetAmount()
    {
        var repository = new Mock<IPaymentRepository>();
        repository.Setup(x => x.GetPaymentsForExportAsync(
                It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new Payment { Amount = 100m, NetAmount = 90m, Status = PaymentStatus.Succeeded, PaidAt = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc) },
                new Payment { Amount = 200m, Status = PaymentStatus.Pending, PaidAt = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc) }
            ]);

        var result = await new RevenueReportService(repository.Object).GetAsync(
            new DateTime(2026, 1, 1), new DateTime(2026, 1, 31), "day");

        var row = Assert.Single(result);
        Assert.Equal(90m, row.GrossAmount);
        Assert.Equal(1, row.PaymentCount);
    }
}
