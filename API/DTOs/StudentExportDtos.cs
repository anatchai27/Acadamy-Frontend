namespace academy_API.DTOs;

public sealed record StudentExportRow(
    int Id,
    string FullName,
    string? Nickname,
    string? Grade,
    string? School,
    string? PrimaryParentName,
    string? PrimaryParentPhone,
    string? MedicalInfo,
    string? PhotoUrl);
