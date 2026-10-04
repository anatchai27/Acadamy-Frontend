namespace academy_API.Models;

public class Room : IMultiTenantEntity
{
    public int Id { get; set; }
    public int InstituteId { get; set; }
    public string Name { get; set; } = null!;
    public string? NameEn { get; set; }
    public string? Description { get; set; }
    public string? DescriptionEn { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
