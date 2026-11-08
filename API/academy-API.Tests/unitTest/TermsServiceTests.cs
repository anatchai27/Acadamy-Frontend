using System.Text.Json;
using academy_API.Data;
using academy_API.Models;
using academy_API.Services;
using academy_API.Tests;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace academy_API.Tests.unitTest;

public sealed class TermsServiceTests
{
    [Fact]
    public async Task AcceptAsync_PersistsVersionLocaleActorAndRequestMetadata()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var accepted = await service.AcceptAsync(12, "1.0", "en", "registration", "user", 12, null, "127.0.0.1", "test-agent");

        Assert.Equal(12, accepted.UserId);
        Assert.Equal("1.0", accepted.DocumentVersion);
        Assert.Equal("en", accepted.Language);
        Assert.Equal("registration", accepted.Source);
        Assert.Equal("user", accepted.ActorType);
        Assert.Equal(12, accepted.ActorId);
        Assert.Equal("127.0.0.1", accepted.IpAddress);
        Assert.Equal("test-agent", accepted.UserAgent);
        Assert.Equal(64, accepted.ContentSha256.Length);
        Assert.True(await service.HasAcceptedAsync(12, "1.0"));
    }

    [Fact]
    public async Task AcceptAsync_RejectsStaleVersionWithoutCreatingAuditRecord()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var exception = await Assert.ThrowsAsync<TermsVersionConflictException>(() =>
            service.AcceptAsync(12, "0.9", "th", "front-update", "user", 12, null, null, null));

        Assert.Equal("1.0", exception.CurrentVersion);
        Assert.Empty(context.TermsAcceptances);
    }

    [Fact]
    public async Task AcceptAsync_IsIdempotentForSameUserAndVersion()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var first = await service.AcceptAsync(12, "1.0", "th", "registration", "user", 12, null, null, null);
        var second = await service.AcceptAsync(12, "1.0", "en", "front-update", "user", 12, null, null, null);

        Assert.Equal(first.Id, second.Id);
        Assert.Equal(1, await context.TermsAcceptances.CountAsync());
    }

    private static TutoringDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TutoringDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TutoringDbContext(options, new MockTenantProvider());
    }

    private static TermsService CreateService(TutoringDbContext context)
    {
        var root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
        var values = new Dictionary<string, string?>
        {
            ["Legal:Terms:CurrentVersion"] = "1.0",
            ["Legal:Terms:Documents:1.0"] = "Legal/terms-v1.0.json"
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        return new TermsService(context, configuration, new TestEnvironment(root));
    }

    private sealed class TestEnvironment(string contentRoot) : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "academy-API.Tests";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = contentRoot;
        public string EnvironmentName { get; set; } = "Testing";
        public string ContentRootPath { get; set; } = contentRoot;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}