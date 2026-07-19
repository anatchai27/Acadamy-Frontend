namespace academy_API.Models;

public class Course : IMultiTenantEntity
{
    public int Id { get; set; }
    public int InstituteId { get; set; }
    public string Name { get; set; } = null!;
    public string Subject { get; set; } = null!;
    public int TotalSessions { get; set; }
    public decimal Price { get; set; }
    public int? TeacherId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public int? CapacityLimit { get; set; }
    public string? Status { get; set; }

    public Institute? Institute { get; set; }
    public Teacher? Teacher { get; set; }
}
