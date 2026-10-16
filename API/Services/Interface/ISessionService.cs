using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface ISessionService
{
    Task<SessionListResponse> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task<CreateSessionResponse> CreateAsync(int courseId, CreateSessionRequest request, int instituteId, CancellationToken ct = default);
    Task<CreateRecurringSessionsResponse> CreateRecurringAsync(int courseId, CreateRecurringSessionsRequest request, int instituteId, CancellationToken ct = default);
}