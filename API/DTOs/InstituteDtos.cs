namespace academy_API.DTOs;

public record UpdateInstituteRequest(string? Name, string? ContactPhone);

public record InstituteResponse(
    int Id,
    string Name,
    string? LogoUrl,
    string? ContactPhone,
    bool IsActive);
