using academy_API.Models;

namespace academy_API.Services.Interface;

public interface ITermsService
{
    TermsDocument GetCurrentDocument(string language);
    string GetCurrentContentSha256();
    Task<bool> HasAcceptedAsync(int userId, string version, CancellationToken ct = default);
    Task<bool> HasParentAcceptedAsync(string lineUserId, string version, CancellationToken ct = default);
    Task<TermsAcceptance> AcceptAsync(
        int userId,
        string version,
        string language,
        string source,
        string actorType,
        int? actorId,
        int? parentId,
        string? ipAddress,
        string? userAgent,
        CancellationToken ct = default);
}

public sealed record TermsLocaleText(string Th, string En);
public sealed record TermsSection(TermsLocaleText Heading, TermsLocaleParagraphs Paragraphs);
public sealed record TermsLocaleParagraphs(IReadOnlyList<string> Th, IReadOnlyList<string> En);
public sealed record TermsDocument(
    string DocumentType,
    string Version,
    DateOnly EffectiveAt,
    bool ReviewRequired,
    TermsLocaleText Title,
    TermsLocaleText Intro,
    IReadOnlyList<TermsSection> Sections);