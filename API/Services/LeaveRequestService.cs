using academy_API.DTOs;

namespace academy_API.Services;

public interface ILeaveRequestService
{
    Task<LeaveRequestResponse> GetAllAsync(string? status, int page, int limit, CancellationToken ct = default);
    Task<LeaveRequestCreatedResponse> CreateAsync(int studentId, int instituteId, CreateLeaveRequestRequest request, CancellationToken ct = default);
    Task<LeaveDecisionResponse> ApproveAsync(long id, int approvedByUserId, CancellationToken ct = default);
    Task<LeaveDecisionResponse> RejectAsync(long id, int approvedByUserId, CancellationToken ct = default);
}

public class LeaveRequestService(Repositories.ILeaveRequestRepository repository) : ILeaveRequestService
{
    private readonly Repositories.ILeaveRequestRepository _repository = repository;

    public async Task<LeaveRequestResponse> GetAllAsync(string? status, int page, int limit, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 100);

        var (items, totalCount) = await _repository.SearchAsync(status, page, limit, ct);
        var totalPages = (int)Math.Ceiling((double)totalCount / limit);

        return new LeaveRequestResponse(
            "success",
            new LeaveRequestData(
                items,
                new LeaveRequestPagination(page, totalPages, totalCount)
            )
        );
    }

    public async Task<LeaveRequestCreatedResponse> CreateAsync(int studentId, int instituteId, CreateLeaveRequestRequest request, CancellationToken ct = default)
    {
        if (request.SessionId <= 0 || string.IsNullOrWhiteSpace(request.Reason))
            throw new LeaveRequestValidationException("INVALID_INPUT", "sessionId and reason are required.");

        var session = await _repository.GetSessionForStudentAsync(studentId, request.SessionId, ct)
            ?? throw new LeaveRequestValidationException("INVALID_SESSION", "ไม่พบ session ของนักเรียนคนนี้");

        var now = DateTime.UtcNow;
        var type = session.ScheduledAt <= now
            ? "absence"
            : session.ScheduledAt - now >= TimeSpan.FromHours(24)
                ? "advance"
                : "urgent";

        var created = await _repository.CreateAsync(new Models.LeaveRequest
        {
            StudentId = studentId,
            SessionId = request.SessionId,
            InstituteId = instituteId,
            Type = type,
            Reason = request.Reason.Trim(),
            Status = "pending",
            RequestedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        }, ct);

        return new LeaveRequestCreatedResponse(created!.Id, created.StudentId, created.SessionId,
            created.Type, created.Status, created.Reason, created.RequestedAt!.Value);
    }

    public async Task<LeaveDecisionResponse> ApproveAsync(long id, int approvedByUserId, CancellationToken ct = default)
    {
        var request = await _repository.GetByIdAsync(id, ct)
            ?? throw new LeaveRequestValidationException("NOT_FOUND", "ไม่พบคำร้องขอ");

        if (request.Status != "pending")
            throw new LeaveRequestValidationException("INVALID_STATUS", $"ไม่สามารถอนุมัติคำร้องขอที่มีสถานะ '{request.Status}' ได้");

        var result = await _repository.ApproveAsync(request, approvedByUserId, ct);
        return ToDecisionResponse(result.Request, result.Credit, "approved");
    }

    public async Task<LeaveDecisionResponse> RejectAsync(long id, int approvedByUserId, CancellationToken ct = default)
    {
        var request = await _repository.GetByIdAsync(id, ct)
            ?? throw new LeaveRequestValidationException("NOT_FOUND", "ไม่พบคำร้องขอ");

        if (request.Status != "pending")
            throw new LeaveRequestValidationException("INVALID_STATUS", $"ไม่สามารถปฏิเสธคำร้องขอที่มีสถานะ '{request.Status}' ได้");

        await _repository.RejectAsync(request, approvedByUserId, ct);
        return ToDecisionResponse(request, null, "rejected");
    }

    private static LeaveDecisionResponse ToDecisionResponse(Models.LeaveRequest request, Models.MakeupCredit? credit, string status) =>
        new(status, new LeaveRequestItem(request.Id, request.StudentId, request.Student.FullName,
            request.SessionId, request.Session.ScheduledAt, request.Reason, request.Type,
            request.Status, request.RequestedAt), credit is null ? null : new MakeupCreditResponse(
                credit.Id, credit.StudentId, credit.CourseId, credit.Status, credit.ExpiresAt));
}

public class LeaveRequestValidationException : Exception
{
    public string ErrorCode { get; }
    public LeaveRequestValidationException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}