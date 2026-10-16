using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IEnrollmentService
{
    Task<EnrollStudentResponse> EnrollAsync(EnrollStudentRequest request, CancellationToken ct = default);
    Task<EnrollmentListResponse> GetByStudentIdAsync(int studentId, CancellationToken ct = default);
    Task<EnrollmentListResponse> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
}