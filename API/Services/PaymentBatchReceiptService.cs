using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services.Interface;

namespace academy_API.Services;

public interface IPaymentBatchReceiptService
{
    Task<string> IssueAndNotifyAsync(PaymentBatch batch, CancellationToken ct = default);
}

public sealed class PaymentBatchReceiptService(
    IPaymentBatchRepository repository,
    IBackgroundNotificationDispatcher notificationDispatcher,
    IReceiptPdfService receiptPdfService,
    IFileStorageService fileStorageService) : IPaymentBatchReceiptService
{
    public async Task<string> IssueAndNotifyAsync(PaymentBatch batch, CancellationToken ct = default)
    {
        if (batch.Status != PaymentStatus.Succeeded)
            throw new InvalidOperationException("A receipt can only be issued for a succeeded payment batch.");
        if (string.IsNullOrWhiteSpace(batch.ReceiptPdfUrl))
        {
            var lines = batch.Allocations.Select(allocation => new ReceiptBatchPdfLine(
                allocation.Enrollment.Student.FullName,
                allocation.Enrollment.Course.Name,
                allocation.Amount)).ToList();
            var receiptBytes = receiptPdfService.RenderBatch(new ReceiptBatchPdfData(
                batch.InvoiceNo,
                lines,
                batch.Amount,
                batch.Method,
                batch.PaidAt));

            await using var receiptStream = new MemoryStream(receiptBytes);
            batch.ReceiptPdfUrl = await fileStorageService.UploadAsync(
                receiptStream,
                $"receipts/{batch.InvoiceNo}.pdf",
                "application/pdf",
                ct);
            await repository.SaveReceiptPdfUrlAsync(batch, ct);
        }

        foreach (var studentGroup in batch.Allocations.GroupBy(allocation => allocation.Enrollment.StudentId))
        {
            var student = studentGroup.First().Enrollment.Student;
            var courseNames = string.Join(", ", studentGroup.Select(allocation => allocation.Enrollment.Course.Name).Distinct());
            var studentAmount = studentGroup.Sum(allocation => allocation.Amount);
            var studentReceiptUrl = studentGroup.Select(allocation => allocation.ReceiptPdfUrl).FirstOrDefault(url => !string.IsNullOrWhiteSpace(url));
            if (string.IsNullOrWhiteSpace(studentReceiptUrl))
            {
                var studentLines = studentGroup.Select(allocation => new ReceiptBatchPdfLine(
                    student.FullName,
                    allocation.Enrollment.Course.Name,
                    allocation.Amount)).ToList();
                var studentReceiptBytes = receiptPdfService.RenderBatch(new ReceiptBatchPdfData(
                    batch.InvoiceNo,
                    studentLines,
                    studentAmount,
                    batch.Method,
                    batch.PaidAt));
                await using var studentReceiptStream = new MemoryStream(studentReceiptBytes);
                studentReceiptUrl = await fileStorageService.UploadAsync(
                    studentReceiptStream,
                    $"receipts/{batch.InvoiceNo}-student-{student.Id}.pdf",
                    "application/pdf",
                    ct);
                foreach (var allocation in studentGroup) allocation.ReceiptPdfUrl = studentReceiptUrl;
                await repository.SaveReceiptPdfUrlAsync(batch, ct);
            }

            foreach (var parent in student.Parents.Where(parent => parent.IsActive && parent.UserId.HasValue && !string.IsNullOrEmpty(parent.LineUserId)).DistinctBy(parent => parent.Id))
            {
                await notificationDispatcher.DispatchAsync(new BackgroundNotificationCandidate(
                    parent.UserId!.Value,
                    batch.InstituteId,
                    parent.LineUserId!,
                    student.FullName,
                    parent.FullName,
                    NotificationMessageFactory.PaymentReceived(
                        parent.FullName,
                        student.FullName,
                        courseNames,
                        studentAmount,
                        batch.InvoiceNo,
                        studentReceiptUrl),
                    "payment_received",
                    $"payment_batch_received:{batch.Id}:{parent.Id}"), ct);
            }
        }

        return batch.ReceiptPdfUrl!;
    }
}
