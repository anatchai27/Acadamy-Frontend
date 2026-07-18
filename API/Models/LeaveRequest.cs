namespace academy_API.Models;

public class LeaveRequest : IMultiTenantEntity
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int SessionId { get; set; }
    public int InstituteId { get; set; }
    public string? Reason { get; set; }
    public string Type { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime RequestedAt { get; set; }
    public int? ApprovedBy { get; set; }

    public Student Student { get; set; } = null!;
    public Session Session { get; set; } = null!;
    public User? ApprovedByUser { get; set; }
    public Institute Institute { get; set; } = null!;
}
