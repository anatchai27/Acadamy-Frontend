using academy_API.DTOs;
using academy_API.Repositories;
using System.Globalization;

namespace academy_API.Services;

public interface IRevenueReportService
{
    Task<List<RevenueReportRow>> GetAsync(DateTime from, DateTime to, string groupBy, CancellationToken ct = default);
}

public sealed class RevenueReportService(IPaymentRepository repository) : IRevenueReportService
{
    public async Task<List<RevenueReportRow>> GetAsync(DateTime from, DateTime to, string groupBy, CancellationToken ct = default)
    {
        var payments = await repository.GetPaymentsForExportAsync(from, to.Date.AddDays(1).AddTicks(-1), null, ct);
        return payments
            .GroupBy(payment => FormatPeriod(payment.PaidAt, groupBy))
            .OrderBy(group => group.Key)
            .Select(group => new RevenueReportRow(group.Key, group.Sum(payment => payment.Amount), group.Count()))
            .ToList();
    }

    private static string FormatPeriod(DateTime value, string groupBy) => groupBy switch
    {
        "year" => value.ToString("yyyy", CultureInfo.InvariantCulture),
        "month" => value.ToString("yyyy-MM", CultureInfo.InvariantCulture),
        _ => value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
    };
}
