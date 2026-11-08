using System.Security.Claims;
using academy_API.Services;
using academy_API.Services.Interface;

namespace academy_API.Controllers;

public static class LegalEndpoints
{
    public static IEndpointRouteBuilder MapLegalEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/legal/terms").WithTags("Legal").WithOpenApi();
        group.MapGet("/current", (string? language, ITermsService service) =>
            Results.Ok(new { document = service.GetCurrentDocument(language ?? "th"), language = language == "en" ? "en" : "th" }))
            .AllowAnonymous();
        group.MapGet("/status", async (HttpContext context, ITermsService service, CancellationToken ct) =>
        {
            if (!TryGetUserId(context, out var userId)) return Results.Unauthorized();
            var document = service.GetCurrentDocument("th");
            var accepted = await service.HasAcceptedAsync(userId, document.Version, ct);
            return Results.Ok(new { accepted, currentVersion = document.Version, requiresAcceptance = !accepted });
        }).RequireAuthorization();
        group.MapPost("/accept", async (
            AcceptTermsRequest request,
            HttpContext context,
            ITermsService service,
            CancellationToken ct) =>
        {
            if (!TryGetUserId(context, out var userId)) return Results.Unauthorized();
            if (!request.Accepted) return Results.BadRequest(new { code = "TERMS_NOT_ACCEPTED", error = "Explicit acceptance is required." });
            try
            {
                var accepted = await service.AcceptAsync(
                    userId,
                    request.Version,
                    request.Language ?? "th",
                    "front-update",
                    "user",
                    userId,
                    null,
                    context.Connection.RemoteIpAddress?.ToString(),
                    context.Request.Headers.UserAgent.ToString(),
                    ct);
                return Results.Ok(new { accepted = true, version = accepted.DocumentVersion, acceptedAt = accepted.AcceptedAt });
            }
            catch (TermsVersionConflictException ex)
            {
                return Results.Conflict(new { code = "TERMS_VERSION_CHANGED", currentVersion = ex.CurrentVersion });
            }
        }).RequireAuthorization();
        return app;
    }

    private static bool TryGetUserId(HttpContext context, out int userId) =>
        int.TryParse(context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out userId);
}

public sealed record AcceptTermsRequest(bool Accepted, string Version, string? Language);