using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface ILeaveRequestService
{
    Task<LeaveRequestResponse> GetAllAsync(string? status, int page, int limit, CancellationToken ct = default);
    Task<LeaveRequestCreatedResponse> CreateAsync(int studentId, int instituteId, CreateLeaveRequestRequest request, CancellationToken ct = default);
    Task<LeaveDecisionResponse> ApproveAsync(long id, int approvedByUserId, CancellationToken ct = default);
    Task<LeaveDecisionResponse> RejectAsync(long id, int approvedByUserId, CancellationToken ct = default);
}