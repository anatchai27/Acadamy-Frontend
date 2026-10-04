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
    string? UserRole,
    string? SpecializationEn = null,
    string? BioEn = null
);

public record PatchTeacherRequest(
    string? FullName,
    string? Specialization,
    string? Bio,
    decimal? HourlyRate,
    string? PhotoUrl,
    string? BankAccountInfo,
    string? TaxId,
    string? Status,
    string? SpecializationEn = null,
    string? BioEn = null
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
    string? UserEmail,
    string? SpecializationEn = null,
    string? BioEn = null
);
