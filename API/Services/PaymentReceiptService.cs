using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services.Interface;

namespace academy_API.Services;

public interface IPaymentReceiptService
{
    Task<string> IssueAndNotifyAsync(Payment payment, CancellationToken ct = default);
}

public sealed class PaymentReceiptService(
    IPaymentRepository repository,
    IBackgroundNotificationDispatcher notificationDispatcher,
    IReceiptPdfService receiptPdfService,
    IFileStorageService fileStorageService) : IPaymentReceiptService
{
    public async Task<string> IssueAndNotifyAsync(Payment payment, CancellationToken ct = default)
    {
        if (payment.Status != PaymentStatus.Succeeded)
            throw new InvalidOperationException("A receipt can only be issued for a succeeded payment.");

        var enrollment = payment.Enrollment
            ?? throw new InvalidOperationException("Payment enrollment details are unavailable.");
        var receiptBytes = receiptPdfService.Render(new ReceiptPdfData(
            payment.InvoiceNo,
            enrollment.Student.FullName,
            enrollment.Course.Name,
            payment.Amount,
            payment.Method,
            payment.PaidAt));

        await using var receiptStream = new MemoryStream(receiptBytes);
        var receiptPdfUrl = await fileStorageService.UploadAsync(
            receiptStream,
            $"receipts/{payment.InvoiceNo}.pdf",
            "application/pdf",
            ct);
        payment.ReceiptPdfUrl = receiptPdfUrl;
        await repository.SaveReceiptPdfUrlAsync(payment, ct);

        var parents = await repository.GetParentsWithLineByStudentIdAsync(enrollment.StudentId, ct);
        foreach (var parent in parents)
        {
            if (parent.UserId is null || string.IsNullOrEmpty(parent.LineUserId))
                continue;

            await notificationDispatcher.DispatchAsync(new BackgroundNotificationCandidate(
                parent.UserId.Value,
                enrollment.InstituteId,
                parent.LineUserId,
                enrollment.Student.FullName,
                parent.FullName,
                NotificationMessageFactory.PaymentReceived(
                    parent.FullName,
                    enrollment.Student.FullName,
                    enrollment.Course.Name,
                    payment.Amount,
                    payment.InvoiceNo,
                    receiptPdfUrl),
                "payment_received",
                $"payment_received:{payment.Id}:{parent.Id}"), ct);
        }

        return receiptPdfUrl;
    }
}
