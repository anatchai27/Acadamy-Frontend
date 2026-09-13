using academy_API.DTOs;
using academy_API.Services;

namespace academy_API.Controllers;

public static class PublicLeadEndpoints
{
    public static IEndpointRouteBuilder MapPublicLeadEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/public/leads", async (CreateLeadRequest request, ILeadService service, CancellationToken ct) =>
        {
            try
            {
                var result = await service.CreateAsync(request, ct);
                return Results.Created("/api/public/leads", result);
            }
            catch (LeadValidationException ex)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [ex.Code] = [ex.Message]
                });
            }
        })
        .WithTags("Public")
        .WithName("CreatePublicLead")
        .WithOpenApi()
        .RequireRateLimiting("public-leads");

        return app;
    }
}
