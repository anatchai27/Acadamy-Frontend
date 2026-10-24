using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IEnrollmentRepository
{
    Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken ct = default);
    Task<Student?> GetStudentByIdAsync(int studentId, CancellationToken ct = default);
    Task<int> GetUpcomingSessionCountAsync(int courseId, DateTime from, CancellationToken ct = default);
    Task<bool> ExistsActiveEnrollmentAsync(int studentId, int courseId, CancellationToken ct = default);
    Task<Enrollment> CreateAsync(Enrollment enrollment, CancellationToken ct = default);
    Task<List<DTOs.EnrollmentItem>> GetByStudentIdAsync(int studentId, CancellationToken ct = default);
    Task<List<DTOs.EnrollmentItem>> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
}