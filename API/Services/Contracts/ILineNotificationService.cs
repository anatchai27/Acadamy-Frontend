namespace academy_API.Services.Contracts;

public interface ILineNotificationService
{
    Task SendTextMessageAsync(string lineUserId, string message, CancellationToken ct = default);

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
