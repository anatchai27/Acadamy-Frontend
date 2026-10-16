using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface ITeacherService
{
    Task<List<TeacherResponse>> ListAsync(string? search, CancellationToken ct = default);
    Task<TeacherResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TeacherResponse> CreateAsync(CreateTeacherRequest request, int instituteId, CancellationToken ct = default);
    Task<PatchTeacherResult> PatchAsync(int id, PatchTeacherRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}