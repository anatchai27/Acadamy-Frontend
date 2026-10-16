using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IStudentPickupService
{
    Task<IReadOnlyList<PickupAuthorizationResponse>> ListAsync(int studentId, CancellationToken ct);
    Task<PickupAuthorizationResponse> CreateAsync(int studentId, CreatePickupAuthorizationRequest request, int? actorId, CancellationToken ct);
    Task<PickupAuthorizationResponse> UpdateAsync(int studentId, long authorizationId, UpdatePickupAuthorizationRequest request, CancellationToken ct);
    Task DeleteAsync(int studentId, long authorizationId, CancellationToken ct);
}