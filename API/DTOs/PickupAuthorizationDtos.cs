namespace academy_API.DTOs;

public sealed record CreatePickupAuthorizationRequest(string FullName, string? Phone, string Relationship, string? IdCardLast4);
public sealed record UpdatePickupAuthorizationRequest(string? FullName, string? Phone, string? Relationship, string? IdCardLast4, bool? IsActive);
public sealed record PickupAuthorizationResponse(long Id, int StudentId, string FullName, string? Phone, string? Relationship, string? IdCardLast4, bool IsActive);
