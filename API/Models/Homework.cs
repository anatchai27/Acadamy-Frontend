namespace academy_API.Models;

public class Homework
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? FileUrl { get; set; }
    public DateTime DueAt { get; set; }
    public int? AssignedBy { get; set; }

    public Course Course { get; set; } = null!;
    public Teacher? AssignedByTeacher { get; set; }
}
