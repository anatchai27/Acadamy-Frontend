using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IAttendanceRepository
{
    Task<Student?> ValidateQrTokenAsync(string qrToken, CancellationToken ct = default);
    Task<bool> IsDuplicateScanAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task<Attendance> RecordCheckinAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task<int> DecrementSessionsAsync(int studentId, CancellationToken ct = default);
    Task<Attendance> RecordManualAsync(int sessionId, int studentId, string status, CancellationToken ct = default);
    Task<List<DailyAttendanceRow>> GetDailyAttendanceAsync(int? sessionId, DateTime date, CancellationToken ct = default);
    Task<Session?> GetSessionByIdAsync(int sessionId, CancellationToken ct = default);
    Task<List<Parent>> GetParentsWithLineAsync(int studentId, CancellationToken ct = default);
    Task ScanCheckinWithTransactionAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task ManualCheckinWithTransactionAsync(int studentId, int sessionId, string status, CancellationToken ct = default);
}

public class AttendanceRepository(TutoringDbContext context) : IAttendanceRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<Student?> ValidateQrTokenAsync(string qrToken, CancellationToken ct = default)
    {
        return await _context.Students.FirstOrDefaultAsync(s => s.QrToken == qrToken, ct);
    }

    public async Task<bool> IsDuplicateScanAsync(int studentId, int sessionId, CancellationToken ct = default)
    {
        return await _context.Attendances.AnyAsync(a =>
            a.StudentId == studentId && a.SessionId == sessionId, ct);
    }

    public async Task<Attendance> RecordCheckinAsync(int studentId, int sessionId, CancellationToken ct = default)
    {
        var attendance = new Attendance
        {
            StudentId = studentId,
            SessionId = sessionId,
            Status = "present",
            CheckinAt = DateTime.UtcNow
        };
        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync(ct);
        return attendance;
    }

    public async Task<int> DecrementSessionsAsync(int studentId, CancellationToken ct = default)
    {
        var activeEnrollments = await _context.Enrollments
            .Where(e => e.StudentId == studentId && e.SessionsRemaining > 0)
            .ToListAsync(ct);

        foreach (var enrollment in activeEnrollments)
        {
            enrollment.SessionsRemaining--;
        }

        await _context.SaveChangesAsync(ct);
        return activeEnrollments.Sum(e => e.SessionsRemaining);
    }

    public async Task<Attendance> RecordManualAsync(int sessionId, int studentId, string status, CancellationToken ct = default)
    {
        var attendance = new Attendance
        {
            StudentId = studentId,
            SessionId = sessionId,
            Status = status,
            CheckinAt = status == "present" || status == "late" ? DateTime.UtcNow : null
        };
        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync(ct);
        return attendance;
    }

    public async Task<List<DailyAttendanceRow>> GetDailyAttendanceAsync(int? sessionId, DateTime date, CancellationToken ct = default)
    {
        var query = _context.Attendances
            .Include(a => a.Student)
            .AsQueryable();

        if (sessionId.HasValue)
            query = query.Where(a => a.SessionId == sessionId.Value);

        if (date != default)
            query = query.Where(a => a.CheckinAt != null && a.CheckinAt.Value.Date == date);

        return await query
            .OrderBy(a => a.Student.FullName)
            .Select(a => new DailyAttendanceRow(
                a.Student.Id,
                a.Student.FullName,
                a.Student.Nickname,
                a.Status,
                a.CheckinAt,
                a.CheckoutAt,
                a.PickedUpBy
            ))
            .ToListAsync(ct);
    }

    public async Task<Session?> GetSessionByIdAsync(int sessionId, CancellationToken ct = default)
    {
        return await _context.Sessions
            .Include(s => s.Course)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);
    }

    public async Task<List<Parent>> GetParentsWithLineAsync(int studentId, CancellationToken ct = default)
    {
        return await _context.Parents
            .Where(p => p.StudentId == studentId && p.LineUserId != null)
            .ToListAsync(ct);
    }

    public async Task ScanCheckinWithTransactionAsync(int studentId, int sessionId, CancellationToken ct = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);

            var attendance = new Attendance
            {
                StudentId = studentId,
                SessionId = sessionId,
                Status = "present",
                CheckinAt = DateTime.UtcNow,
                InstituteId = await _context.Sessions
                    .Where(s => s.Id == sessionId)
                    .Select(s => s.InstituteId)
                    .FirstAsync(ct)
            };
            _context.Attendances.Add(attendance);

            var session = await _context.Sessions
                .Include(s => s.Course)
                .FirstAsync(s => s.Id == sessionId, ct);

            switch (session.Course.CourseType)
            {
                case "group":
                case "private":
                case null:
                {
                    var activeEnrollments = await _context.Enrollments
                        .Where(e => e.StudentId == studentId && e.CourseId == session.CourseId && e.SessionsRemaining > 0)
                        .ToListAsync(ct);
                    foreach (var enrollment in activeEnrollments)
                        enrollment.SessionsRemaining--;
                    break;
                }
                case "subscription":
                {
                    var active = await _context.Enrollments
                        .AnyAsync(e => e.StudentId == studentId && e.CourseId == session.CourseId
                            && e.ExpiresAt > DateTime.UtcNow, ct);
                    if (!active)
                        throw new AttendanceValidationException("SUBSCRIPTION_EXPIRED",
                            "คอร์สบุฟเฟต์หมดอายุแล้ว");
                    break;
                }
                case "credit":
                {
                    var course = session.Course;
                    if (course.CreditCost is null or <= 0)
                        throw new AttendanceValidationException("CREDIT_COST_INVALID",
                            "คอร์สเครดิตไม่ได้กำหนดค่า Credit Cost");

                    var wallet = await _context.StudentWallets
                        .FromSqlRaw("SELECT * FROM student_wallets WHERE student_id = {0} AND institute_id = {1} FOR UPDATE", studentId, course.InstituteId)
                        .FirstOrDefaultAsync(ct);

                    if (wallet is null || wallet.Balance < course.CreditCost.Value)
                        throw new AttendanceValidationException("INSUFFICIENT_CREDITS",
                            "เครดิตในกระเป๋าไม่เพียงพอ");

                    wallet.Balance -= course.CreditCost.Value;
                    wallet.UpdatedAt = DateTime.UtcNow;

                    _context.WalletTransactions.Add(new WalletTransaction
                    {
                        InstituteId = course.InstituteId,
                        WalletId = wallet.Id,
                        Amount = -course.CreditCost.Value,
                        TransactionType = "debit",
                        RunningBalance = wallet.Balance,
                        ReferenceType = "session",
                        ReferenceId = sessionId,
                        Description = $"ใช้เครดิตเข้าเรียน: {course.Name}",
                        IsReversed = false,
                        CreatedAt = DateTime.UtcNow
                    });
                    break;
                }
                case "video":
                    break;
            }

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        });
    }

    public async Task ManualCheckinWithTransactionAsync(int studentId, int sessionId, string status, CancellationToken ct = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);

            var attendance = new Attendance
            {
                StudentId = studentId,
                SessionId = sessionId,
                Status = status,
                CheckinAt = status == "present" || status == "late" ? DateTime.UtcNow : null,
                InstituteId = await _context.Sessions
                    .Where(s => s.Id == sessionId)
                    .Select(s => s.InstituteId)
                    .FirstAsync(ct)
            };
            _context.Attendances.Add(attendance);

            if (status == "present" || status == "late")
            {
                var session = await _context.Sessions
                    .Include(s => s.Course)
                    .FirstAsync(s => s.Id == sessionId, ct);

                switch (session.Course.CourseType)
                {
                    case "group":
                    case "private":
                    case null:
                    {
                        var activeEnrollments = await _context.Enrollments
                            .Where(e => e.StudentId == studentId && e.CourseId == session.CourseId && e.SessionsRemaining > 0)
                            .ToListAsync(ct);
                        foreach (var enrollment in activeEnrollments)
                            enrollment.SessionsRemaining--;
                        break;
                    }
                    case "subscription":
                    {
                        var active = await _context.Enrollments
                            .AnyAsync(e => e.StudentId == studentId && e.CourseId == session.CourseId
                                && e.ExpiresAt > DateTime.UtcNow, ct);
                        if (!active)
                            throw new AttendanceValidationException("SUBSCRIPTION_EXPIRED",
                                "คอร์สบุฟเฟต์หมดอายุแล้ว");
                        break;
                    }
                    case "credit":
                    {
                        var course = session.Course;
                        if (course.CreditCost is null or <= 0)
                            throw new AttendanceValidationException("CREDIT_COST_INVALID",
                                "คอร์สเครดิตไม่ได้กำหนดค่า Credit Cost");

                        var wallet = await _context.StudentWallets
                            .FromSqlRaw("SELECT * FROM student_wallets WHERE student_id = {0} AND institute_id = {1} FOR UPDATE", studentId, course.InstituteId)
                            .FirstOrDefaultAsync(ct);

                        if (wallet is null || wallet.Balance < course.CreditCost.Value)
                            throw new AttendanceValidationException("INSUFFICIENT_CREDITS",
                                "เครดิตในกระเป๋าไม่เพียงพอ");

                        wallet.Balance -= course.CreditCost.Value;
                        wallet.UpdatedAt = DateTime.UtcNow;

                        _context.WalletTransactions.Add(new WalletTransaction
                        {
                            InstituteId = course.InstituteId,
                            WalletId = wallet.Id,
                            Amount = -course.CreditCost.Value,
                            TransactionType = "debit",
                            RunningBalance = wallet.Balance,
                            ReferenceType = "session",
                            ReferenceId = sessionId,
                            Description = $"ใช้เครดิตเข้าเรียน: {course.Name}",
                            IsReversed = false,
                            CreatedAt = DateTime.UtcNow
                        });
                        break;
                    }
                    case "video":
                        break;
                }
            }

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        });
    }
}
