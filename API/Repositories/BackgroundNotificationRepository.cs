using academy_API.Data;
using academy_API.Models;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IBackgroundNotificationRepository
{
    Task<List<BackgroundNotificationCandidate>> GetLateAttendanceCandidatesAsync(DateTime now, CancellationToken ct = default);
    Task<List<BackgroundNotificationCandidate>> GetHomeworkReminderCandidatesAsync(DateTime now, CancellationToken ct = default);
    Task<List<BackgroundNotificationCandidate>> GetQuotaLowCandidatesAsync(CancellationToken ct = default);
    Task<Notification?> FindByIdempotencyKeyAsync(string notificationType, string idempotencyKey, CancellationToken ct = default);
    Task<Notification> CreatePendingAsync(Notification notification, CancellationToken ct = default);
    Task MarkSentAsync(Notification notification, DateTime sentAt, CancellationToken ct = default);
    Task MarkFailedAsync(Notification notification, string error, CancellationToken ct = default);
}

public sealed class BackgroundNotificationRepository(TutoringDbContext context) : IBackgroundNotificationRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<List<BackgroundNotificationCandidate>> GetLateAttendanceCandidatesAsync(DateTime now, CancellationToken ct = default)
    {
        var cutoff = now.AddMinutes(-20);
        return await (
            from session in _context.Sessions
            join enrollment in _context.Enrollments on session.CourseId equals enrollment.CourseId
            join student in _context.Students on enrollment.StudentId equals student.Id
            join parent in _context.Parents on student.Id equals parent.StudentId
            where session.ScheduledAt <= cutoff
                && session.Status != "cancelled"
                && parent.UserId != null
                && parent.LineUserId != null
                && !_context.Attendances.Any(a => a.SessionId == session.Id && a.StudentId == student.Id)
            select new BackgroundNotificationCandidate(
                parent.UserId!.Value,
                session.InstituteId,
                parent.LineUserId!,
                student.FullName,
                parent.FullName,
                $"แจ้งเตือน: {student.FullName} ยังไม่ได้เช็คชื่อ หลังเริ่มเรียนเกิน 20 นาที",
                "late_attendance",
                $"late_attendance:{session.Id}:{student.Id}:{session.ScheduledAt:O}"))
            .Distinct()
            .ToListAsync(ct);
    }

    public async Task<List<BackgroundNotificationCandidate>> GetHomeworkReminderCandidatesAsync(DateTime now, CancellationToken ct = default)
    {
        var fromTime = now.AddHours(23);
        var toTime = now.AddHours(24);
        return await (
            from homework in _context.Homeworks
            join enrollment in _context.Enrollments on homework.CourseId equals enrollment.CourseId
            join student in _context.Students on enrollment.StudentId equals student.Id
            join parent in _context.Parents on student.Id equals parent.StudentId
            where homework.DueAt > fromTime
                && homework.DueAt <= toTime
                && parent.UserId != null
                && parent.LineUserId != null
                && !_context.HomeworkSubmissions.Any(s => s.HomeworkId == homework.Id && s.StudentId == student.Id && s.SubmittedAt != null)
            select new BackgroundNotificationCandidate(
                parent.UserId!.Value,
                homework.InstituteId,
                parent.LineUserId!,
                student.FullName,
                parent.FullName,
                $"แจ้งเตือน: การบ้าน {homework.Title} ของ {student.FullName} ครบกำหนดภายใน 24 ชั่วโมง",
                "homework_reminder",
                $"homework_reminder:{homework.Id}:{student.Id}:{homework.DueAt:O}"))
            .Distinct()
            .ToListAsync(ct);
    }

    public async Task<List<BackgroundNotificationCandidate>> GetQuotaLowCandidatesAsync(CancellationToken ct = default)
    {
        return await (
            from enrollment in _context.Enrollments
            join student in _context.Students on enrollment.StudentId equals student.Id
            join parent in _context.Parents on student.Id equals parent.StudentId
            where enrollment.SessionsRemaining > 0
                && enrollment.SessionsRemaining <= 3
                && parent.UserId != null
                && parent.LineUserId != null
            select new BackgroundNotificationCandidate(
                parent.UserId!.Value,
                enrollment.InstituteId,
                parent.LineUserId!,
                student.FullName,
                parent.FullName,
                $"แจ้งเตือน: โควต้าเรียนของ {student.FullName} เหลือ {enrollment.SessionsRemaining} ครั้ง",
                "quota_low",
                $"quota_low:{enrollment.Id}:{enrollment.SessionsRemaining}"))
            .Distinct()
            .ToListAsync(ct);
    }

    public Task<Notification?> FindByIdempotencyKeyAsync(string notificationType, string idempotencyKey, CancellationToken ct = default) =>
        _context.Notifications
            .Where(n => n.NotificationType == notificationType && n.Payload != null && n.Payload.Contains(idempotencyKey))
            .OrderByDescending(n => n.Id)
            .FirstOrDefaultAsync(ct);

    public async Task<Notification> CreatePendingAsync(Notification notification, CancellationToken ct = default)
    {
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);
        return notification;
    }

    public async Task MarkSentAsync(Notification notification, DateTime sentAt, CancellationToken ct = default)
    {
        notification.Status = "sent";
        notification.SentAt = sentAt;
        notification.ProcessedAt = sentAt;
        notification.ErrorMessage = null;
        await _context.SaveChangesAsync(ct);
    }

    public async Task MarkFailedAsync(Notification notification, string error, CancellationToken ct = default)
    {
        notification.RetryCount++;
        notification.Status = notification.RetryCount >= notification.MaxRetries ? "failed" : "retrying";
        notification.ErrorMessage = error;
        notification.ProcessedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }
}
