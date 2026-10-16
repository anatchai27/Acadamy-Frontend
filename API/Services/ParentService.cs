using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Repositories.Interface;
using academy_API.Services.Contracts;
using academy_API.Services.Interface;

namespace academy_API.Services;

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

    public Task<bool> IsParentOfPaymentBatchAsync(int userId, long batchId, CancellationToken ct = default) =>
        _repository.IsParentOfPaymentBatchAsync(userId, batchId, ct);

    public Task<bool> IsParentOfPaymentAsync(int userId, long paymentId, CancellationToken ct = default) =>
        _repository.IsParentOfPaymentAsync(userId, paymentId, ct);

    public Task<List<AttendanceRecord>> GetAttendanceAsync(int studentId, CancellationToken ct = default) => _repository.GetAttendanceAsync(studentId, ct);
    public Task<List<PaymentListItem>> GetPaymentsAsync(int studentId, CancellationToken ct = default) => _repository.GetPaymentsAsync(studentId, ct);
    public Task<List<ParentPayableBalance>> GetPayableBalancesAsync(int studentId, CancellationToken ct = default) => _repository.GetPayableBalancesAsync(studentId, ct);
    public Task<List<ParentSkillScoreItem>> GetScoresAsync(int studentId, CancellationToken ct = default) => _repository.GetScoresAsync(studentId, ct);
    public Task<List<ParentHomeworkItem>> GetHomeworkAsync(int studentId, CancellationToken ct = default) => _repository.GetHomeworkAsync(studentId, ct);
    public Task<ParentProgressResponse> GetProgressAsync(int studentId, CancellationToken ct = default) => _repository.GetProgressAsync(studentId, ct);
    public Task<List<ParentLeaveRequestItem>> GetLeaveRequestsAsync(int studentId, CancellationToken ct = default) => _repository.GetLeaveRequestsAsync(studentId, ct);
    public Task<List<ParentSessionItem>> GetSessionsAsync(int studentId, CancellationToken ct = default) => _repository.GetSessionsAsync(studentId, DateTime.UtcNow.AddDays(-7), ct);
    public Task<HomeworkSubmission?> CreateOrGetHomeworkSubmissionAsync(int userId, int studentId, int homeworkId, CancellationToken ct = default) => _repository.CreateOrGetHomeworkSubmissionAsync(userId, studentId, homeworkId, ct);
    public Task<bool> IsParentOfHomeworkSubmissionAsync(int userId, int submissionId, CancellationToken ct = default) => _repository.IsParentOfHomeworkSubmissionAsync(userId, submissionId, ct);

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

