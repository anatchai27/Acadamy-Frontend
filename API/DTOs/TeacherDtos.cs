namespace academy_API.DTOs;

public record CreateTeacherRequest(
    string FullName,
    string? Specialization,
    string? Bio,
    decimal? HourlyRate,
    string? PhotoUrl,
    string? BankAccountInfo,
    string? TaxId,
    string? Status,
    string? UserEmail,
    string? UserPassword,
    string? UserRole
);

public record PatchTeacherRequest(
    string? FullName,
    string? Specialization,
    string? Bio,
    decimal? HourlyRate,
    string? PhotoUrl,
    string? BankAccountInfo,
    string? TaxId,
    string? Status
);

public record TeacherResponse(
    int Id,
    int InstituteId,
    int? UserId,
    string FullName,
    string? Specialization,
    string? Bio,
    decimal? HourlyRate,
    string? PhotoUrl,
    string? BankAccountInfo,
    string? TaxId,
    string? Status,
    string? UserEmail
);
