using academy_API.DTOs;

namespace academy_API.Services;

public interface ISessionService
{
    Task<SessionListResponse> GetByCourseIdAsync(int courseId, int? instituteId, CancellationToken ct = default);
    Task<CreateSessionResponse> CreateAsync(int courseId, CreateSessionRequest request, int? instituteId, CancellationToken ct = default);
}

public class SessionService(Repositories.ISessionRepository repository) : ISessionService
{
    private readonly Repositories.ISessionRepository _repository = repository;

    public async Task<SessionListResponse> GetByCourseIdAsync(int courseId, int? instituteId, CancellationToken ct = default)
    {
        var sessions = await _repository.GetByCourseIdAsync(courseId, instituteId, ct);
        var items = sessions.Select(s => new SessionItem(
            s.Id,
            s.CourseId,
            s.Course.Name,
            s.ScheduledAt,
            s.DurationMin,
            s.RoomId,
            s.Status
        )).ToList();

        return new SessionListResponse("success", new SessionListData(items));
    }

    public async Task<CreateSessionResponse> CreateAsync(int courseId, CreateSessionRequest request, int? instituteId, CancellationToken ct = default)
    {
        var course = await _repository.GetCourseByIdAsync(courseId, instituteId, ct)
            ?? throw new SessionValidationException("COURSE_NOT_FOUND", "ไม่พบคอร์สเรียนหรือไม่มีสิทธิ์เข้าถึง");

        var session = new Models.Session
        {
            CourseId = courseId,
            ScheduledAt = request.ScheduledAt,
            DurationMin = request.DurationMin,
            RoomId = request.RoomId?.Trim(),
            Status = "scheduled"
        };

        var created = await _repository.CreateAsync(session, ct);

        return new CreateSessionResponse(
            "success",
            "สร้างตารางเรียนสำเร็จ",
            new CreateSessionData(created.Id, created.ScheduledAt)
        );
    }
}

public class SessionValidationException : Exception
{
    public string ErrorCode { get; }
    public SessionValidationException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}
