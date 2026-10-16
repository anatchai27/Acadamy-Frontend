using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Services.Interface;

public interface ICourseService
{
    Task<CourseListResponse> GetAllAsync(string? search, int? teacherId, CancellationToken ct = default);
    Task<Course?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CreateCourseResponse> CreateAsync(CreateCourseRequest request, int instituteId, CancellationToken ct = default);
    Task<UpdateCourseResponse> UpdateAsync(int id, UpdateCourseRequest request, CancellationToken ct = default);
}