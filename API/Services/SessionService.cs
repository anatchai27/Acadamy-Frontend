using academy_API.DTOs;

namespace academy_API.Services;

public interface ISessionService
{
    Task<SessionListResponse> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task<CreateSessionResponse> CreateAsync(int courseId, CreateSessionRequest request, int instituteId, CancellationToken ct = default);
}

public class SessionService(Repositories.ISessionRepository repository) : ISessionService
{
    private readonly Repositories.ISessionRepository _repository = repository;

    public async Task<SessionListResponse> GetByCourseIdAsync(int courseId, CancellationToken ct = default)
    {
        var sessions = await _repository.GetByCourseIdAsync(courseId, ct);
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

    public async Task<CreateSessionResponse> CreateAsync(int courseId, CreateSessionRequest request, int instituteId, CancellationToken ct = default)
    {
        var course = await _repository.GetCourseByIdAsync(courseId, ct)
            ?? throw new SessionValidationException("COURSE_NOT_FOUND", "ไม่พบคอร์สเรียนหรือไม่มีสิทธิ์เข้าถึง");

        if (request.DurationMin <= 0)
            throw new SessionValidationException("INVALID_DURATION", "ระยะเวลาคาบเรียนต้องมากกว่า 0 นาที");

        var roomId = request.RoomId?.Trim();
        if (!string.IsNullOrWhiteSpace(roomId) && await _repository.HasRoomOverlapAsync(
                instituteId, roomId, request.ScheduledAt, request.ScheduledAt.AddMinutes(request.DurationMin), ct))
            throw new SessionValidationException("ROOM_OVERLAP", "ห้องเรียนมีคาบเรียนทับซ้อนในช่วงเวลานี้");

        var session = new Models.Session
        {
            CourseId = courseId,
            ScheduledAt = request.ScheduledAt,
            DurationMin = request.DurationMin,
            RoomId = roomId,
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
