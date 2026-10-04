using academy_API.DTOs;
using System.Globalization;

namespace academy_API.Services;

public interface ISessionService
{
    Task<SessionListResponse> GetByCourseIdAsync(int courseId, CancellationToken ct = default);
    Task<CreateSessionResponse> CreateAsync(int courseId, CreateSessionRequest request, int instituteId, CancellationToken ct = default);
    Task<CreateRecurringSessionsResponse> CreateRecurringAsync(int courseId, CreateRecurringSessionsRequest request, int instituteId, CancellationToken ct = default);
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
            s.Status,
            s.Course.NameEn
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

        session.InstituteId = instituteId;

        Models.Session created;
        try
        {
            created = await _repository.CreateAsync(session, ct);
        }
        catch (Repositories.RoomBookingConflictException)
        {
            throw new SessionValidationException("ROOM_OVERLAP", "ห้องเรียนมีคาบเรียนทับซ้อนในช่วงเวลานี้");
        }

        return new CreateSessionResponse(
            "success",
            "สร้างตารางเรียนสำเร็จ",
            new CreateSessionData(created.Id, created.ScheduledAt)
        );
    }

    public async Task<CreateRecurringSessionsResponse> CreateRecurringAsync(int courseId, CreateRecurringSessionsRequest request, int instituteId, CancellationToken ct = default)
    {
        _ = await _repository.GetCourseByIdAsync(courseId, ct)
            ?? throw new SessionValidationException("COURSE_NOT_FOUND", "ไม่พบคอร์สเรียนหรือไม่มีสิทธิ์เข้าถึง");

        if (request.StartDate.Date > request.EndDate.Date)
            throw new SessionValidationException("INVALID_DATE_RANGE", "วันเริ่มต้นต้องไม่เกินวันสิ้นสุด");
        if (request.Rules is null || request.Rules.Count == 0)
            throw new SessionValidationException("RULES_REQUIRED", "กรุณาเพิ่มวันและเวลาที่ต้องการเรียน");
        if ((request.EndDate.Date - request.StartDate.Date).TotalDays > 366)
            throw new SessionValidationException("DATE_RANGE_TOO_LONG", "ช่วงวันที่ต้องไม่เกิน 1 ปี");

        var generated = new List<CreateSessionRequest>();
        for (var day = request.StartDate.Date; day <= request.EndDate.Date; day = day.AddDays(1))
        {
            foreach (var rule in request.Rules)
            {
                if (rule.DayOfWeek is < 0 or > 6 || !TimeOnly.TryParse(rule.StartTime, CultureInfo.InvariantCulture, out var startTime))
                    throw new SessionValidationException("INVALID_RULE", "วันหรือเวลาในกฎตารางเรียนไม่ถูกต้อง");
                if ((int)day.DayOfWeek != rule.DayOfWeek) continue;
                if (rule.DurationMin <= 0) throw new SessionValidationException("INVALID_DURATION", "ระยะเวลาคาบเรียนต้องมากกว่า 0 นาที");
                generated.Add(new CreateSessionRequest(day.Add(startTime.ToTimeSpan()), rule.DurationMin, rule.RoomId?.Trim()));
            }
        }

        if (generated.Count == 0)
            throw new SessionValidationException("NO_SESSIONS", "ไม่พบวันที่ตรงกับกฎที่เลือกในช่วงวันที่กำหนด");

        for (var index = 0; index < generated.Count; index++)
        {
            for (var otherIndex = index + 1; otherIndex < generated.Count; otherIndex++)
            {
                var current = generated[index];
                var other = generated[otherIndex];
                if (string.IsNullOrWhiteSpace(current.RoomId) || current.RoomId != other.RoomId) continue;
                if (current.ScheduledAt < other.ScheduledAt.AddMinutes(other.DurationMin)
                    && other.ScheduledAt < current.ScheduledAt.AddMinutes(current.DurationMin))
                    throw new SessionValidationException("ROOM_OVERLAP", "กฎตารางเรียนมีเวลาในห้องเดียวกันทับซ้อนกัน");
            }
        }

        foreach (var item in generated.Where(x => !string.IsNullOrWhiteSpace(x.RoomId)))
        {
            if (await _repository.HasRoomOverlapAsync(instituteId, item.RoomId!, item.ScheduledAt, item.ScheduledAt.AddMinutes(item.DurationMin), ct))
                throw new SessionValidationException("ROOM_OVERLAP", "มีคาบเรียนในห้องที่เลือกทับซ้อนอยู่แล้ว");
        }

        foreach (var item in generated)
            await CreateAsync(courseId, item, instituteId, ct);

        return new CreateRecurringSessionsResponse("success", "สร้างตารางเรียนแบบ recurring สำเร็จ", generated.Count);
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
