using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IStudentPickupRepository
{
    Task<bool> StudentExistsAsync(int studentId, CancellationToken ct);
    Task<List<StudentPickupAuthorization>> ListAsync(int studentId, CancellationToken ct);
    Task<StudentPickupAuthorization> AddAsync(StudentPickupAuthorization authorization, CancellationToken ct);
    Task<StudentPickupAuthorization?> GetAsync(int studentId, long authorizationId, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}