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

    private sealed class AnonymousAuthenticationHandler(
        Microsoft.Extensions.Options.IOptionsMonitor<AuthenticationSchemeOptions> options,
        Microsoft.Extensions.Logging.ILoggerFactory logger,
        System.Text.Encodings.Web.UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync() => Task.FromResult(AuthenticateResult.NoResult());
    }
}
