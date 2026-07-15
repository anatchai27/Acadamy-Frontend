using academy_API.DTOs;

namespace academy_API.Services;

public interface ILeaveRequestService
{
    Task<LeaveRequestResponse> GetAllAsync(int? instituteId, string? status, int page, int limit, CancellationToken ct = default);
    Task ApproveAsync(int id, int? instituteId, int approvedByUserId, CancellationToken ct = default);
    Task RejectAsync(int id, int? instituteId, int approvedByUserId, CancellationToken ct = default);
}

public class LeaveRequestService(Repositories.ILeaveRequestRepository repository) : ILeaveRequestService
{
    private readonly Repositories.ILeaveRequestRepository _repository = repository;

    public async Task<LeaveRequestResponse> GetAllAsync(int? instituteId, string? status, int page, int limit, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 100);

        var (items, totalCount) = await _repository.SearchAsync(instituteId, status, page, limit, ct);
        var totalPages = (int)Math.Ceiling((double)totalCount / limit);

        return new LeaveRequestResponse(
            "success",
            new LeaveRequestData(
                items,
                new LeaveRequestPagination(page, totalPages, totalCount)
            )
        );
    }

    public async Task ApproveAsync(int id, int? instituteId, int approvedByUserId, CancellationToken ct = default)
    {
        var request = await _repository.GetByIdAsync(id, instituteId, ct)
            ?? throw new LeaveRequestValidationException("NOT_FOUND", "ไม่พบคำร้องขอ");

        if (request.Status != "pending")
            throw new LeaveRequestValidationException("INVALID_STATUS", $"ไม่สามารถอนุมัติคำร้องขอที่มีสถานะ '{request.Status}' ได้");

        await _repository.ApproveAsync(request, approvedByUserId, ct);
    }

    public async Task RejectAsync(int id, int? instituteId, int approvedByUserId, CancellationToken ct = default)
    {
        var request = await _repository.GetByIdAsync(id, instituteId, ct)
            ?? throw new LeaveRequestValidationException("NOT_FOUND", "ไม่พบคำร้องขอ");

        if (request.Status != "pending")
            throw new LeaveRequestValidationException("INVALID_STATUS", $"ไม่สามารถปฏิเสธคำร้องขอที่มีสถานะ '{request.Status}' ได้");

        await _repository.RejectAsync(request, approvedByUserId, ct);
    }
}

public class LeaveRequestValidationException : Exception
{
    public string ErrorCode { get; }
    public LeaveRequestValidationException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}
