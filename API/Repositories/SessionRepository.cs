using academy_API.Data;
using academy_API.Models;
using academy_API.Utilities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace academy_API.Repositories;

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
        if (connection.State != System.Data.ConnectionState.Open)
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
            // The retrying MySQL strategy requires the user transaction to run
            // inside its execution delegate so the whole unit can be retried.
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
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
            });
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
        // MySQL GET_LOCK names are limited to 64 characters.
        var hash = Convert.ToHexString(SHA256.HashData(value));
        return $"academy-room-{hash[..51]}";
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

    public Task<bool> HasRoomOverlapExcludingAsync(int instituteId, string roomId, DateTime start, DateTime end, int excludingSessionId, CancellationToken ct = default)
    {
        return _context.Sessions.AnyAsync(s =>
            s.InstituteId == instituteId &&
            s.Id != excludingSessionId &&
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

    public Task<bool> HasAttendanceAsync(int sessionId, CancellationToken ct = default) =>
        _context.Attendances.AnyAsync(attendance => attendance.SessionId == sessionId, ct);

    public async Task UpdateAsync(Session session, CancellationToken ct = default)
    {
        _context.Sessions.Update(session);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<(int CancelledCount, int PreservedCount)> ReplaceFutureSessionsAsync(
        int courseId,
        int instituteId,
        DateTime from,
        IReadOnlyCollection<Session> replacementSessions,
        CancellationToken ct = default)
    {
        var lockNames = replacementSessions
            .Where(session => !string.IsNullOrWhiteSpace(session.RoomId))
            .Select(session => BuildRoomLockName(instituteId, session.RoomId!))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToArray();
        var connection = _context.Database.GetDbConnection();
        var acquiredLocks = new List<string>();

        if (lockNames.Length > 0 && _context.Database.IsRelational())
        {
            if (connection.State != System.Data.ConnectionState.Open)
                await connection.OpenAsync(ct);

            try
            {
                foreach (var lockName in lockNames)
                {
                    await using var lockCommand = connection.CreateCommand();
                    lockCommand.CommandText = "SELECT GET_LOCK(@lockName, 30)";
                    var lockParameter = lockCommand.CreateParameter();
                    lockParameter.ParameterName = "@lockName";
                    lockParameter.Value = lockName;
                    lockCommand.Parameters.Add(lockParameter);

                    if (Convert.ToInt32(await lockCommand.ExecuteScalarAsync(ct)) != 1)
                        throw new RoomBookingConflictException("ไม่สามารถล็อกห้องเรียนเพื่อตรวจสอบการจองได้");
                    acquiredLocks.Add(lockName);
                }

                return await ReplaceFutureSessionsWithTransactionAsync(courseId, instituteId, from, replacementSessions, ct);
            }
            finally
            {
                foreach (var lockName in acquiredLocks.AsEnumerable().Reverse())
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
        }

        return await ReplaceFutureSessionsWithTransactionAsync(courseId, instituteId, from, replacementSessions, ct);
    }

    private async Task<(int CancelledCount, int PreservedCount)> ReplaceFutureSessionsWithTransactionAsync(
        int courseId,
        int instituteId,
        DateTime from,
        IReadOnlyCollection<Session> replacementSessions,
        CancellationToken ct)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            var futureSessions = await _context.Sessions
                .Where(session => session.CourseId == courseId
                    && session.InstituteId == instituteId
                    && session.Status == "scheduled"
                    && session.ScheduledAt >= from)
                .ToListAsync(ct);
            var futureSessionIds = futureSessions.Select(session => session.Id).ToArray();
            var attendedSessionIds = futureSessionIds.Length == 0
                ? new HashSet<int>()
                : await _context.Attendances
                    .Where(attendance => futureSessionIds.Contains(attendance.SessionId))
                    .Select(attendance => attendance.SessionId)
                    .Distinct()
                    .ToHashSetAsync(ct);

            var sessionsToCancel = futureSessions.Where(session => !attendedSessionIds.Contains(session.Id)).ToList();
            foreach (var session in sessionsToCancel)
                session.Status = "cancelled";
            await _context.SaveChangesAsync(ct);

            foreach (var session in replacementSessions)
            {
                if (string.IsNullOrWhiteSpace(session.RoomId)) continue;
                if (await HasRoomOverlapAsync(
                        instituteId,
                        session.RoomId,
                        session.ScheduledAt,
                        session.ScheduledAt.AddMinutes(session.DurationMin),
                        ct))
                    throw new RoomBookingConflictException("ห้องเรียนมีคาบเรียนทับซ้อนในช่วงเวลานี้");
            }

            _context.Sessions.AddRange(replacementSessions);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return (sessionsToCancel.Count, attendedSessionIds.Count);
        });
    }
}

public sealed class RoomBookingConflictException(string message) : Exception(message);
