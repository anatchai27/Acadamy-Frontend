using academy_API.DTOs;

namespace academy_API.Services.Contracts;

public interface IStudentService
{
    Task<StudentListResponse> GetAllAsync(string? search, int page, int limit, CancellationToken ct = default);
    Task<StudentProfileResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CreateStudentResponse> CreateAsync(CreateStudentRequest request, int instituteId, string? ipAddress, CancellationToken ct = default);
    Task<UpdateStudentResponse> UpdateAsync(int id, UpdateStudentRequest request, CancellationToken ct = default);
    Task<QrTokenResponse> GetQrTokenAsync(int id, CancellationToken ct = default);
}
