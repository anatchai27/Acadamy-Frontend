using academy_API.Data;
using academy_API.Models;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IParentRepository
{
    Task<Parent?> FindByLineUserAsync(string lineUserId, CancellationToken ct = default);
    Task<Parent?> FindByPhoneAsync(string phone, CancellationToken ct = default);
    Task<Parent?> FindByUserIdAsync(int userId, CancellationToken ct = default);
    Task<User?> FindUserByIdAsync(int userId, CancellationToken ct = default);
    Task<User?> FindUserByPhoneAsync(string phone, CancellationToken ct = default);
    Task<User> CreateUserAsync(User user, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
    Task<List<ChildSummary>> GetChildrenAsync(int userId, CancellationToken ct = default);
    Task<ParentDashboardSnapshot> GetDashboardAsync(int userId, CancellationToken ct = default);
    Task<List<AttendanceRecord>> GetAttendanceAsync(int studentId, CancellationToken ct = default);
    Task<List<PaymentListItem>> GetPaymentsAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentSkillScoreItem>> GetScoresAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentHomeworkItem>> GetHomeworkAsync(int studentId, CancellationToken ct = default);
    Task<ParentProgressResponse> GetProgressAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentLeaveRequestItem>> GetLeaveRequestsAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentSessionItem>> GetSessionsAsync(int studentId, DateTime from, CancellationToken ct = default);
    Task<bool> IsParentOfStudentAsync(int userId, int studentId, CancellationToken ct = default);
    Task<HomeworkSubmission?> CreateOrGetHomeworkSubmissionAsync(int userId, int studentId, int homeworkId, CancellationToken ct = default);
    Task<bool> IsParentOfHomeworkSubmissionAsync(int userId, int submissionId, CancellationToken ct = default);
}

public sealed class ParentRepository(TutoringDbContext context) : IParentRepository
{
    private readonly TutoringDbContext _context = context;

    public Task<Parent?> FindByLineUserAsync(string lineUserId, CancellationToken ct = default) =>
        _context.Parents.Include(p => p.Student).FirstOrDefaultAsync(p => p.LineUserId == lineUserId, ct);

    public Task<Parent?> FindByPhoneAsync(string phone, CancellationToken ct = default) =>
        _context.Parents.Include(p => p.Student).FirstOrDefaultAsync(
            p => p.Phone.Replace("-", "").Replace(" ", "") == phone, ct);

    public Task<Parent?> FindByUserIdAsync(int userId, CancellationToken ct = default) =>
        _context.Parents.Include(p => p.Student).FirstOrDefaultAsync(p => p.UserId == userId, ct);

    public Task<User?> FindUserByIdAsync(int userId, CancellationToken ct = default) =>
        _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

    public Task<User?> FindUserByPhoneAsync(string phone, CancellationToken ct = default) =>
        _context.Users.FirstOrDefaultAsync(u => u.Phone == phone, ct);

    public async Task<User> CreateUserAsync(User user, CancellationToken ct = default)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);
        return user;
    }

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);

    public Task<List<ChildSummary>> GetChildrenAsync(int userId, CancellationToken ct = default) =>
        _context.Parents
            .Where(p => p.UserId == userId)
            .Select(p => new ChildSummary(
                p.Student.Id,
                p.Student.FullName,
                p.Student.Grade ?? string.Empty,
                p.Student.InstituteId))
            .ToListAsync(ct);

    public async Task<ParentDashboardSnapshot> GetDashboardAsync(int userId, CancellationToken ct = default)
    {
        var students = await _context.Parents
            .Where(p => p.UserId == userId)
            .Select(p => p.StudentId)
            .ToListAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var todayStart = today.ToDateTime(TimeOnly.MinValue);
        var tomorrowStart = today.AddDays(1).ToDateTime(TimeOnly.MinValue);

        var todayAttendance = await _context.Attendances
            .Where(a => students.Contains(a.StudentId) && a.Session != null
                && a.Session.ScheduledAt >= todayStart && a.Session.ScheduledAt < tomorrowStart)
            .CountAsync(ct);
        var pendingHomework = await _context.HomeworkSubmissions
            .Where(h => students.Contains(h.StudentId) && h.SubmittedAt == null && h.Score == null)
            .CountAsync(ct);
        var outstandingBalance = await _context.Payments
            .Where(p => p.Enrollment != null && students.Contains(p.Enrollment.StudentId) && p.Status == "pending")
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;
        var latestSkill = await _context.SkillScores
            .Where(s => students.Contains(s.StudentId))
            .OrderByDescending(s => s.UpdatedAt)
            .Select(s => (decimal?)(s.Score ?? 0))
            .FirstOrDefaultAsync(ct);

        return new ParentDashboardSnapshot(
            todayAttendance,
            pendingHomework,
            outstandingBalance,
            latestSkill,
            await GetChildrenAsync(userId, ct));
    }

    public Task<List<AttendanceRecord>> GetAttendanceAsync(int studentId, CancellationToken ct = default) =>
        _context.Attendances
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.Session.ScheduledAt)
            .Take(200)
            .Select(a => new AttendanceRecord(
                a.Session.Course.Name,
                a.Session.ScheduledAt,
                a.Status,
                a.CheckinAt ?? DateTime.MinValue,
                a.CheckoutAt ?? DateTime.MinValue))
            .ToListAsync(ct);

    public Task<List<PaymentListItem>> GetPaymentsAsync(int studentId, CancellationToken ct = default) =>
        _context.Payments
            .Where(p => p.Enrollment.StudentId == studentId)
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new PaymentListItem(
                p.Id,
                p.InvoiceNo,
                p.Enrollment.Course.Name,
                p.Amount,
                p.PaidAt,
                p.SlipUrl ?? string.Empty))
            .ToListAsync(ct);

    public Task<List<ParentSkillScoreItem>> GetScoresAsync(int studentId, CancellationToken ct = default) =>
        _context.SkillScores
            .Where(s => s.StudentId == studentId)
            .OrderBy(s => s.Topic.OrderIndex)
            .Select(s => new ParentSkillScoreItem(
                s.Topic.Course.Name,
                s.Topic.Name,
                s.Score ?? 0,
                s.Note ?? string.Empty))
            .ToListAsync(ct);

    public Task<List<ParentHomeworkItem>> GetHomeworkAsync(int studentId, CancellationToken ct = default) =>
        _context.Homeworks
            .Where(h => h.Course != null && _context.Enrollments.Any(e => e.StudentId == studentId && e.CourseId == h.CourseId))
            .Select(h => new ParentHomeworkItem(
                h.Id,
                h.Id,
                h.Course.Name,
                h.Title,
                h.Description ?? string.Empty,
                h.DueAt,
                h.FileUrl ?? string.Empty,
                _context.HomeworkSubmissions
                    .Where(s => s.HomeworkId == h.Id && s.StudentId == studentId)
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => (long?)s.Id)
                    .FirstOrDefault(),
                _context.HomeworkSubmissions
                    .Where(s => s.HomeworkId == h.Id && s.StudentId == studentId)
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => s.SubmittedAt)
                    .FirstOrDefault(),
                _context.HomeworkSubmissions
                    .Where(s => s.HomeworkId == h.Id && s.StudentId == studentId)
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => s.Score)
                    .FirstOrDefault(),
                _context.HomeworkSubmissions
                    .Where(s => s.HomeworkId == h.Id && s.StudentId == studentId)
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => s.Feedback ?? string.Empty)
                    .FirstOrDefault() ?? string.Empty))
             .ToListAsync(ct);

    public async Task<ParentProgressResponse> GetProgressAsync(int studentId, CancellationToken ct = default)
    {
        var streak = await _context.StreakCounters.FirstOrDefaultAsync(x => x.StudentId == studentId && x.StreakType == "attendance", ct);
        var badges = await _context.StudentBadges
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.AwardedAt)
            .Select(x => new ParentBadgeItem(x.BadgeId, x.Badge.BadgeKey, x.Badge.Name, x.Badge.Description, x.Badge.IconUrl, x.AwardedAt))
            .ToListAsync(ct);
        return new ParentProgressResponse(streak?.CurrentCount ?? 0, streak?.LongestCount ?? 0, badges);
    }

    public Task<List<ParentLeaveRequestItem>> GetLeaveRequestsAsync(int studentId, CancellationToken ct = default) =>
        _context.LeaveRequests
            .Where(l => l.StudentId == studentId)
            .OrderByDescending(l => l.CreatedAt)
            .Take(100)
            .Select(l => new ParentLeaveRequestItem(
                l.Id,
                l.Session.Course.Name,
                l.Reason ?? string.Empty,
                l.Type,
                l.Status,
                l.CreatedAt))
            .ToListAsync(ct);

    public Task<List<ParentSessionItem>> GetSessionsAsync(int studentId, DateTime from, CancellationToken ct = default) =>
        _context.Sessions
            .Where(s => _context.Enrollments.Any(e => e.StudentId == studentId && e.CourseId == s.CourseId)
                && s.ScheduledAt >= from)
            .OrderBy(s => s.ScheduledAt)
            .Select(s => new ParentSessionItem(
                s.Id,
                s.CourseId,
                s.Course.Name,
                s.ScheduledAt,
                s.DurationMin,
                s.RoomId,
                s.Status))
            .ToListAsync(ct);

    public Task<bool> IsParentOfStudentAsync(int userId, int studentId, CancellationToken ct = default) =>
        _context.Parents.AnyAsync(p => p.UserId == userId && p.StudentId == studentId, ct);

    public async Task<HomeworkSubmission?> CreateOrGetHomeworkSubmissionAsync(int userId, int studentId, int homeworkId, CancellationToken ct = default)
    {
        var student = await _context.Parents
            .Where(p => p.UserId == userId && p.StudentId == studentId)
            .Select(p => p.Student)
            .FirstOrDefaultAsync(ct);
        if (student is null) return null;

        var homework = await _context.Homeworks
            .FirstOrDefaultAsync(h => h.Id == homeworkId && _context.Enrollments.Any(e => e.StudentId == studentId && e.CourseId == h.CourseId), ct);
        if (homework is null) return null;

        var submission = await _context.HomeworkSubmissions
            .FirstOrDefaultAsync(s => s.HomeworkId == homeworkId && s.StudentId == studentId, ct);
        if (submission is not null) return submission;

        submission = new HomeworkSubmission
        {
            HomeworkId = homeworkId,
            StudentId = studentId,
            InstituteId = student.InstituteId,
            CreatedAt = DateTime.UtcNow
        };
        _context.HomeworkSubmissions.Add(submission);
        await _context.SaveChangesAsync(ct);
        return submission;
    }

    public Task<bool> IsParentOfHomeworkSubmissionAsync(int userId, int submissionId, CancellationToken ct = default) =>
        (from submission in _context.HomeworkSubmissions
         join parent in _context.Parents on submission.StudentId equals parent.StudentId
         where submission.Id == submissionId && parent.UserId == userId
         select submission.Id).AnyAsync(ct);
}
