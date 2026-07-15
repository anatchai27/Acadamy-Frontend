namespace academy_API.Models;

public class MakeupCredit
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int CourseId { get; set; }
    public DateTime? GrantedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? UsedSessionId { get; set; }

    public Student Student { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public Session? UsedSession { get; set; }
}
