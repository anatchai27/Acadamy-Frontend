using academy_API.Data;
using academy_API.Models;
using academy_API.Utilities;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface ISessionRepository
{
    Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken ct = default);
    Task<Session> CreateAsync(Session session, CancellationToken ct = default);
    Task<List<Session>> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task<Session?> GetByIdAsync(int id, CancellationToken ct = default);
}

public class SessionRepository(TutoringDbContext context) : ISessionRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken ct = default)
    {
        return await _context.Courses.FirstOrDefaultAsync(c => c.Id == courseId, ct);
    }

    public async Task<Session> CreateAsync(Session session, CancellationToken ct = default)
    {
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync(ct);
        return session;
    }

    public async Task<List<Session>> GetByCourseIdAsync(int courseId, CancellationToken ct = default)
    {
        return await _context.Sessions
            .Include(s => s.Course)
            .Where(s => s.CourseId == courseId)
            .OrderBy(s => s.ScheduledAt)
            .ToListAsync(ct);
    }

    public async Task<Session?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.Sessions
            .Include(s => s.Course)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
    }
}
