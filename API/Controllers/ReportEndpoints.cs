using academy_API.Services;

namespace academy_API.Controllers;

public static class ReportEndpoints
{
    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reports/revenue", async (
            IRevenueReportService service,
            DateTime from,
            DateTime to,
            string? group_by,
            CancellationToken ct) =>
        {
            var groupBy = string.IsNullOrWhiteSpace(group_by) ? "day" : group_by.ToLowerInvariant();
            if (groupBy is not ("day" or "month" or "year") || from.Date > to.Date)
                return Results.BadRequest(new { error = "Invalid revenue report range or group_by." });

            return Results.Ok(await service.GetAsync(from.Date, to.Date, groupBy, ct));
        })
        .WithTags("Reports")
        .WithOpenApi()
        .RequireAuthorization(policy => policy.RequireRole("admin"));

        return app;
    }
}
