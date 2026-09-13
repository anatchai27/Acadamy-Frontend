using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using academy_API.Models;
using academy_API.Services;
using academy_API.Services.Contracts;
using Microsoft.IdentityModel.Tokens;

namespace academy_API.Controllers;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Authentication")
            .WithOpenApi();

        group.MapPost("/login", async (LoginRequest request, IUserService userService, ITokenService tokenService, HttpContext httpContext, CancellationToken ct) =>
        {
            var result = await userService.LoginAsync(request.Email, request.Password, ct);
            if (result is null) return Results.Unauthorized();

            var refreshToken = tokenService.GenerateRefreshToken(new User
            {
                Id = result.UserId,
                Email = result.Email,
                Role = Enum.Parse<UserRole>(result.Role),
                InstituteId = result.InstituteId
            });
            AppendAuthCookie(httpContext, result.Token, secure: false);
            return Results.Ok(new LoginResponse(result.Token, result.UserId, result.Email, result.Role, refreshToken, result.InstituteId));
        });

        group.MapPost("/register-institute", RegisterInstitute).AllowAnonymous();

        group.MapGet("/me", async (HttpContext httpContext, IUserService userService, CancellationToken ct) =>
        {
            var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Results.Unauthorized();
            var result = await userService.GetCurrentUserAsync(userId, ct);
            return result is null
                ? Results.Json(new { status = "error", error_code = "USER_NOT_FOUND", message = "ไม่พบบัญชีผู้ใช้" }, statusCode: 404)
                : Results.Ok(result);
        }).RequireAuthorization();

        group.MapPost("/logout", (HttpContext httpContext) =>
        {
            httpContext.Response.Cookies.Delete("auth_token", new CookieOptions { Path = "/", Secure = true, SameSite = SameSiteMode.Lax });
            return Results.Ok(new { status = "success", message = "ออกจากระบบสำเร็จ" });
        });

        group.MapPost("/refresh-token", async (
            RefreshTokenRequest request,
            ITokenService tokenService,
            IUserService userService,
            IConfiguration config,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Token))
                return Results.BadRequest(new { status = "error", error_code = "MISSING_TOKEN", message = "Token is required." });

            try
            {
                var principal = ValidateToken(request.Token, config, out var validatedToken);
                if (validatedToken is not JwtSecurityToken jwtToken ||
                    !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                    return Results.Unauthorized();

                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId)) return Results.Unauthorized();

                var user = await userService.GetActiveUserForRefreshAsync(userId, ct);
                if (user is null)
                    return Results.Json(new { status = "error", error_code = "INSTITUTE_SUSPENDED", message = "สถาบันถูกระงับการใช้งาน" }, statusCode: 403);

                var refreshResult = tokenService.ValidateAndRefresh(request.Token, user);
                if (refreshResult is null) return Results.Unauthorized();
                var refreshToken = tokenService.GenerateRefreshToken(user);
                AppendAuthCookie(httpContext, refreshResult.Value.Token, secure: false);

                return Results.Ok(new
                {
                    status = "success",
                    message = "ต่ออายุ Token สำเร็จ",
                    token = refreshResult.Value.Token,
                    refreshToken,
                    user = new { id = user.Id, email = user.Email, role = user.Role.ToString(), instituteId = user.InstituteId }
                });
            }
            catch (SecurityTokenException)
            {
                return Results.Unauthorized();
            }
            catch
            {
                return Results.Unauthorized();
            }
        }).AllowAnonymous();

        return group;
    }

    private static async Task<IResult> RegisterInstitute(
        RegisterUserRequest request,
        IUserService userService,
        ITokenService tokenService,
        HttpContext httpContext,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return Results.BadRequest(new { error = "Email and password are required." });
        if (request.Role != UserRole.admin)
            return Results.BadRequest(new { error = "Role must be 'admin' for institute registration." });
        if (request.Institute?.Name is null)
            return Results.BadRequest(new { error = "Institute name is required." });

        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString()
            ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        try
        {
            var result = await userService.RegisterAsync(request, ipAddress, ct);
            var token = tokenService.GenerateToken(result.User);
            AppendAuthCookie(httpContext, token, secure: true);
            return Results.Created("/api/auth/me", new
            {
                status = "success",
                message = "ลงทะเบียนสถาบันสำเร็จ",
                token,
                user = new
                {
                    id = result.User.Id,
                    email = result.User.Email,
                    role = result.User.Role.ToString(),
                    instituteId = result.Institute!.Id,
                    instituteName = result.Institute.Name
                }
            });
        }
        catch (UserValidationException ex)
        {
            return Results.BadRequest(new { error = ex.Message });
        }
        catch
        {
            return Results.Problem("เกิดข้อผิดพลาดในการลงทะเบียนสถาบัน กรุณาลองใหม่อีกครั้ง", statusCode: 500);
        }
    }

    private static ClaimsPrincipal ValidateToken(string token, IConfiguration config, out SecurityToken validatedToken)
    {
        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = false,
            ValidateIssuerSigningKey = true,
            ValidIssuer = config["Jwt:Issuer"],
            ValidAudience = config["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured.")))
        };
        return new JwtSecurityTokenHandler().ValidateToken(token, parameters, out validatedToken);
    }

    private static void AppendAuthCookie(HttpContext httpContext, string token, bool secure)
    {
        var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
        httpContext.Response.Cookies.Append("auth_token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddMinutes(int.Parse(config["Jwt:ExpiryInMinutes"] ?? "30")),
            Path = "/"
        });
    }
}

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, int UserId, string Email, string Role, string RefreshToken, int InstituteId);
public record RefreshTokenRequest(string Token);
