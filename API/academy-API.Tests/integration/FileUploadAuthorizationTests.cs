using academy_API.Controllers;
using academy_API.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace academy_API.Tests.integration;

public sealed class FileUploadAuthorizationTests
{
    [Fact]
    public async Task WebsiteMedia_AnonymousRequest_IsRejected()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddSingleton(new Mock<IFileUploadService>().Object);
        builder.Services.AddAuthentication("Test").AddScheme<AuthenticationSchemeOptions, AnonymousAuthenticationHandler>("Test", _ => { });
        builder.Services.AddAuthorization();

        await using var app = builder.Build();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapFileUploadEndpoints();
        await app.StartAsync();

        using var response = await app.GetTestClient().PostAsync("/api/uploads/website-media", new MultipartFormDataContent());

        Assert.Equal(StatusCodes.Status401Unauthorized, (int)response.StatusCode);
    }

    [Fact]
    public async Task WebsiteMedia_AuthenticatedRequestWithoutInstitute_IsRejectedBeforeStorage()
    {
        var service = new Mock<IFileUploadService>(MockBehavior.Strict);
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddSingleton(service.Object);
        builder.Services.AddAuthentication("Test").AddScheme<AuthenticationSchemeOptions, InstituteLessAuthenticationHandler>("Test", _ => { });
        builder.Services.AddAuthorization();

        await using var app = builder.Build();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapFileUploadEndpoints();
        await app.StartAsync();

        using var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent([1, 2, 3]), "file", "sample.png");
        using var response = await app.GetTestClient().PostAsync("/api/uploads/website-media", content);

        Assert.Equal(StatusCodes.Status400BadRequest, (int)response.StatusCode);
        service.VerifyNoOtherCalls();
    }

    private sealed class AnonymousAuthenticationHandler(
        Microsoft.Extensions.Options.IOptionsMonitor<AuthenticationSchemeOptions> options,
        Microsoft.Extensions.Logging.ILoggerFactory logger,
        System.Text.Encodings.Web.UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync() => Task.FromResult(AuthenticateResult.NoResult());
    }

    private sealed class InstituteLessAuthenticationHandler(
        Microsoft.Extensions.Options.IOptionsMonitor<AuthenticationSchemeOptions> options,
        Microsoft.Extensions.Logging.ILoggerFactory logger,
        System.Text.Encodings.Web.UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var identity = new System.Security.Claims.ClaimsIdentity(
                [new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "1")], Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new System.Security.Claims.ClaimsPrincipal(identity), Scheme.Name)));
        }
    }
}
