namespace academy_API.DTOs;

public sealed record AuditLogResponse(
    long Id,
    int? UserId,
    string Action,
    string EntityType,
    string? EntityId,
    string? AfterJson,
    DateTime CreatedAt);
