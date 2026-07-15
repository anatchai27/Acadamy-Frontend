namespace academy_API.Models;

public class HomeworkSubmission
{
    public int Id { get; set; }
    public int HomeworkId { get; set; }
    public int StudentId { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? FileUrl { get; set; }
    public decimal? Score { get; set; }
    public string? Feedback { get; set; }

    public Homework Homework { get; set; } = null!;
    public Student Student { get; set; } = null!;
}
