namespace academy_API.Services.Contracts;

public interface ILineNotificationService
{
    Task SendAttendanceNotificationAsync(
        string lineUserId,
        string studentName,
        string parentName,
        string checkinTime,
        string status,
        CancellationToken ct = default);

    Task SendPaymentNotificationAsync(
        string lineUserId,
        string parentName,
        string studentName,
        string courseName,
        decimal amount,
        string invoiceNo,
        string? receiptUrl,
        CancellationToken ct = default);
}
