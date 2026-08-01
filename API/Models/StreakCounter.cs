namespace academy_API.Models;

public class StreakCounter : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public int StudentId { get; set; }
    public string StreakType { get; set; } = null!;
    public int CurrentCount { get; set; }
    public int LongestCount { get; set; }
    public DateTime? LastAwardedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Institute Institute { get; set; } = null!;
    public Student Student { get; set; } = null!;
}
