namespace academy_API.Models;

public class Enrollment : IMultiTenantEntity
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int CourseId { get; set; }
    public int InstituteId { get; set; }
    public int SessionsRemaining { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Student Student { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public Institute Institute { get; set; } = null!;
}
