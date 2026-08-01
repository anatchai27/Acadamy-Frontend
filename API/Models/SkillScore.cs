namespace academy_API.Models;

public class SkillScore : IMultiTenantEntity
{
    public long Id { get; set; }
    public int StudentId { get; set; }
    public int TopicId { get; set; }
    public int InstituteId { get; set; }
    public decimal? Score { get; set; }
    public string? Note { get; set; }
    public int? UpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Student Student { get; set; } = null!;
    public SkillTopic Topic { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
    public Institute Institute { get; set; } = null!;
}
