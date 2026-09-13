using academy_API.DTOs;
using System.Text.Json;
using academy_API.Repositories;

namespace academy_API.Services;

public interface IAttendanceService
{
    Task<ScanAttendanceResponse> ScanAsync(ScanAttendanceRequest request, CancellationToken ct = default);
    Task<ManualAttendanceResponse> ManualAsync(ManualAttendanceRequest request, CancellationToken ct = default);
    Task<DailyAttendanceResponse> GetDailyAsync(int? sessionId, string? date, CancellationToken ct = default);
    Task<CheckoutAttendanceResponse> CheckoutAsync(long attendanceId, CheckoutAttendanceRequest request, int? actorId, CancellationToken ct = default);
    Task<AuditLogResponse?> GetCheckoutAuditAsync(long attendanceId, CancellationToken ct = default);
}

public class AttendanceService(
    IAttendanceRepository attendanceRepository,
    IBackgroundNotificationDispatcher notificationDispatcher) : IAttendanceService
{
    private readonly IAttendanceRepository _repository = attendanceRepository;
    private readonly IBackgroundNotificationDispatcher _notificationDispatcher = notificationDispatcher;

    public async Task<ScanAttendanceResponse> ScanAsync(ScanAttendanceRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.QrToken) || request.SessionId <= 0)
            throw new AttendanceValidationException("INVALID_QR", "QR Token หรือ session ไม่ถูกต้อง");

        var student = await _repository.ValidateQrTokenAsync(request.QrToken, ct);
        if (student is null)
            throw new AttendanceValidationException("INVALID_QR", "QR Token ไม่ถูกต้องหรือหมดอายุแล้ว");

        var isDuplicate = await _repository.IsDuplicateScanAsync(student.Id, request.SessionId, ct);
        if (isDuplicate)
            throw new AttendanceValidationException("DUPLICATE_SCAN", "นักเรียนได้ทำการเช็คชื่อในคลาสนี้ไปแล้ว");

        var session = await _repository.GetSessionByIdAsync(request.SessionId, ct);
        if (session is null)
            throw new AttendanceValidationException("SESSION_NOT_FOUND", "ไม่พบ session ที่ระบุ");
        if (session.Status == "cancelled" || session.Status == "completed")
            throw new AttendanceValidationException("SESSION_NOT_FOUND", "session นี้ไม่เปิดให้เช็คชื่อ");
        var courseType = session?.Course.CourseType;

        var billingMethod = courseType switch
        {
            "subscription" => "subscription",
            "credit" => "credit",
            "video" => "free",
            _ => "sessions"
        };

        var billingDesc = courseType switch
        {
            "subscription" => "ตรวจสอบวันหมดอายุ",
            "credit" => "หักเครดิต",
            "video" => "ไม่เสียค่าใช้จ่าย",
            _ => "หักจำนวนคาบเรียน"
        };

        try
        {
            await _repository.ScanCheckinWithTransactionAsync(student.Id, request.SessionId, ct);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException?.Message.Contains("uq_attendance_session_student", StringComparison.OrdinalIgnoreCase) == true)
        {
            throw new AttendanceValidationException("DUPLICATE_SCAN", "นักเรียนได้ทำการเช็คชื่อในคลาสนี้ไปแล้ว");
        }

        var checkinTime = DateTime.UtcNow;
        var notificationStatus = "skipped";
        var parents = await _repository.GetParentsWithLineAsync(student.Id, CancellationToken.None);
        foreach (var parent in parents)
        {
            if (parent.UserId is null || string.IsNullOrEmpty(parent.LineUserId))
                continue;

            var notification = await _notificationDispatcher.DispatchAsync(new BackgroundNotificationCandidate(
                parent.UserId.Value,
                student.InstituteId,
                parent.LineUserId,
                student.FullName,
                parent.FullName,
                NotificationMessageFactory.AttendanceCheckin(
                    student.FullName,
                    parent.FullName,
                    checkinTime.ToString("HH:mm:ss"),
                    "present"),
                "attendance_checkin",
                $"attendance_checkin:{request.SessionId}:{student.Id}:{parent.Id}"),
                CancellationToken.None);
            notificationStatus = notification.Sent
                ? "sent"
                : notificationStatus == "sent"
                    ? "sent"
                    : notification.Skipped
                        ? "skipped"
                        : "failed";
        }

        var remaining = await _repository.GetSessionsRemainingAsync(student.Id, request.SessionId, ct) ?? 0;
        var attendanceId = await _repository.GetAttendanceIdAsync(student.Id, request.SessionId, ct);

        return new ScanAttendanceResponse("success", "เช็คชื่อเข้าเรียนสำเร็จ",
            new ScanAttendanceData(student.Id, student.FullName, "present", checkinTime, remaining, billingMethod, billingDesc, attendanceId, request.SessionId, null, notificationStatus));
    }

    public async Task<ManualAttendanceResponse> ManualAsync(ManualAttendanceRequest request, CancellationToken ct = default)
    {
        var validStatuses = new HashSet<string> { "present", "late", "absent", "leave" };
        if (!validStatuses.Contains(request.Status))
            throw new AttendanceValidationException("INVALID_STATUS", "สถานะไม่ถูกต้อง (ค่าที่ใช้ได้: present, late, absent, leave)");

        var session = await _repository.GetSessionByIdAsync(request.SessionId, ct);
        if (session is null)
            throw new AttendanceValidationException("SESSION_NOT_FOUND", "ไม่พบ session ที่ระบุ");
        if (session.Status == "cancelled" || session.Status == "completed")
            throw new AttendanceValidationException("SESSION_NOT_FOUND", "session นี้ไม่เปิดให้เช็คชื่อ");

        var isDuplicate = await _repository.IsDuplicateScanAsync(request.StudentId, request.SessionId, ct);
        if (isDuplicate)
            throw new AttendanceValidationException("DUPLICATE_SCAN", "นักเรียนได้ทำการเช็คชื่อในคลาสนี้ไปแล้ว");

        try
        {
            await _repository.ManualCheckinWithTransactionAsync(request.StudentId, request.SessionId, request.Status, ct);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException?.Message.Contains("uq_attendance_session_student", StringComparison.OrdinalIgnoreCase) == true)
        {
            throw new AttendanceValidationException("DUPLICATE_SCAN", "นักเรียนได้ทำการเช็คชื่อในคลาสนี้ไปแล้ว");
        }

        var attendanceId = await _repository.GetAttendanceIdAsync(request.StudentId, request.SessionId, ct) ?? 0;

        return new ManualAttendanceResponse("success", "บันทึกสถานะการเข้าเรียนสำเร็จ",
            new ManualAttendanceData(attendanceId, request.Status));
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

    public async Task<CheckoutAttendanceResponse> CheckoutAsync(long attendanceId, CheckoutAttendanceRequest request, int? actorId, CancellationToken ct = default)
    {
        var hasPickedUpBy = !string.IsNullOrWhiteSpace(request.PickedUpBy);
        var hasPickupAuthorization = request.PickupAuthorizationId.HasValue;
        if (hasPickedUpBy == hasPickupAuthorization)
            throw new AttendanceValidationException("PICKUP_REQUIRED", "Provide exactly one pickup identity.");

        var attendance = await _repository.GetForCheckoutAsync(attendanceId, ct);
        if (attendance is null)
            throw new AttendanceValidationException("NOT_FOUND", "Attendance record not found.");
        if (!attendance.CheckinAt.HasValue)
            throw new AttendanceValidationException("CHECKIN_REQUIRED", "Student must check in before checkout.");
        if (attendance.CheckoutAt.HasValue)
            throw new AttendanceValidationException("ALREADY_CHECKED_OUT", "Attendance has already been checked out.");

        string pickedUpBy;
        if (request.PickupAuthorizationId.HasValue)
        {
            var authorization = await _repository.GetPickupAuthorizationAsync(request.PickupAuthorizationId.Value, attendance.StudentId, ct);
            if (authorization is null)
                throw new AttendanceValidationException("INVALID_PICKUP_AUTHORIZATION", "Pickup authorization is invalid or inactive.");
            pickedUpBy = authorization.FullName;
        }
        else
        {
            pickedUpBy = request.PickedUpBy!.Trim();
        }

        attendance.PickedUpBy = pickedUpBy;
        attendance.PickupAuthorizationId = request.PickupAuthorizationId;
        attendance.CheckoutAt = DateTime.UtcNow;
        attendance.UpdatedAt = DateTime.UtcNow;
        attendance.UpdatedBy = actorId;
        var audit = new Models.AuditLog
        {
            InstituteId = attendance.InstituteId,
            UserId = actorId,
            Action = "checkout",
            EntityType = "Attendance",
            EntityId = attendance.Id.ToString(),
            AfterJson = JsonSerializer.Serialize(new
            {
                attendance.CheckoutAt,
                attendance.PickedUpBy,
                attendance.PickupAuthorizationId,
                attendance.UpdatedBy
            }),
            CreatedAt = attendance.UpdatedAt.Value
        };
        await _repository.SaveCheckoutAsync(attendance, audit, ct);

        var notificationStatus = "skipped";
        var studentName = attendance.Student?.FullName ?? $"นักเรียน #{attendance.StudentId}";
        var parents = await _repository.GetParentsWithLineAsync(attendance.StudentId, CancellationToken.None) ?? [];
        foreach (var parent in parents)
        {
            if (parent.UserId is null || string.IsNullOrWhiteSpace(parent.LineUserId))
                continue;

            var result = await _notificationDispatcher.DispatchAsync(new BackgroundNotificationCandidate(
                parent.UserId.Value,
                attendance.InstituteId,
                parent.LineUserId,
                studentName,
                parent.FullName,
                NotificationMessageFactory.AttendanceCheckout(studentName, parent.FullName, pickedUpBy, attendance.CheckoutAt.Value.ToString("O")),
                "attendance_checkout",
                $"attendance_checkout:{attendance.Id}:{parent.Id}"), CancellationToken.None);
            notificationStatus = result.Sent ? "sent" : result.Skipped ? "skipped" : "failed";
        }

        return new CheckoutAttendanceResponse(
            attendance.Id,
            attendance.SessionId,
            attendance.StudentId,
            attendance.Status,
            attendance.CheckinAt,
            attendance.CheckoutAt.Value,
            attendance.PickedUpBy,
            attendance.PickupAuthorizationId,
            new AuditLogResponse(audit.Id, audit.UserId, audit.Action, audit.EntityType, audit.EntityId, audit.AfterJson, audit.CreatedAt),
            notificationStatus);
    }

    public async Task<AuditLogResponse?> GetCheckoutAuditAsync(long attendanceId, CancellationToken ct = default)
    {
        var audit = await _repository.GetCheckoutAuditAsync(attendanceId, ct);
        return audit is null ? null : new AuditLogResponse(audit.Id, audit.UserId, audit.Action, audit.EntityType, audit.EntityId, audit.AfterJson, audit.CreatedAt);
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
