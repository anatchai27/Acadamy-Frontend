namespace academy_API.Models;

public class Badge : IMultiTenantEntity
{
    public int Id { get; set; }
    public int InstituteId { get; set; }
    public string BadgeKey { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public string CriteriaType { get; set; } = null!;
    public int CriteriaValue { get; set; }
    public bool IsActive { get; set; }

    public Institute Institute { get; set; } = null!;
}
