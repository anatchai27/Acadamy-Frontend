namespace academy_API.Models;

public class Notification : IMultiTenantEntity
{
    public long Id { get; set; }
    public int UserId { get; set; }
    public int InstituteId { get; set; }
    public string Channel { get; set; } = null!;
    public string Message { get; set; } = null!;
    public DateTime? SentAt { get; set; }
    public string Status { get; set; } = null!;
    public string? Payload { get; set; }
    public string? RecipientId { get; set; }
    public int RetryCount { get; set; }
    public int MaxRetries { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? NotificationType { get; set; }

    public User User { get; set; } = null!;
    public Institute Institute { get; set; } = null!;
}
