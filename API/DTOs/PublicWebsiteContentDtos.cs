namespace academy_API.DTOs;

public sealed record PublicContentItem(long Id, string SectionKey, string ContentType, string? ContentValue, string? Metadata, int SortOrder, bool IsActive, DateTime UpdatedAt);
public sealed record PublicContentResponse(string Status, List<PublicContentItem> Items);
public sealed record UpsertPublicContentRequest(string SectionKey, string ContentType, string? ContentValue, string? Metadata, int SortOrder, bool IsActive);
