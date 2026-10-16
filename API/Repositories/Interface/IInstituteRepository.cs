namespace academy_API.Repositories.Interface;

public interface IInstituteRepository
{
    Task<Models.Institute?> GetByIdAsync(int instituteId, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Models.Institute institute, CancellationToken cancellationToken = default);
}