using academy_API.Data;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public sealed class FileUploadRepository(TutoringDbContext db) : IFileUploadRepository
{
    public Task<bool> InstituteExistsAsync(int instituteId, CancellationToken ct) => db.Institutes.AnyAsync(x => x.Id == instituteId, ct);
    public Task<Institute?> GetInstituteAsync(int instituteId, CancellationToken ct) => db.Institutes.FirstOrDefaultAsync(x => x.Id == instituteId, ct);
    public Task<Payment?> GetPaymentAsync(long paymentId, int instituteId, CancellationToken ct) => db.Payments.Include(x => x.Enrollment).ThenInclude(x => x.Course).FirstOrDefaultAsync(x => x.Id == paymentId && x.Enrollment.Course.InstituteId == instituteId, ct);
    public Task<PaymentBatch?> GetPaymentBatchAsync(long batchId, int instituteId, CancellationToken ct) => db.PaymentBatches.FirstOrDefaultAsync(x => x.Id == batchId && x.InstituteId == instituteId, ct);
    public Task<Student?> GetStudentAsync(int studentId, int instituteId, CancellationToken ct) => db.Students.FirstOrDefaultAsync(x => x.Id == studentId && x.InstituteId == instituteId, ct);
    public Task<Teacher?> GetTeacherAsync(int teacherId, int instituteId, CancellationToken ct) => db.Teachers.FirstOrDefaultAsync(x => x.Id == teacherId && x.InstituteId == instituteId, ct);
    public Task<HomeworkSubmission?> GetHomeworkSubmissionAsync(int submissionId, int instituteId, CancellationToken ct) => db.HomeworkSubmissions.FirstOrDefaultAsync(x => x.Id == submissionId && x.InstituteId == instituteId, ct);
    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
