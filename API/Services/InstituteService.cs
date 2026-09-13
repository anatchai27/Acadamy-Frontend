using academy_API.DTOs;
using academy_API.Repositories;

namespace academy_API.Services;

public interface IInstituteService
{
    Task<InstituteResponse?> GetMeAsync(int instituteId, CancellationToken cancellationToken = default);
    Task<bool> UpdateMeAsync(int instituteId, UpdateInstituteRequest request, CancellationToken cancellationToken = default);
}

public sealed class InstituteService(IInstituteRepository repository) : IInstituteService
{
    public async Task<InstituteResponse?> GetMeAsync(int instituteId, CancellationToken cancellationToken = default)
    {
        var institute = await repository.GetByIdAsync(instituteId, cancellationToken);
        return institute is null ? null : MapToResponse(institute);
    }

    public async Task<bool> UpdateMeAsync(int instituteId, UpdateInstituteRequest request, CancellationToken cancellationToken = default)
    {
        var institute = await repository.GetByIdAsync(instituteId, cancellationToken);
        if (institute is null) return false;

        if (request.Name is not null) institute.Name = request.Name;
        if (request.ContactPhone is not null) institute.ContactPhone = request.ContactPhone;
        institute.UpdatedAt = DateTime.UtcNow;

        return await repository.UpdateAsync(institute, cancellationToken);
    }

    private static InstituteResponse MapToResponse(Models.Institute institute) =>
        new(institute.Id, institute.Name, institute.LogoUrl, institute.ContactPhone, institute.IsActive);
}
