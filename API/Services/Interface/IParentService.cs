using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services.Contracts;

namespace academy_API.Services.Interface;

public interface IParentService
{
    Task<ParentBindingOutcome> BindLineAsync(string verifiedUserId, string? phone, CancellationToken ct = default);
    Task<Parent?> ResolveAsync(int userId, CancellationToken ct = default);
    Task<ParentDashboardSnapshot> GetDashboardAsync(int userId, CancellationToken ct = default);
    Task<ParentProfileResult?> GetProfileAsync(int userId, CancellationToken ct = default);
    Task<ParentProfileResult?> UpdateProfileAsync(int userId, UpdateParentProfileRequest request, CancellationToken ct = default);
    Task<bool> IsParentOfStudentAsync(int userId, int studentId, CancellationToken ct = default);
    Task<bool> IsParentOfPaymentAsync(int userId, long paymentId, CancellationToken ct = default);
    Task<bool> IsParentOfPaymentBatchAsync(int userId, long batchId, CancellationToken ct = default);
    Task<List<AttendanceRecord>> GetAttendanceAsync(int studentId, CancellationToken ct = default);
    Task<List<PaymentListItem>> GetPaymentsAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentPayableBalance>> GetPayableBalancesAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentSkillScoreItem>> GetScoresAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentHomeworkItem>> GetHomeworkAsync(int studentId, CancellationToken ct = default);
    Task<ParentProgressResponse> GetProgressAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentLeaveRequestItem>> GetLeaveRequestsAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentSessionItem>> GetSessionsAsync(int studentId, CancellationToken ct = default);
    Task<HomeworkSubmission?> CreateOrGetHomeworkSubmissionAsync(int userId, int studentId, int homeworkId, CancellationToken ct = default);
    Task<bool> IsParentOfHomeworkSubmissionAsync(int userId, int submissionId, CancellationToken ct = default);
}