namespace academy_API.Models;

public class HomeworkSkillTopic : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public int HomeworkId { get; set; }
    public int TopicId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Institute Institute { get; set; } = null!;
    public Homework Homework { get; set; } = null!;
    public SkillTopic Topic { get; set; } = null!;
}
