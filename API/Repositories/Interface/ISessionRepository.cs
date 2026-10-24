using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface ISessionRepository
{
    Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken ct = default);
    Task<Session> CreateAsync(Session session, CancellationToken ct = default);
    Task<bool> HasRoomOverlapAsync(int instituteId, string roomId, DateTime start, DateTime end, CancellationToken ct = default);
    Task<bool> HasRoomOverlapExcludingAsync(int instituteId, string roomId, DateTime start, DateTime end, int excludingSessionId, CancellationToken ct = default);
    Task<List<Session>> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task<Session?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<bool> HasAttendanceAsync(int sessionId, CancellationToken ct = default);
    Task UpdateAsync(Session session, CancellationToken ct = default);
    Task<(int CancelledCount, int PreservedCount)> ReplaceFutureSessionsAsync(
        int courseId,
        int instituteId,
        DateTime from,
        IReadOnlyCollection<Session> replacementSessions,
        CancellationToken ct = default);
}