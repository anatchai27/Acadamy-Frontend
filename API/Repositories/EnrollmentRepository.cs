using academy_API.Data;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IEnrollmentRepository
{
    Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken ct = default);
    Task<int> GetUpcomingSessionCountAsync(int courseId, DateTime from, CancellationToken ct = default);
    Task<bool> ExistsActiveEnrollmentAsync(int studentId, int courseId, CancellationToken ct = default);
    Task<Enrollment> CreateAsync(Enrollment enrollment, CancellationToken ct = default);
    Task<List<DTOs.EnrollmentItem>> GetByStudentIdAsync(int studentId, CancellationToken ct = default);
}

public class EnrollmentRepository(TutoringDbContext context) : IEnrollmentRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken ct = default)
    {
        return await _context.Courses.FirstOrDefaultAsync(c => c.Id == courseId, ct);
    }

    public Task<int> GetUpcomingSessionCountAsync(int courseId, DateTime from, CancellationToken ct = default)
    {
        return _context.Sessions.CountAsync(s =>
            s.CourseId == courseId &&
            s.Status == "scheduled" &&
            s.ScheduledAt >= from, ct);
    }

    public async Task<bool> ExistsActiveEnrollmentAsync(int studentId, int courseId, CancellationToken ct = default)
    {
        return await _context.Enrollments.AnyAsync(e =>
            e.StudentId == studentId &&
            e.CourseId == courseId &&
            e.SessionsRemaining > 0, ct);
    }

    public async Task<Enrollment> CreateAsync(Enrollment enrollment, CancellationToken ct = default)
    {
        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync(ct);
        return enrollment;
    }

    public async Task<List<DTOs.EnrollmentItem>> GetByStudentIdAsync(int studentId, CancellationToken ct = default)
    {
        return await _context.Enrollments
            .Include(e => e.Course)
            .Where(e => e.StudentId == studentId)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new DTOs.EnrollmentItem(
                e.Id,
                e.StudentId,
                e.Student.FullName,
                e.CourseId,
                e.Course.Name,
                e.SessionsRemaining,
                (_context.Payments
                     .Where(p => p.EnrollmentId == e.Id && p.Status == PaymentStatus.Succeeded)
                    .Sum(p => (decimal?)p.Amount) ?? 0m)
                    + (_context.PaymentBatchAllocations
                        .Where(a => a.EnrollmentId == e.Id && a.PaymentBatch.Status == PaymentStatus.Succeeded)
                        .Sum(a => (decimal?)a.Amount) ?? 0m),
                e.ExpiresAt,
                e.CreatedAt,
                e.Course.NameEn,
                e.Course.Price,
                (_context.Payments
                    .Where(p => p.EnrollmentId == e.Id && p.Status == PaymentStatus.Pending)
                    .Sum(p => (decimal?)p.Amount) ?? 0m)
                    + (_context.PaymentBatchAllocations
                        .Where(a => a.EnrollmentId == e.Id && a.PaymentBatch.Status == PaymentStatus.Pending)
                        .Sum(a => (decimal?)a.Amount) ?? 0m)
            ))
            .ToListAsync(ct);
    }
}
