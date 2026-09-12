namespace academy_API.DTOs;

public sealed record LeaveRequestAttachmentResponse(
    long Id,
    long LeaveRequestId,
    string StorageUrl,
    string OriginalFileName,
    string ContentType,
    long FileSizeBytes,
    DateTime CreatedAt);
