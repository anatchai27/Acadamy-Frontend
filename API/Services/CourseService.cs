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

    private static readonly HashSet<string> ValidCourseTypes = ["group", "private", "subscription", "video", "credit"];

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

        if (string.IsNullOrWhiteSpace(request.CourseType) || !ValidCourseTypes.Contains(request.CourseType))
            throw new CourseValidationException("INVALID_COURSE_TYPE", "รูปแบบคอร์สไม่ถูกต้อง (group, private, subscription, video, credit)");

        ValidateCourseTypeFields(request.CourseType, request.TotalSessions, request.ExpiresInDays, request.CreditCost);

        var course = new Models.Course
        {
            InstituteId = instituteId,
            CourseType = request.CourseType,
            Name = request.Name.Trim(),
            Subject = request.Subject?.Trim() ?? string.Empty,
            TotalSessions = request.TotalSessions ?? 0,
            Price = request.Price,
            TeacherId = request.TeacherId,
            ExpiresInDays = request.ExpiresInDays,
            RequireComputer = request.RequireComputer,
            CreditCost = request.CreditCost,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(course, ct);

        return new CreateCourseResponse("success", "สร้างคอร์สเรียนสำเร็จ",
            new CreateCourseData(created.Id, created.Name, created.CourseType ?? "group", created.CreatedAt));
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

    private static void ValidateCourseTypeFields(string courseType, int? totalSessions, int? expiresInDays, int? creditCost)
    {
        switch (courseType)
        {
            case "group":
            case "private":
                if (totalSessions is null or <= 0)
                    throw new CourseValidationException("TOTAL_SESSIONS_REQUIRED",
                        "คอร์สประเภทนี้ต้องระบุจำนวนคาบเรียน");
                break;

            case "subscription":
                if (expiresInDays is null or <= 0)
                    throw new CourseValidationException("EXPIRES_IN_DAYS_REQUIRED",
                        "คอร์สบุฟเฟต์ต้องระบุจำนวนวันที่ใช้งานได้");
                break;

            case "credit":
                if (creditCost is null or <= 0)
                    throw new CourseValidationException("CREDIT_COST_REQUIRED",
                        "คอร์สเครดิตต้องระบุจำนวนเครดิตที่ใช้ต่อครั้ง");
                break;

            case "video":
                break;
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