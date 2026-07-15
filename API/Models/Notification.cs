namespace academy_API.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Channel { get; set; } = null!;
    public string Message { get; set; } = null!;
    public DateTime? SentAt { get; set; }
    public string Status { get; set; } = null!;

    public User User { get; set; } = null!;
}
