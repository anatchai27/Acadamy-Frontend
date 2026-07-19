using academy_API.DTOs;
using academy_API.Repositories;

namespace academy_API.Services;

public interface IAttendanceService
{
    Task<ScanAttendanceResponse> ScanAsync(ScanAttendanceRequest request, CancellationToken ct = default);
    Task<ManualAttendanceResponse> ManualAsync(ManualAttendanceRequest request, CancellationToken ct = default);
    Task<DailyAttendanceResponse> GetDailyAsync(int? sessionId, string? date, CancellationToken ct = default);
}

public class AttendanceService(
    IAttendanceRepository attendanceRepository,
    Services.Contracts.ILineNotificationService lineNotificationService) : IAttendanceService
{
    private readonly IAttendanceRepository _repository = attendanceRepository;
    private readonly Services.Contracts.ILineNotificationService _lineService = lineNotificationService;

    public async Task<ScanAttendanceResponse> ScanAsync(ScanAttendanceRequest request, CancellationToken ct = default)
    {
        var student = await _repository.ValidateQrTokenAsync(request.QrToken, ct);
        if (student is null)
            throw new AttendanceValidationException("INVALID_QR", "QR Token ไม่ถูกต้องหรือหมดอายุแล้ว");

        var isDuplicate = await _repository.IsDuplicateScanAsync(student.Id, request.SessionId, ct);
        if (isDuplicate)
            throw new AttendanceValidationException("DUPLICATE_SCAN", "นักเรียนได้ทำการเช็คชื่อในคลาสนี้ไปแล้ว");

        await _repository.ScanCheckinWithTransactionAsync(student.Id, request.SessionId, ct);

        var sessionsRemaining = 0;
        _ = Task.Run(async () =>
        {
            try
            {
                var parents = await _repository.GetParentsWithLineAsync(student.Id, CancellationToken.None);
                foreach (var parent in parents)
                {
                    if (!string.IsNullOrEmpty(parent.LineUserId))
                    {
                        await _lineService.SendAttendanceNotificationAsync(
                            parent.LineUserId, student.FullName, parent.FullName,
                            DateTime.UtcNow.ToString("HH:mm:ss"), "present", CancellationToken.None);
                    }
                }
            }
            catch { }
        });

        return new ScanAttendanceResponse("success", "เช็คชื่อเข้าเรียนสำเร็จ",
            new ScanAttendanceData(student.Id, student.FullName, "present", DateTime.UtcNow, sessionsRemaining));
    }

    public async Task<ManualAttendanceResponse> ManualAsync(ManualAttendanceRequest request, CancellationToken ct = default)
    {
        var validStatuses = new HashSet<string> { "present", "late", "absent", "leave" };
        if (!validStatuses.Contains(request.Status))
            throw new AttendanceValidationException("INVALID_STATUS", "สถานะไม่ถูกต้อง (ค่าที่ใช้ได้: present, late, absent, leave)");

        var isDuplicate = await _repository.IsDuplicateScanAsync(request.StudentId, request.SessionId, ct);
        if (isDuplicate)
            throw new AttendanceValidationException("DUPLICATE_SCAN", "นักเรียนได้ทำการเช็คชื่อในคลาสนี้ไปแล้ว");

        await _repository.ManualCheckinWithTransactionAsync(request.StudentId, request.SessionId, request.Status, ct);

        return new ManualAttendanceResponse("success", "บันทึกสถานะการเข้าเรียนสำเร็จ",
            new ManualAttendanceData(0, request.Status));
    }

    public async Task<DailyAttendanceResponse> GetDailyAsync(int? sessionId, string? date, CancellationToken ct = default)
    {
        var parsedDate = DateTime.UtcNow.Date;
        if (!string.IsNullOrWhiteSpace(date) &&
            !DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out parsedDate))
            throw new AttendanceValidationException("INVALID_DATE", "รูปแบบวันที่ไม่ถูกต้อง (ใช้ YYYY-MM-DD)");

        DailySessionInfo? sessionInfo = null;
        if (sessionId.HasValue)
        {
            var session = await _repository.GetSessionByIdAsync(sessionId.Value, ct);
            if (session is not null)
                sessionInfo = new DailySessionInfo(session.Id, session.Course.Name, session.ScheduledAt);
        }

        var rows = await _repository.GetDailyAttendanceAsync(sessionId, parsedDate, ct);

        return new DailyAttendanceResponse("success", new DailyAttendanceData(sessionInfo, rows));
    }
}

public class AttendanceValidationException : Exception
{
    public string ErrorCode { get; }
    public AttendanceValidationException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}