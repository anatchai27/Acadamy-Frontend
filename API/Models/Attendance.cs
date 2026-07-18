namespace academy_API.Models;

public class Attendance : IMultiTenantEntity
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public int StudentId { get; set; }
    public int InstituteId { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? CheckinAt { get; set; }
    public DateTime? CheckoutAt { get; set; }
    public string? PickedUpBy { get; set; }

    public Session Session { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Institute Institute { get; set; } = null!;
}
