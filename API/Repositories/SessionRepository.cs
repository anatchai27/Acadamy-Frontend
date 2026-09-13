using academy_API.Data;
using academy_API.Models;
using academy_API.Utilities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace academy_API.Repositories;

public interface ISessionRepository
{
    Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken ct = default);
    Task<Session> CreateAsync(Session session, CancellationToken ct = default);
    Task<bool> HasRoomOverlapAsync(int instituteId, string roomId, DateTime start, DateTime end, CancellationToken ct = default);
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
        if (!string.IsNullOrWhiteSpace(session.RoomId) && _context.Database.IsRelational())
            return await CreateWithRoomLockAsync(session, ct);

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync(ct);
        return session;
    }

    private async Task<Session> CreateWithRoomLockAsync(Session session, CancellationToken ct)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(ct);

        var lockName = BuildRoomLockName(session.InstituteId, session.RoomId!);
        await using var lockCommand = connection.CreateCommand();
        lockCommand.CommandText = "SELECT GET_LOCK(@lockName, 30)";
        var lockParameter = lockCommand.CreateParameter();
        lockParameter.ParameterName = "@lockName";
        lockParameter.Value = lockName;
        lockCommand.Parameters.Add(lockParameter);

        var lockResult = await lockCommand.ExecuteScalarAsync(ct);
        if (Convert.ToInt32(lockResult) != 1)
            throw new RoomBookingConflictException("ไม่สามารถล็อกห้องเรียนเพื่อตรวจสอบการจองได้");

        try
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            if (await HasRoomOverlapAsync(
                    session.InstituteId,
                    session.RoomId!,
                    session.ScheduledAt,
                    session.ScheduledAt.AddMinutes(session.DurationMin),
                    ct))
                throw new RoomBookingConflictException("ห้องเรียนมีคาบเรียนทับซ้อนในช่วงเวลานี้");

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return session;
        }
        finally
        {
            await using var releaseCommand = connection.CreateCommand();
            releaseCommand.CommandText = "SELECT RELEASE_LOCK(@lockName)";
            var releaseParameter = releaseCommand.CreateParameter();
            releaseParameter.ParameterName = "@lockName";
            releaseParameter.Value = lockName;
            releaseCommand.Parameters.Add(releaseParameter);
            await releaseCommand.ExecuteScalarAsync(CancellationToken.None);
        }
    }

    private static string BuildRoomLockName(int instituteId, string roomId)
    {
        var value = Encoding.UTF8.GetBytes($"{instituteId}:{roomId}");
        return $"academy-room-{Convert.ToHexString(SHA256.HashData(value))}";
    }

    public Task<bool> HasRoomOverlapAsync(int instituteId, string roomId, DateTime start, DateTime end, CancellationToken ct = default)
    {
        return _context.Sessions.AnyAsync(s =>
            s.InstituteId == instituteId &&
            s.RoomId == roomId &&
            s.Status != "cancelled" &&
            s.ScheduledAt < end &&
            s.ScheduledAt.AddMinutes(s.DurationMin) > start, ct);
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

public sealed class RoomBookingConflictException(string message) : Exception(message);
