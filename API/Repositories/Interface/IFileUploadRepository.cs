using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IFileUploadRepository
{
    Task<bool> InstituteExistsAsync(int instituteId, CancellationToken ct);
    Task<Payment?> GetPaymentAsync(long paymentId, int instituteId, CancellationToken ct);
    Task<PaymentBatch?> GetPaymentBatchAsync(long batchId, int instituteId, CancellationToken ct);
    Task<Student?> GetStudentAsync(int studentId, int instituteId, CancellationToken ct);
    Task<Teacher?> GetTeacherAsync(int teacherId, int instituteId, CancellationToken ct);
    Task<HomeworkSubmission?> GetHomeworkSubmissionAsync(int submissionId, int instituteId, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}