namespace academy_API.Models;

public class LeaveRequestAttachment : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public long LeaveRequestId { get; set; }
    public string StorageUrl { get; set; } = null!;
    public string ObjectKey { get; set; } = null!;
    public string? OriginalFileName { get; set; }
    public string ContentType { get; set; } = null!;
    public long FileSizeBytes { get; set; }
    public int? UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; }

    public LeaveRequest LeaveRequest { get; set; } = null!;
    public Institute Institute { get; set; } = null!;
    public User? UploadedByUser { get; set; }
}
