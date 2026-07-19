using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Services;

public interface ICourseService
{
    Task<CourseListResponse> GetAllAsync(string? search, int? teacherId, CancellationToken ct = default);
    Task<Course?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CreateCourseResponse> CreateAsync(CreateCourseRequest request, int instituteId, CancellationToken ct = default);
    Task<UpdateCourseResponse> UpdateAsync(int id, UpdateCourseRequest request, CancellationToken ct = default);
}

public class CourseService(Repositories.ICourseRepository repository) : ICourseService
{
    private readonly Repositories.ICourseRepository _repository = repository;

    public async Task<CourseListResponse> GetAllAsync(string? search, int? teacherId, CancellationToken ct = default)
    {
        var courses = await _repository.SearchAsync(search, teacherId, ct);
        return new CourseListResponse("success", new CourseListData(courses));
    }

    public async Task<Models.Course?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _repository.GetByIdAsync(id, ct);
    }

    public async Task<CreateCourseResponse> CreateAsync(CreateCourseRequest request, int instituteId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new CourseValidationException("NAME_REQUIRED", "กรุณาระบุชื่อคอร์สเรียน");

        var course = new Models.Course
        {
            InstituteId = instituteId,
            Name = request.Name.Trim(),
            Subject = request.Subject?.Trim() ?? string.Empty,
            TotalSessions = request.TotalSessions,
            Price = request.Price,
            TeacherId = request.TeacherId,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(course, ct);

        return new CreateCourseResponse("success", "สร้างคอร์สเรียนสำเร็จ", new CreateCourseData(created.Id, created.Name, created.CreatedAt));
    }

    public async Task<UpdateCourseResponse> UpdateAsync(int id, UpdateCourseRequest request, CancellationToken ct = default)
    {
        try
        {
            var course = await _repository.UpdateAsync(id, request, ct);

            if (course is null)
                throw new CourseValidationException("NOT_FOUND", "ไม่พบคอร์สเรียน");

            return new UpdateCourseResponse("success", "อัปเดตคอร์สเรียนสำเร็จ");
        }
        catch (InvalidOperationException ex) when (ex.Message == "FORBIDDEN")
        {
            throw new CourseValidationException("FORBIDDEN", "Access denied.");
        }
    }
}

public class CourseValidationException : Exception
{
    public string ErrorCode { get; }
    public CourseValidationException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}

public record UpdateCourseResponse(string Status, string Message);