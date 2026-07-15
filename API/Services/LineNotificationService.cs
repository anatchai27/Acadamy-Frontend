using System.Net.Http.Json;
using academy_API.Services.Contracts;

namespace academy_API.Services;

public class LineNotificationService(HttpClient httpClient) : ILineNotificationService
{
    private readonly HttpClient _httpClient = httpClient;

    public async Task SendAttendanceNotificationAsync(
        string lineUserId,
        string studentName,
        string parentName,
        string checkinTime,
        string status,
        CancellationToken ct = default)
    {
        var messages = new List<object>
        {
            new
            {
                type = "text",
                text = $"📢 แจ้งเตือนการเช็คชื่อ\n\n" +
                       $"👤 นักเรียน: {studentName}\n" +
                       $"📋 สถานะ: {status}\n" +
                       $"🕐 เวลา: {checkinTime}\n\n" +
                       $"เรียนคุณ{parentName}\n" +
                       $"บุตรหลานของท่านได้เช็คชื่อเข้าเรียนเรียบร้อยแล้ว"
            }
        };

        var payload = new
        {
            to = lineUserId,
            messages
        };

        await _httpClient.PostAsJsonAsync("https://api.line.me/v2/bot/message/push", payload, ct);
    }

    public async Task SendPaymentNotificationAsync(
        string lineUserId,
        string parentName,
        string studentName,
        string courseName,
        decimal amount,
        string invoiceNo,
        string? receiptUrl,
        CancellationToken ct = default)
    {
        var messages = new List<object>
        {
            new
            {
                type = "text",
                text = $"🧾 ใบเสร็จรับเงิน\n\n" +
                       $"📚 คอร์ส: {courseName}\n" +
                       $"👤 นักเรียน: {studentName}\n" +
                       $"💰 จำนวน: {amount:N2} บาท\n" +
                       $"🧾 เลขที่: {invoiceNo}\n\n" +
                       $"เรียนคุณ{parentName}\n" +
                       $"ระบบได้รับชำระเงินเรียบร้อยแล้ว"
            }
        };

        if (!string.IsNullOrEmpty(receiptUrl))
        {
            messages.Add(new { type = "text", text = $"📄 ดาวน์โหลดใบเสร็จ: {receiptUrl}" });
        }

        var payload = new { to = lineUserId, messages };
        await _httpClient.PostAsJsonAsync("https://api.line.me/v2/bot/message/push", payload, ct);
    }
}
