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
                new Payment { Amount = 100m, PaidAt = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc) },
                new Payment { Amount = 250m, PaidAt = new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc) },
                new Payment { Amount = 75m, PaidAt = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc) }
            ]);

        var result = await new RevenueReportService(repository.Object).GetAsync(
            new DateTime(2026, 1, 1), new DateTime(2026, 2, 28), "month");

        Assert.Equal(2, result.Count);
        Assert.Equal("2026-01", result[0].Period);
        Assert.Equal(350m, result[0].GrossAmount);
        Assert.Equal(2, result[0].PaymentCount);
    }
}
