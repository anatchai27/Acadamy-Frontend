namespace academy_API.DTOs;

public record ScanAttendanceRequest(
    string QrToken,
    int SessionId
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
    string? BillingDescription
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
    int StudentId,
    string FullName,
    string? Nickname,
    string Status,
    DateTime? CheckinAt,
    DateTime? CheckoutAt,
    string? PickedUpBy
);
