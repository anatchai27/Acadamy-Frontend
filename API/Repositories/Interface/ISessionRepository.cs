using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface ISessionRepository
{
    Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken ct = default);
    Task<Session> CreateAsync(Session session, CancellationToken ct = default);
    Task<bool> HasRoomOverlapAsync(int instituteId, string roomId, DateTime start, DateTime end, CancellationToken ct = default);
    Task<List<Session>> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task<Session?> GetByIdAsync(int id, CancellationToken ct = default);
}