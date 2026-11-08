using System.Security.Cryptography;
using System.Text.Json;
using academy_API.Data;
using academy_API.Models;
using academy_API.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Services;

public sealed class TermsService : ITermsService
{
    private readonly TutoringDbContext _context;
    private readonly TermsDocument _document;
    private readonly string _contentHash;

    public TermsService(TutoringDbContext context, IConfiguration configuration, IWebHostEnvironment environment)
    {
        _context = context;
        var version = configuration["Legal:Terms:CurrentVersion"] ?? "1.0";
        var relativePath = configuration[$"Legal:Terms:Documents:{version}"] ?? $"Legal/terms-v{version}.json";
        var fullPath = Path.Combine(environment.ContentRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(fullPath))
            throw new InvalidOperationException($"Current terms document '{fullPath}' was not found.");

        var json = File.ReadAllText(fullPath);
        _document = JsonSerializer.Deserialize<TermsDocument>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))
            ?? throw new InvalidOperationException("The current terms document is invalid.");
        if (!string.Equals(_document.Version, version, StringComparison.Ordinal))
            throw new InvalidOperationException("The terms document version does not match Legal:Terms:CurrentVersion.");
        _contentHash = Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(json))).ToLowerInvariant();
    }

    public TermsDocument GetCurrentDocument(string language) => _document;
    public string GetCurrentContentSha256() => _contentHash;

    public Task<bool> HasAcceptedAsync(int userId, string version, CancellationToken ct = default) =>
        _context.TermsAcceptances.AsNoTracking().AnyAsync(
            item => item.UserId == userId && item.DocumentType == "terms" && item.DocumentVersion == version, ct);

    public async Task<bool> HasParentAcceptedAsync(string lineUserId, string version, CancellationToken ct = default)
    {
        var userIds = _context.Parents.IgnoreQueryFilters().AsNoTracking()
            .Where(item => item.LineUserId == lineUserId && item.UserId.HasValue)
            .Select(item => item.UserId!.Value);
        return await _context.TermsAcceptances.AsNoTracking().AnyAsync(
            item => userIds.Contains(item.UserId) && item.DocumentType == "terms" && item.DocumentVersion == version, ct);
    }

    public async Task<TermsAcceptance> AcceptAsync(
        int userId,
        string version,
        string language,
        string source,
        string actorType,
        int? actorId,
        int? parentId,
        string? ipAddress,
        string? userAgent,
        CancellationToken ct = default)
    {
        if (!string.Equals(version, _document.Version, StringComparison.Ordinal))
            throw new TermsVersionConflictException(_document.Version);
        if (language is not ("th" or "en")) language = "th";

        var existing = await _context.TermsAcceptances.FirstOrDefaultAsync(
            item => item.UserId == userId && item.DocumentType == "terms" && item.DocumentVersion == version, ct);
        if (existing is not null) return existing;

        var acceptance = new TermsAcceptance
        {
            UserId = userId,
            ParentId = parentId,
            DocumentVersion = version,
            Language = language,
            ContentSha256 = _contentHash,
            AcceptedAt = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Source = source,
            ActorType = actorType,
            ActorId = actorId
        };
        _context.TermsAcceptances.Add(acceptance);
        await _context.SaveChangesAsync(ct);
        return acceptance;
    }
}

public sealed class TermsVersionConflictException(string currentVersion)
    : Exception("The terms version is no longer current.")
{
    public string CurrentVersion { get; } = currentVersion;
}