namespace academy_API.Models;

public class PublicWebsiteContent : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public string SectionKey { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public string? ContentValue { get; set; }
    public string? Metadata { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Institute Institute { get; set; } = null!;
}
