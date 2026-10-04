using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using System.Globalization;

namespace academy_API.Services;

public interface IRevenueReportService
{
    Task<List<RevenueReportRow>> GetAsync(DateTime from, DateTime to, string groupBy, CancellationToken ct = default);
}

public sealed class RevenueReportService(IPaymentRepository repository, IPaymentBatchRepository? batchRepository = null) : IRevenueReportService
{
    public async Task<List<RevenueReportRow>> GetAsync(DateTime from, DateTime to, string groupBy, CancellationToken ct = default)
    {
        var payments = await repository.GetPaymentsForExportAsync(from, to.Date.AddDays(1).AddTicks(-1), null, ct);
        var batches = batchRepository is null
            ? new List<PaymentBatch>()
            : await batchRepository.GetBatchesForExportAsync(from, to.Date.AddDays(1).AddTicks(-1), null, ct);
        var entries = payments
            .Where(payment => payment.Status == PaymentStatus.Succeeded)
            .Select(payment => (payment.PaidAt, Amount: payment.NetAmount ?? payment.Amount))
            .Concat(batches.Where(batch => batch.Status == PaymentStatus.Succeeded)
                .Select(batch => (batch.PaidAt, Amount: batch.Amount)));
        return entries
            .GroupBy(payment => FormatPeriod(payment.PaidAt, groupBy))
            .OrderBy(group => group.Key)
            .Select(group => new RevenueReportRow(
                group.Key,
                group.Sum(payment => payment.Amount),
                group.Count()))
            .ToList();
    }

    private static string FormatPeriod(DateTime value, string groupBy) => groupBy switch
    {
        "year" => value.ToString("yyyy", CultureInfo.InvariantCulture),
        "month" => value.ToString("yyyy-MM", CultureInfo.InvariantCulture),
        _ => value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
    };
}
