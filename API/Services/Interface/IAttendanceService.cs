using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IAttendanceService
{
    Task<ScanAttendanceResponse> ScanAsync(ScanAttendanceRequest request, CancellationToken ct = default);
    Task<ManualAttendanceResponse> ManualAsync(ManualAttendanceRequest request, CancellationToken ct = default);
    Task<DailyAttendanceResponse> GetDailyAsync(int? sessionId, string? date, CancellationToken ct = default);
    Task<CheckoutAttendanceResponse> CheckoutAsync(long attendanceId, CheckoutAttendanceRequest request, int? actorId, CancellationToken ct = default);
    Task<AuditLogResponse?> GetCheckoutAuditAsync(long attendanceId, CancellationToken ct = default);
}