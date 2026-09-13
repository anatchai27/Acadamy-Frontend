namespace academy_API.DTOs;

public record ScanAttendanceRequest(
    string QrToken,
    int SessionId,
    string? IdempotencyKey = null
);

public record ScanAttendanceResponse(
    string Status,
    string Message,
    ScanAttendanceData Data
);

public record ScanAttendanceData(
    int StudentId,
    string StudentName,
    string Status,
    DateTime CheckinAt,
    int? SessionsRemaining,
    string? BillingMethod,
    string? BillingDescription,
    long? AttendanceId = null,
    int? SessionId = null,
    DateTime? CheckoutAt = null,
    string NotificationStatus = "pending"
);

public record AttendanceErrorResponse(
    string Status,
    string ErrorCode,
    string Message
);

public record ManualAttendanceRequest(
    int SessionId,
    int StudentId,
    string Status
);

public record CheckoutAttendanceRequest(string? PickedUpBy, long? PickupAuthorizationId);

public record CheckoutAttendanceResponse(
    long Id,
    int SessionId,
    int StudentId,
    string Status,
    DateTime? CheckinAt,
    DateTime CheckoutAt,
    string PickedUpBy,
    long? PickupAuthorizationId,
    AuditLogResponse? Audit = null,
    string NotificationStatus = "pending"
);

public record ManualAttendanceResponse(
    string Status,
    string Message,
    ManualAttendanceData Data
);

public record ManualAttendanceData(
    long AttendanceId,
    string StatusRecorded
);

public record DailyAttendanceResponse(
    string Status,
    DailyAttendanceData Data
);

public record DailyAttendanceData(
    DailySessionInfo? SessionInfo,
    List<DailyAttendanceRow> Attendances
);

public record DailySessionInfo(
    int Id,
    string CourseName,
    DateTime ScheduledAt
);

public record DailyAttendanceRow(
    long AttendanceId,
    int StudentId,
    string FullName,
    string? Nickname,
    string Status,
    DateTime? CheckinAt,
    DateTime? CheckoutAt,
    string? PickedUpBy
);
