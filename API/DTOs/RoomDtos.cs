namespace academy_API.DTOs;

public sealed record CreateRoomRequest(string Name, string? Description, bool IsActive = true, string? NameEn = null, string? DescriptionEn = null);
public sealed record UpdateRoomRequest(string Name, string? Description, bool IsActive, string? NameEn = null, string? DescriptionEn = null);
public sealed record RoomResponse(int Id, int InstituteId, string Name, string? Description, bool IsActive, DateTime CreatedAt, DateTime UpdatedAt, string? NameEn = null, string? DescriptionEn = null);
