namespace academy_API.DTOs;

public sealed record CreateLeaveRequestRequest(int SessionId, string Reason);

public sealed record LeaveRequestCreatedResponse(
    long Id,
    int StudentId,
    int SessionId,
    string Type,
    string Status,
    string? Reason,
    DateTime RequestedAt
);

public sealed record LeaveDecisionResponse(
    string Status,
    LeaveRequestItem LeaveRequest,
    MakeupCreditResponse? MakeupCredit
);
