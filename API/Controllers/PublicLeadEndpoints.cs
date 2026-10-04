using academy_API.DTOs;
using academy_API.Data;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class PublicLeadEndpoints
{
    public static IEndpointRouteBuilder MapPublicLeadEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/public/website-content/{slug}", async (string slug, string? locale, TutoringDbContext db, CancellationToken ct) =>
        {
            var requestedLocale = NormalizeLocale(locale);
            var institute = await db.Institutes
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.IsActive && x.Slug == slug, ct);
            if (institute is null) return Results.NotFound(new { status = "not_found" });

            var localizedItems = await db.PublicWebsiteContents
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(x => x.InstituteId == institute.Id && x.IsActive &&
                    (x.Locale == requestedLocale || (requestedLocale != "th" && x.Locale == "th")))
                .OrderBy(x => x.SortOrder)
                .Select(x => new PublicContentItem(x.Id, x.SectionKey, x.ContentType, x.ContentValue, x.Metadata, x.SortOrder, x.IsActive, x.UpdatedAt, x.Locale))
                .ToListAsync(ct);

            var items = localizedItems
                .GroupBy(x => x.SectionKey)
                .Select(group => group.FirstOrDefault(x => x.Locale == requestedLocale) ?? group.First())
                .OrderBy(x => x.SortOrder)
                .ToList();

            return Results.Ok(new { status = "success", institute = new { institute.Id, institute.Name, institute.Slug }, items });
        })
        .WithTags("Public")
        .WithName("GetPublicWebsiteContent")
        .WithOpenApi();

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
                var actorClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var actorId = int.TryParse(actorClaim, out var parsedActorId) ? parsedActorId : (int?)null;
                await service.UpdateFollowUpAsync(id, request, actorId, ct);
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

    private static string NormalizeLocale(string? locale)
    {
        var language = locale?.Split('-', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.ToLowerInvariant();
        return language is "th" or "en" ? language : "th";
    }
}
