using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface ICourseRepository
{
    Task<List<CourseItem>> SearchAsync(string? search, int? teacherId, CancellationToken ct = default);
    Task<Course?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Course> CreateAsync(Course course, CancellationToken ct = default);
    Task<Course?> UpdateAsync(int id, UpdateCourseRequest request, CancellationToken ct = default);
}