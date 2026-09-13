namespace academy_API.Services;

public sealed record BackgroundNotificationCandidate(
    int UserId,
    int InstituteId,
    string RecipientId,
    string StudentName,
    string ParentName,
    string Message,
    string NotificationType,
    string IdempotencyKey);

public sealed record BackgroundNotificationResult(
    bool Sent,
    bool Skipped,
    int Attempts,
    long? NotificationId);

public static class NotificationMessageFactory
{
    public static string AttendanceCheckin(
        string studentName,
        string parentName,
        string checkinTime,
        string status) =>
        $"📢 แจ้งเตือนการเช็คชื่อ\n\n" +
        $"👤 นักเรียน: {studentName}\n" +
        $"📋 สถานะ: {status}\n" +
        $"🕐 เวลา: {checkinTime}\n\n" +
        $"เรียนคุณ{parentName}\n" +
        "บุตรหลานของท่านได้เช็คชื่อเข้าเรียนเรียบร้อยแล้ว";

    public static string AttendanceCheckout(
        string studentName,
        string parentName,
        string pickedUpBy,
        string checkoutTime) =>
        $"แจ้งเตือนการรับกลับ\n\nนักเรียน: {studentName}\nผู้รับ: {pickedUpBy}\nเวลา: {checkoutTime}\n\nเรียนคุณ{parentName}";

    public static string PaymentReceived(
        string parentName,
        string studentName,
        string courseName,
        decimal amount,
        string invoiceNo,
        string? receiptUrl)
    {
        var message =
            $"🧾 ใบเสร็จรับเงิน\n\n" +
            $"📚 คอร์ส: {courseName}\n" +
            $"👤 นักเรียน: {studentName}\n" +
            $"💰 จำนวน: {amount:N2} บาท\n" +
            $"🧾 เลขที่: {invoiceNo}\n\n" +
            $"เรียนคุณ{parentName}\n" +
            "ระบบได้รับชำระเงินเรียบร้อยแล้ว";

        return string.IsNullOrEmpty(receiptUrl)
            ? message
            : $"{message}\n📄 ดาวน์โหลดใบเสร็จ: {receiptUrl}";
    }
}
