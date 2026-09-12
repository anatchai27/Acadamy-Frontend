namespace academy_API.Models;

public class StudentPickupAuthorization : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public int StudentId { get; set; }
    public string FullName { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Relationship { get; set; }
    public string? IdCardLast4 { get; set; }
    public string? PhotoUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}
