namespace academy_API.Models;

public class Session
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMin { get; set; }
    public string? RoomId { get; set; }
    public string Status { get; set; } = null!;

    public Course Course { get; set; } = null!;
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
