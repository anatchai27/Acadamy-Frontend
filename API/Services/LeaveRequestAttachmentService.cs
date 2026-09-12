using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services.Interface;

namespace academy_API.Services;

public interface ILeaveRequestAttachmentService
{
    Task<LeaveRequestAttachmentResponse> UploadAsync(long leaveRequestId, int userId, bool isParent, int instituteId, IFormFile file, CancellationToken ct = default);
}

public sealed class LeaveRequestAttachmentService(
    ILeaveRequestRepository repository,
    IFileStorageService storage) : ILeaveRequestAttachmentService
{
    private const long MaxFileSize = 5 * 1024 * 1024;
    private static readonly HashSet<string> AllowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

    public async Task<LeaveRequestAttachmentResponse> UploadAsync(
        long leaveRequestId,
        int userId,
        bool isParent,
        int instituteId,
        IFormFile file,
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            throw new LeaveAttachmentValidationException("FILE_REQUIRED", "No file uploaded.");
        if (file.Length > MaxFileSize)
            throw new LeaveAttachmentValidationException("FILE_TOO_LARGE", "File size must not exceed 5MB.");
        if (!AllowedTypes.Contains(file.ContentType.ToLowerInvariant()))
            throw new LeaveAttachmentValidationException("FILE_TYPE_NOT_ALLOWED", "Only PDF, JPEG, PNG and WEBP files are allowed.");
        if (!await repository.CanAccessAsync(leaveRequestId, userId, isParent, ct))
            throw new LeaveAttachmentValidationException("FORBIDDEN", "You cannot attach a file to this leave request.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var objectKey = $"leave-attachments/{instituteId}/{leaveRequestId}/{Guid.NewGuid():N}{extension}";
        await using var stream = file.OpenReadStream();
        var storageUrl = await storage.UploadAsync(stream, objectKey, file.ContentType, ct);
        var attachment = await repository.AddAttachmentAsync(new LeaveRequestAttachment
        {
            InstituteId = instituteId,
            LeaveRequestId = leaveRequestId,
            StorageUrl = storageUrl,
            ObjectKey = objectKey,
            OriginalFileName = Path.GetFileName(file.FileName),
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            UploadedBy = userId,
            CreatedAt = DateTime.UtcNow
        }, ct);

        return new LeaveRequestAttachmentResponse(
            attachment.Id,
            attachment.LeaveRequestId,
            attachment.StorageUrl,
            attachment.OriginalFileName ?? string.Empty,
            attachment.ContentType,
            attachment.FileSizeBytes,
            attachment.CreatedAt);
    }
}

public sealed class LeaveAttachmentValidationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
