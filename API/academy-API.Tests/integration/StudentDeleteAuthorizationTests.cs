using System.Security.Claims;
using System.Text.Encodings.Web;
using academy_API.Controllers;
using academy_API.Services.Interface;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace academy_API.Tests.integration;

public sealed class StudentDeleteAuthorizationTests
{
    [Fact]
    public async Task DeleteStudent_AdminCanDelete_NonAdminAndAnonymousAreRejected()
    {
        var service = new Mock<IStudentService>();
        service.Setup(x => x.DeleteAsync(42, It.IsAny<CancellationToken>())).ReturnsAsync(StudentDeleteResult.Deleted);

        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddSingleton(service.Object);
        builder.Services.AddSingleton(Mock.Of<IStudentExportService>());
        builder.Services.AddSingleton(Mock.Of<IStudentCardService>());
        builder.Services.AddSingleton(Mock.Of<IStudentPickupService>());
        builder.Services.AddAuthentication("Test")
            .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", _ => { });
        builder.Services.AddAuthorization();

        await using var app = builder.Build();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapStudentEndpoints();
        await app.StartAsync();

        using var client = app.GetTestClient();
        using var adminRequest = new HttpRequestMessage(HttpMethod.Delete, "/api/students/42");
        adminRequest.Headers.Add("X-Test-Role", "admin");
        using var teacherRequest = new HttpRequestMessage(HttpMethod.Delete, "/api/students/42");
        teacherRequest.Headers.Add("X-Test-Role", "teacher");

        var adminResponse = await client.SendAsync(adminRequest);
        var teacherResponse = await client.SendAsync(teacherRequest);
        var anonymousResponse = await client.DeleteAsync("/api/students/42");

        Assert.Equal(StatusCodes.Status204NoContent, (int)adminResponse.StatusCode);
        Assert.Equal(StatusCodes.Status403Forbidden, (int)teacherResponse.StatusCode);
        Assert.Equal(StatusCodes.Status401Unauthorized, (int)anonymousResponse.StatusCode);
        service.Verify(x => x.DeleteAsync(42, It.IsAny<CancellationToken>()), Times.Once);
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
            return Task.FromResult(AuthenticateResult.Success(
                new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name)));
        }
    }
}
