using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IAttendanceRepository
{
    Task<Student?> ValidateQrTokenAsync(string qrToken, CancellationToken ct = default);
    Task<bool> IsDuplicateScanAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task<Attendance> RecordCheckinAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task<int> DecrementSessionsAsync(int studentId, CancellationToken ct = default);
    Task<Attendance> RecordManualAsync(int sessionId, int studentId, string status, CancellationToken ct = default);
    Task<List<DailyAttendanceRow>> GetDailyAttendanceAsync(int? sessionId, DateTime date, CancellationToken ct = default);
    Task<Session?> GetSessionByIdAsync(int sessionId, CancellationToken ct = default);
    Task<List<Parent>> GetParentsWithLineAsync(int studentId, CancellationToken ct = default);
    Task ScanCheckinWithTransactionAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task ManualCheckinWithTransactionAsync(int studentId, int sessionId, string status, CancellationToken ct = default);
    Task<long?> GetAttendanceIdAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task<int?> GetSessionsRemainingAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task<Attendance?> GetForCheckoutAsync(long attendanceId, CancellationToken ct = default);
    Task<StudentPickupAuthorization?> GetPickupAuthorizationAsync(long authorizationId, int studentId, CancellationToken ct = default);
    Task SaveCheckoutAsync(Attendance attendance, AuditLog auditLog, CancellationToken ct = default);
    Task<AuditLog?> GetCheckoutAuditAsync(long attendanceId, CancellationToken ct = default);
}