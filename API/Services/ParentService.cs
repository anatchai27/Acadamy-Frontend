using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;

namespace academy_API.Services;

public interface IParentService
{
    Task<ParentBindingResult?> BindLineAsync(string verifiedUserId, string? phone, CancellationToken ct = default);
    Task<Parent?> ResolveAsync(int userId, CancellationToken ct = default);
    Task<ParentDashboardSnapshot> GetDashboardAsync(int userId, CancellationToken ct = default);
    Task<ParentProfileResult?> GetProfileAsync(int userId, CancellationToken ct = default);
    Task<ParentProfileResult?> UpdateProfileAsync(int userId, UpdateParentProfileRequest request, CancellationToken ct = default);
    Task<bool> IsParentOfStudentAsync(int userId, int studentId, CancellationToken ct = default);
    Task<List<AttendanceRecord>> GetAttendanceAsync(int studentId, CancellationToken ct = default);
    Task<List<PaymentListItem>> GetPaymentsAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentSkillScoreItem>> GetScoresAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentHomeworkItem>> GetHomeworkAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentLeaveRequestItem>> GetLeaveRequestsAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentSessionItem>> GetSessionsAsync(int studentId, CancellationToken ct = default);
}

public sealed class ParentService(IParentRepository repository) : IParentService
{
    private readonly IParentRepository _repository = repository;

    public async Task<ParentBindingResult?> BindLineAsync(string verifiedUserId, string? phone, CancellationToken ct = default)
    {
        var parent = await _repository.FindByLineUserAsync(verifiedUserId, ct);
        if (parent is null && !string.IsNullOrWhiteSpace(phone))
            parent = await _repository.FindByPhoneAsync(new string(phone.Where(char.IsDigit).ToArray()), ct);
        if (parent is null)
            return null;

        var user = parent.UserId.HasValue
            ? await _repository.FindUserByIdAsync(parent.UserId.Value, ct)
            : null;
        if (user is null)
        {
            user = await FindOrCreateUserAsync(parent, verifiedUserId, ct);
            parent.UserId = user.Id;
        }

        if (string.IsNullOrEmpty(user.LineUserId)) user.LineUserId = verifiedUserId;
        parent.LineUserId = verifiedUserId;
        parent.IsActive = true;
        await _repository.SaveChangesAsync(ct);

        return new ParentBindingResult(user, parent, await _repository.GetChildrenAsync(user.Id, ct));
    }

    public Task<Parent?> ResolveAsync(int userId, CancellationToken ct = default) =>
        _repository.FindByUserIdAsync(userId, ct);

    public Task<ParentDashboardSnapshot> GetDashboardAsync(int userId, CancellationToken ct = default) =>
        _repository.GetDashboardAsync(userId, ct);

    public async Task<ParentProfileResult?> GetProfileAsync(int userId, CancellationToken ct = default)
    {
        var parent = await ResolveAsync(userId, ct);
        if (parent is null) return null;
        var email = (await _repository.FindUserByIdAsync(parent.UserId!.Value, ct))?.Email ?? string.Empty;
        return new ParentProfileResult(parent, email, await _repository.GetChildrenAsync(userId, ct));
    }

    public async Task<ParentProfileResult?> UpdateProfileAsync(int userId, UpdateParentProfileRequest request, CancellationToken ct = default)
    {
        var parent = await ResolveAsync(userId, ct);
        if (parent is null) return null;
        if (!string.IsNullOrWhiteSpace(request.FullName)) parent.FullName = request.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(request.Phone)) parent.Phone = request.Phone.Trim();
        var user = parent.UserId.HasValue ? await _repository.FindUserByIdAsync(parent.UserId.Value, ct) : null;
        if (user is not null && !string.IsNullOrWhiteSpace(request.Email)) user.Email = request.Email.Trim();
        await _repository.SaveChangesAsync(ct);
        return new ParentProfileResult(parent, user?.Email ?? string.Empty, await _repository.GetChildrenAsync(userId, ct));
    }

    public Task<bool> IsParentOfStudentAsync(int userId, int studentId, CancellationToken ct = default) =>
        _repository.IsParentOfStudentAsync(userId, studentId, ct);

    public Task<List<AttendanceRecord>> GetAttendanceAsync(int studentId, CancellationToken ct = default) => _repository.GetAttendanceAsync(studentId, ct);
    public Task<List<PaymentListItem>> GetPaymentsAsync(int studentId, CancellationToken ct = default) => _repository.GetPaymentsAsync(studentId, ct);
    public Task<List<ParentSkillScoreItem>> GetScoresAsync(int studentId, CancellationToken ct = default) => _repository.GetScoresAsync(studentId, ct);
    public Task<List<ParentHomeworkItem>> GetHomeworkAsync(int studentId, CancellationToken ct = default) => _repository.GetHomeworkAsync(studentId, ct);
    public Task<List<ParentLeaveRequestItem>> GetLeaveRequestsAsync(int studentId, CancellationToken ct = default) => _repository.GetLeaveRequestsAsync(studentId, ct);
    public Task<List<ParentSessionItem>> GetSessionsAsync(int studentId, CancellationToken ct = default) => _repository.GetSessionsAsync(studentId, DateTime.UtcNow.AddDays(-7), ct);

    private async Task<User> FindOrCreateUserAsync(Parent parent, string lineUserId, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(parent.Phone))
        {
            var existing = await _repository.FindUserByPhoneAsync(parent.Phone, ct);
            if (existing is not null) return existing;
        }

        return await _repository.CreateUserAsync(new User
        {
            InstituteId = parent.InstituteId,
            Email = $"{lineUserId}@line.parent",
            Phone = parent.Phone,
            Role = UserRole.parent,
            LineUserId = lineUserId,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }, ct);
    }
}

public sealed record ParentBindingResult(User User, Parent Parent, List<ChildSummary> Children);
public sealed record ParentProfileResult(Parent Parent, string Email, List<ChildSummary> Children);
public sealed record ParentDashboardSnapshot(int TodayAttendance, int PendingHomework, decimal OutstandingBalance, decimal? LatestSkillScore, List<ChildSummary> Children);
public record ChildSummary(int Id, string FullName, string Grade, int InstituteId);
public record UpdateParentProfileRequest(string? FullName, string? Phone, string? Email);
public record ParentSessionItem(int Id, int CourseId, string CourseName, DateTime ScheduledAt, int DurationMin, string? RoomId, string Status);
public record AttendanceRecord(string CourseName, DateTime ScheduledAt, string Status, DateTime CheckinAt, DateTime CheckoutAt);
public record PaymentListItem(long Id, string InvoiceNo, string CourseName, decimal Amount, DateTime PaidAt, string SlipUrl);
public record ParentSkillScoreItem(string CourseName, string TopicName, decimal Score, string Note);
public record ParentHomeworkItem(long Id, long HomeworkId, string CourseName, string Title, string Description, DateTime DueAt, string FileUrl);
public record ParentLeaveRequestItem(long Id, string CourseName, string Reason, string Type, string Status, DateTime CreatedAt);
