using System.Security.Claims;
using System.Text.Json;

namespace academy_API.Middlewares;

public class TenantMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value;

        if (path != null && (path.StartsWith("/api/auth") || path.StartsWith("/api/public") || path.StartsWith("/api/health") || path.StartsWith("/api/v1")))
        {
            await _next(context);
            return;
        }

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var instituteIdClaim = context.User.FindFirst("institute_id")?.Value;

            if (!string.IsNullOrEmpty(instituteIdClaim) && int.TryParse(instituteIdClaim, out var instituteId))
            {
                context.Items["InstituteId"] = instituteId;
                await _next(context);
                return;
            }
        }

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            error = "Tenant validation failed. Invalid or missing institute context."
        });
    }
}
