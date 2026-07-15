namespace academy_API.Models;

public class SkillScore
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int TopicId { get; set; }
    public decimal Score { get; set; }
    public string? Note { get; set; }
    public int? UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public Student Student { get; set; } = null!;
    public SkillTopic Topic { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
}
