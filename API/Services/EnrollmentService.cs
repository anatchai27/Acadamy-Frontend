using academy_API.DTOs;

namespace academy_API.Services;

public interface IEnrollmentService
{
    Task<EnrollStudentResponse> EnrollAsync(EnrollStudentRequest request, int? instituteId, CancellationToken ct = default);
}

public class EnrollmentService(Repositories.IEnrollmentRepository repository) : IEnrollmentService
{
    private readonly Repositories.IEnrollmentRepository _repository = repository;

    public async Task<EnrollStudentResponse> EnrollAsync(EnrollStudentRequest request, int? instituteId, CancellationToken ct = default)
    {
        var course = await _repository.GetCourseByIdAsync(request.CourseId, instituteId, ct);
        if (course is null)
            throw new EnrollmentValidationException("COURSE_NOT_FOUND", "ไม่พบคอร์สเรียนที่ระบุ");

        var alreadyEnrolled = await _repository.ExistsActiveEnrollmentAsync(request.StudentId, request.CourseId, ct);
        if (alreadyEnrolled)
            throw new EnrollmentValidationException("DUPLICATE_ENROLLMENT", "นักเรียนได้ลงทะเบียนคอร์สนี้แล้วและยังมีจำนวนครั้งเหลืออยู่");

        var enrollment = new Models.Enrollment
        {
            StudentId = request.StudentId,
            CourseId = request.CourseId,
            SessionsRemaining = course.TotalSessions,
            PaidAmount = 0,
            ExpiresAt = DateTime.UtcNow.AddMonths(6),
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(enrollment, ct);

        return new EnrollStudentResponse(
            "success",
            "ลงทะเบียนเรียนสำเร็จ",
            new EnrollStudentData(
                created.Id,
                created.SessionsRemaining,
                created.ExpiresAt!.Value
            )
        );
    }
}

public class EnrollmentValidationException : Exception
{
    public string ErrorCode { get; }

    public EnrollmentValidationException(string errorCode, string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }
}
