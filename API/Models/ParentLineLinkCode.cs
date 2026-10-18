namespace academy_API.Models;

public sealed class ParentLineLinkCode : IMultiTenantEntity
{
    public long Id { get; set; }
    public int ParentId { get; set; }
    public int InstituteId { get; set; }
    public int CreatedByUserId { get; set; }
    public string CodeHash { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RedeemedAt { get; set; }
    public string? RedeemedByLineUserId { get; set; }
    public DateTime? RevokedAt { get; set; }

    public Parent Parent { get; set; } = null!;
}
