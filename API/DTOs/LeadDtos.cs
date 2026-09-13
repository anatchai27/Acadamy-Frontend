namespace academy_API.DTOs;

public sealed record CreateLeadRequest(
    string InstituteSlug,
    string ContactName,
    string Phone,
    string? Email,
    string? StudentName,
    string? CourseInterest,
    string? Message
);

public sealed record CreateLeadResponse(long Id, string Status);

public sealed record LeadListItem(
    long Id,
    string FullName,
    string Phone,
    string? Email,
    string? StudentName,
    string Status,
    int? AssignedTo,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record LeadListResponse(string Status, List<LeadListItem> Leads);
public sealed record UpdateLeadFollowUpRequest(string Status, string? Notes, int? AssignedTo);
