using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IInstituteService
{
    Task<InstituteResponse?> GetMeAsync(int instituteId, CancellationToken cancellationToken = default);
    Task<bool> UpdateMeAsync(int instituteId, UpdateInstituteRequest request, CancellationToken cancellationToken = default);
}