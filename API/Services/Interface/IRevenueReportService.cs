using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IRevenueReportService
{
    Task<List<RevenueReportRow>> GetAsync(DateTime from, DateTime to, string groupBy, CancellationToken ct = default);
}