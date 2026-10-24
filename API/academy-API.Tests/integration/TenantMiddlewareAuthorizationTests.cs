using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using academy_API.Middlewares;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace academy_API.Tests.integration;

public sealed class TenantMiddlewareAuthorizationTests
{
    private const string TestSigningKey = "local-test-signing-key-only-not-a-secret-123456";
    private const string TestIssuer = "tenant-middleware-tests";
    private const string TestAudience = "tenant-middleware-tests";

    [Fact]
    public async Task ExpiredJwt_IsChallengedBeforeTenantMiddleware_AndAnonymousBindRemainsAvailable()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = TestSigningKey,
            ["Jwt:Issuer"] = TestIssuer,
            ["Jwt:Audience"] = TestAudience
        });
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = TestIssuer,
                    ValidAudience = TestAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSigningKey))
                };
            });
        builder.Services.AddAuthorization();

        await using var app = builder.Build();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseMiddleware<TenantMiddleware>();
        app.MapGet("/api/parents/me/dashboard", () => Results.Ok()).RequireAuthorization();
        app.MapPost("/api/parents/bind-line", () => Results.Ok()).AllowAnonymous();
        await app.StartAsync();

        using var client = app.GetTestClient();
        using var expiredJwtRequest = new HttpRequestMessage(HttpMethod.Get, "/api/parents/me/dashboard");
        expiredJwtRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", CreateExpiredToken());
        using var expiredJwtResponse = await client.SendAsync(expiredJwtRequest);
        using var anonymousBindResponse = await client.PostAsync("/api/parents/bind-line", content: null);

        Assert.Equal(StatusCodes.Status401Unauthorized, (int)expiredJwtResponse.StatusCode);
        Assert.Equal(StatusCodes.Status200OK, (int)anonymousBindResponse.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedRequestWithoutInstituteClaim_IsStillRejectedByTenantMiddleware()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = TestSigningKey,
            ["Jwt:Issuer"] = TestIssuer,
            ["Jwt:Audience"] = TestAudience
        });
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = TestIssuer,
                    ValidAudience = TestAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSigningKey))
                };
            });
        builder.Services.AddAuthorization();

        await using var app = builder.Build();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseMiddleware<TenantMiddleware>();
        app.MapGet("/api/parents/me/dashboard", () => Results.Ok()).RequireAuthorization();
        await app.StartAsync();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/parents/me/dashboard");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", CreateValidToken());
        using var response = await app.GetTestClient().SendAsync(request);

        Assert.Equal(StatusCodes.Status403Forbidden, (int)response.StatusCode);
    }

    private static string CreateExpiredToken() => CreateToken(DateTime.UtcNow.AddMinutes(-10));

    private static string CreateValidToken() => CreateToken(DateTime.UtcNow.AddMinutes(10));

    private static string CreateToken(DateTime expires)
    {
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: TestIssuer,
            audience: TestAudience,
            claims: [new Claim(ClaimTypes.NameIdentifier, "1"), new Claim(ClaimTypes.Role, "parent")],
            expires: expires,
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}