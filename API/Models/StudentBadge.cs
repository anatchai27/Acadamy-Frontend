namespace academy_API.Models;

public class StudentBadge : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public int StudentId { get; set; }
    public int BadgeId { get; set; }
    public DateTime AwardedAt { get; set; }
    public int? AwardedBySessionId { get; set; }

    public Institute Institute { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Badge Badge { get; set; } = null!;
}
