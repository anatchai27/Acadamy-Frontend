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
