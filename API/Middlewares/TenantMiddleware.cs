using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;

namespace academy_API.Middlewares;

public class TenantMiddleware(RequestDelegate next, IConfiguration configuration)
{
    private readonly RequestDelegate _next = next;
    private readonly string _jwtKey = configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured.");
    private readonly string _jwtIssuer = configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured.");
    private readonly string _jwtAudience = configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured.");

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value;

        if (path != null && (path.StartsWith("/api/auth") || path.StartsWith("/api/public") || path.StartsWith("/api/health") || path.StartsWith("/api/v1")))
        {
            await _next(context);
            return;
        }

        // Try to extract institute_id from the authenticated user first.
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

        // Fallback: manually parse the JWT from Authorization header or cookie.
        var rawToken = context.Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
        if (string.IsNullOrEmpty(rawToken))
        {
            rawToken = context.Request.Cookies["auth_token"];
        }

        if (!string.IsNullOrEmpty(rawToken))
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(rawToken, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _jwtIssuer,
                    ValidAudience = _jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtKey))
                }, out _);

                var instituteIdClaim = principal.FindFirst("institute_id")?.Value;
                if (!string.IsNullOrEmpty(instituteIdClaim) && int.TryParse(instituteIdClaim, out var instituteId))
                {
                    context.Items["InstituteId"] = instituteId;
                    await _next(context);
                    return;
                }
            }
            catch
            {
                // Token invalid — fall through to 403.
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
