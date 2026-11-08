namespace academy_API.Models;

public sealed class TermsAcceptance
{
    public long Id { get; set; }
    public int UserId { get; set; }
    public int? ParentId { get; set; }
    public string DocumentType { get; set; } = "terms";
    public string DocumentVersion { get; set; } = null!;
    public string Language { get; set; } = "th";
    public string ContentSha256 { get; set; } = null!;
    public DateTime AcceptedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string Source { get; set; } = null!;
    public string ActorType { get; set; } = "user";
    public int? ActorId { get; set; }
}