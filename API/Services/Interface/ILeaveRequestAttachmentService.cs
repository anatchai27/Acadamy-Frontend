using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface ILeaveRequestAttachmentService
{
    Task<LeaveRequestAttachmentResponse> UploadAsync(long leaveRequestId, int userId, bool isParent, int instituteId, IFormFile file, CancellationToken ct = default);
}