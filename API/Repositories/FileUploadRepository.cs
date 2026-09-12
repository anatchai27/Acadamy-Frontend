using academy_API.Data;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IFileUploadRepository
{
    Task<bool> InstituteExistsAsync(int instituteId, CancellationToken ct);
    Task<Payment?> GetPaymentAsync(long paymentId, int instituteId, CancellationToken ct);
    Task<Student?> GetStudentAsync(int studentId, int instituteId, CancellationToken ct);
    Task<Teacher?> GetTeacherAsync(int teacherId, int instituteId, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}

public sealed class FileUploadRepository(TutoringDbContext db) : IFileUploadRepository
{
    public Task<bool> InstituteExistsAsync(int instituteId, CancellationToken ct) => db.Institutes.AnyAsync(x => x.Id == instituteId, ct);
    public Task<Payment?> GetPaymentAsync(long paymentId, int instituteId, CancellationToken ct) => db.Payments.Include(x => x.Enrollment).ThenInclude(x => x.Course).FirstOrDefaultAsync(x => x.Id == paymentId && x.Enrollment.Course.InstituteId == instituteId, ct);
    public Task<Student?> GetStudentAsync(int studentId, int instituteId, CancellationToken ct) => db.Students.FirstOrDefaultAsync(x => x.Id == studentId && x.InstituteId == instituteId, ct);
    public Task<Teacher?> GetTeacherAsync(int teacherId, int instituteId, CancellationToken ct) => db.Teachers.FirstOrDefaultAsync(x => x.Id == teacherId && x.InstituteId == instituteId, ct);
    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
