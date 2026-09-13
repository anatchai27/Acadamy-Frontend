using System.Security.Claims;
using System.Text.Encodings.Web;
using academy_API.Controllers;
using academy_API.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace academy_API.Tests.integration;

public sealed class ReportAuthorizationTests
{
    [Fact]
    public async Task RevenueReport_AdminIsAllowed_AndTeacherIsForbidden()
    {
        var service = new Mock<IRevenueReportService>();
        service.Setup(x => x.GetAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>(), "day", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddSingleton(service.Object);
        builder.Services.AddAuthentication("Test")
            .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", _ => { });
        builder.Services.AddAuthorization();

        await using var app = builder.Build();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapReportEndpoints();
        await app.StartAsync();

        using var client = app.GetTestClient();

        using var adminRequest = new HttpRequestMessage(HttpMethod.Get, "/api/reports/revenue?from=2026-06-10&to=2026-06-10");
        adminRequest.Headers.Add("X-Test-Role", "admin");
        var adminResponse = await client.SendAsync(adminRequest);

        using var teacherRequest = new HttpRequestMessage(HttpMethod.Get, "/api/reports/revenue?from=2026-06-10&to=2026-06-10");
        teacherRequest.Headers.Add("X-Test-Role", "teacher");
        var teacherResponse = await client.SendAsync(teacherRequest);

        Assert.Equal(StatusCodes.Status200OK, (int)adminResponse.StatusCode);
        Assert.Equal(StatusCodes.Status403Forbidden, (int)teacherResponse.StatusCode);
        service.Verify(x => x.GetAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>(), "day", It.IsAny<CancellationToken>()), Times.Once);
    }

    private sealed class TestAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var role = Request.Headers["X-Test-Role"].ToString();
            if (string.IsNullOrWhiteSpace(role))
                return Task.FromResult(AuthenticateResult.NoResult());

            var identity = new ClaimsIdentity(
                [new Claim(ClaimTypes.NameIdentifier, "1"), new Claim(ClaimTypes.Role, role)],
                Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name)));
        }
    }
}
