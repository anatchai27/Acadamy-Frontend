namespace academy_API.Models;

public class Session : IMultiTenantEntity
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public int InstituteId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMin { get; set; }
    public string? RoomId { get; set; }
    public string Status { get; set; } = null!;
    public int? SubstituteTeacherId { get; set; }
    public DateTime? ActualStartAt { get; set; }
    public DateTime? ActualEndAt { get; set; }

    public Course Course { get; set; } = null!;
    public Institute Institute { get; set; } = null!;
    public Teacher? SubstituteTeacher { get; set; }
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
