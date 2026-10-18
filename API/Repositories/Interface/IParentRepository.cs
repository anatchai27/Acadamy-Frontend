using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IParentRepository
{
    Task<List<Parent>> FindByLineUserAsync(string lineUserId, CancellationToken ct = default);
    Task<List<Parent>> FindByPhoneAsync(string phone, CancellationToken ct = default);
    Task<Parent?> FindByUserIdAsync(int userId, CancellationToken ct = default);
    Task<User?> FindUserByIdAsync(int userId, CancellationToken ct = default);
    Task<User> CreateUserAsync(User user, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
    Task<List<ChildSummary>> GetChildrenAsync(int userId, CancellationToken ct = default);
    Task<List<ChildSummary>> GetChildrenForInstituteAsync(int userId, int instituteId, CancellationToken ct = default);
    Task<ParentDashboardSnapshot> GetDashboardAsync(int userId, CancellationToken ct = default);
    Task<List<AttendanceRecord>> GetAttendanceAsync(int studentId, CancellationToken ct = default);
    Task<List<PaymentListItem>> GetPaymentsAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentPayableBalance>> GetPayableBalancesAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentSkillScoreItem>> GetScoresAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentHomeworkItem>> GetHomeworkAsync(int studentId, CancellationToken ct = default);
    Task<ParentProgressResponse> GetProgressAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentLeaveRequestItem>> GetLeaveRequestsAsync(int studentId, CancellationToken ct = default);
    Task<List<ParentSessionItem>> GetSessionsAsync(int studentId, DateTime from, CancellationToken ct = default);
    Task<bool> IsParentOfStudentAsync(int userId, int studentId, CancellationToken ct = default);
    Task<bool> IsParentOfPaymentAsync(int userId, long paymentId, CancellationToken ct = default);
    Task<bool> IsParentOfPaymentBatchAsync(int userId, long batchId, CancellationToken ct = default);
    Task<HomeworkSubmission?> CreateOrGetHomeworkSubmissionAsync(int userId, int studentId, int homeworkId, CancellationToken ct = default);
    Task<bool> IsParentOfHomeworkSubmissionAsync(int userId, int submissionId, CancellationToken ct = default);
}