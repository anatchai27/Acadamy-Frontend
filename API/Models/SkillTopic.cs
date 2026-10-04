namespace academy_API.Models;

public class SkillTopic
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Name { get; set; } = null!;
    public string? NameEn { get; set; }
    public int OrderIndex { get; set; }

    public Course Course { get; set; } = null!;
}
