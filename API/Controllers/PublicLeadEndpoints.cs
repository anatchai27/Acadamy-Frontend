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

        var admin = app.MapGroup("/api/leads")
            .WithTags("Leads")
            .WithOpenApi()
            .RequireAuthorization();

        admin.MapGet("", async (string? status, string? search, ILeadService service, HttpContext context, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("admin")) return Results.Forbid();
            return Results.Ok(await service.ListAsync(status, search, ct));
        });

        admin.MapPut("/{id:long}/follow-up", async (long id, UpdateLeadFollowUpRequest request, ILeadService service, HttpContext context, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("admin")) return Results.Forbid();
            try
            {
                await service.UpdateFollowUpAsync(id, request, ct);
                return Results.Ok(new { Status = "success" });
            }
            catch (LeadValidationException ex)
            {
                return ex.Code == "LEAD_NOT_FOUND"
                    ? Results.NotFound(new { Status = "error", ErrorCode = ex.Code, Message = ex.Message })
                    : Results.BadRequest(new { Status = "error", ErrorCode = ex.Code, Message = ex.Message });
            }
        });

        var content = app.MapGroup("/api/website-content").WithTags("WebsiteContent").WithOpenApi().RequireAuthorization();
        content.MapGet("", async (ILeadService service, HttpContext context, CancellationToken ct) =>
            context.User.IsInRole("admin") ? Results.Ok(await service.ListContentAsync(ct)) : Results.Forbid());
        content.MapPut("/{id:long?}", async (long? id, UpsertPublicContentRequest request, ILeadService service, HttpContext context, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("admin")) return Results.Forbid();
            try { return Results.Ok(await service.UpsertContentAsync(id, request, ct)); }
            catch (LeadValidationException ex) { return Results.BadRequest(new { Status = "error", ErrorCode = ex.Code, Message = ex.Message }); }
        });

        return app;
    }
}
