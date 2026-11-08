using System.Security.Claims;
using academy_API.Services.Interface;

namespace academy_API.Middlewares;

public sealed class TermsAcceptanceMiddleware(RequestDelegate next)
{
    private static readonly string[] AllowedPaths =
    [
        "/api/legal/terms",
        "/api/auth/login",
        "/api/auth/register-institute",
        "/api/auth/refresh-token",
        "/api/auth/logout",
        "/api/auth/me",
        "/api/parents/bind-line"
    ];

    public async Task InvokeAsync(HttpContext context, ITermsService termsService)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var isAllowed = AllowedPaths.Any(allowed =>
            path.Equals(allowed, StringComparison.OrdinalIgnoreCase) ||
            (allowed == "/api/legal/terms" && path.StartsWith(allowed + "/", StringComparison.OrdinalIgnoreCase)));
        if (context.User.Identity?.IsAuthenticated == true && path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) && !isAllowed)
        {
            var userIdValue = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdValue, out var userId))
            {
                var version = termsService.GetCurrentDocument("th").Version;
                if (!await termsService.HasAcceptedAsync(userId, version, context.RequestAborted))
                {
                    context.Response.StatusCode = StatusCodes.Status428PreconditionRequired;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        code = "TERMS_ACCEPTANCE_REQUIRED",
                        currentVersion = version
                    }, context.RequestAborted);
                    return;
                }
            }
        }

        await next(context);
    }
}