using System.Security.Claims;
using System.Text.Encodings.Web;
using academy_API.Controllers;
using academy_API.DTOs;
using academy_API.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace academy_API.Tests.integration;

public sealed class MakeupAuthorizationTests
{
    [Fact]
    public async Task AdminAndTeacherCanMutateSlots_ParentIsForbidden()
    {
        var service = new Mock<IMakeupService>();
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddSingleton(service.Object);
        builder.Services.AddAuthentication("Test")
            .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", _ => { });
        builder.Services.AddAuthorization();

        await using var app = builder.Build();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapMakeupEndpoints();
        await app.StartAsync();

        using var client = app.GetTestClient();
        var requestBody = new StringContent(
            "{\"teacherId\":4,\"scheduledAt\":\"2026-10-01T10:00:00Z\",\"capacity\":3,\"roomId\":\"A1\"}",
            System.Text.Encoding.UTF8,
            "application/json");

        using var adminRequest = new HttpRequestMessage(HttpMethod.Post, "/api/makeup/slots") { Content = requestBody };
        adminRequest.Headers.Add("X-Test-Role", "admin");
        using var teacherRequest = new HttpRequestMessage(HttpMethod.Post, "/api/makeup/slots") { Content = new StringContent(
            "{\"teacherId\":4,\"scheduledAt\":\"2026-10-01T10:00:00Z\",\"capacity\":3,\"roomId\":\"A1\"}",
            System.Text.Encoding.UTF8,
            "application/json") };
        teacherRequest.Headers.Add("X-Test-Role", "teacher");
        using var parentRequest = new HttpRequestMessage(HttpMethod.Post, "/api/makeup/slots") { Content = new StringContent(
            "{\"teacherId\":4,\"scheduledAt\":\"2026-10-01T10:00:00Z\",\"capacity\":3,\"roomId\":\"A1\"}",
            System.Text.Encoding.UTF8,
            "application/json") };
        parentRequest.Headers.Add("X-Test-Role", "parent");

        var adminResponse = await client.SendAsync(adminRequest);
        var teacherResponse = await client.SendAsync(teacherRequest);
        var parentResponse = await client.SendAsync(parentRequest);

        Assert.NotEqual(StatusCodes.Status403Forbidden, (int)adminResponse.StatusCode);
        Assert.NotEqual(StatusCodes.Status403Forbidden, (int)teacherResponse.StatusCode);
        Assert.Equal(StatusCodes.Status403Forbidden, (int)parentResponse.StatusCode);
    }

    private sealed class TestAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var role = Request.Headers["X-Test-Role"].ToString();
            if (string.IsNullOrWhiteSpace(role)) return Task.FromResult(AuthenticateResult.NoResult());
            var identity = new ClaimsIdentity(
                [new Claim(ClaimTypes.NameIdentifier, "99"), new Claim(ClaimTypes.Role, role)],
                Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name)));
        }
    }
}
