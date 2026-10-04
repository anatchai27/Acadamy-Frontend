using academy_API.DTOs;

namespace academy_API.Services;

public interface IEnrollmentService
{
    Task<EnrollStudentResponse> EnrollAsync(EnrollStudentRequest request, CancellationToken ct = default);
    Task<EnrollmentListResponse> GetByStudentIdAsync(int studentId, CancellationToken ct = default);
}

public class EnrollmentService(Repositories.IEnrollmentRepository repository) : IEnrollmentService
{
    private readonly Repositories.IEnrollmentRepository _repository = repository;

    public async Task<EnrollStudentResponse> EnrollAsync(EnrollStudentRequest request, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var course = await _repository.GetCourseByIdAsync(request.CourseId, ct);
        if (course is null)
            throw new EnrollmentValidationException("COURSE_NOT_FOUND", "ไม่พบคอร์สเรียนที่ระบุ");

        var upcomingSessionCount = await _repository.GetUpcomingSessionCountAsync(request.CourseId, now, ct);
        if (upcomingSessionCount == 0)
            throw new EnrollmentValidationException("NO_UPCOMING_SESSIONS", "คอร์สนี้ยังไม่มีคาบเรียนในอนาคต กรุณาจัดตารางเรียนก่อนลงทะเบียน");

        var alreadyEnrolled = await _repository.ExistsActiveEnrollmentAsync(request.StudentId, request.CourseId, ct);
        if (alreadyEnrolled)
            throw new EnrollmentValidationException("DUPLICATE_ENROLLMENT", "นักเรียนได้ลงทะเบียนคอร์สนี้แล้วและยังมีจำนวนครั้งเหลืออยู่");

        var enrollment = new Models.Enrollment
        {
            StudentId = request.StudentId,
            CourseId = request.CourseId,
            SessionsRemaining = upcomingSessionCount,
            PaidAmount = 0,
            ExpiresAt = now.AddMonths(6),
            CreatedAt = now
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

    public async Task<EnrollmentListResponse> GetByStudentIdAsync(int studentId, CancellationToken ct = default)
    {
        var enrollments = await _repository.GetByStudentIdAsync(studentId, ct);
        return new EnrollmentListResponse("success", new EnrollmentListData(enrollments));
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
