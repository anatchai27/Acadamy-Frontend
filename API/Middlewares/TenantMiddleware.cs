using System.Security.Claims;

namespace academy_API.Middlewares;

public class TenantMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var instituteIdClaim = context.User.FindFirst("institute_id")?.Value;
            if (!string.IsNullOrEmpty(instituteIdClaim) && int.TryParse(instituteIdClaim, out var instituteId))
            {
                context.Items["InstituteId"] = instituteId;
            }
        }

        await _next(context);
    }
}
