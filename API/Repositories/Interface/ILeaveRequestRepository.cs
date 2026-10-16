using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface ILeaveRequestRepository
{
    Task<(List<LeaveRequestItem> Items, int TotalCount)> SearchAsync(string? status, int page, int limit, CancellationToken ct = default);
    Task<LeaveRequest?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<bool> CanAccessAsync(long leaveRequestId, int userId, bool isParent, CancellationToken ct = default);
    Task<LeaveRequestAttachment> AddAttachmentAsync(LeaveRequestAttachment attachment, CancellationToken ct = default);
    Task<Session?> GetSessionForStudentAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task<LeaveRequest?> CreateAsync(LeaveRequest request, CancellationToken ct = default);
    Task<(LeaveRequest Request, MakeupCredit? Credit)> ApproveAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default);
    Task RejectAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default);
}