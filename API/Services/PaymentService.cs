using academy_API.DTOs;
using System.Globalization;
using System.Text;

namespace academy_API.Services;

public interface IPaymentService
{
    Task<CreatePaymentResponse> CreateAsync(CreatePaymentRequest request, CancellationToken ct = default);
    Task<PaymentHistoryResponse> GetHistoryAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        int page, int limit, CancellationToken ct = default);
    Task<byte[]> ExportCsvAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default);
}

public class PaymentService(
    Repositories.IPaymentRepository repository,
    IBackgroundNotificationDispatcher notificationDispatcher,
    IReceiptPdfService receiptPdfService,
    Interface.IFileStorageService fileStorageService) : IPaymentService
{
    private readonly Repositories.IPaymentRepository _repository = repository;
    private readonly IBackgroundNotificationDispatcher _notificationDispatcher = notificationDispatcher;
    private readonly IReceiptPdfService _receiptPdfService = receiptPdfService;
    private readonly Interface.IFileStorageService _fileStorageService = fileStorageService;

    public async Task<CreatePaymentResponse> CreateAsync(CreatePaymentRequest request, CancellationToken ct = default)
    {
        var enrollment = await _repository.GetEnrollmentWithStudentAsync(request.EnrollmentId, ct)
            ?? throw new PaymentValidationException("ENROLLMENT_NOT_FOUND", "ไม่พบข้อมูลการลงทะเบียน");

        var validMethods = new HashSet<string> { "transfer", "credit_card", "cash" };
        if (!validMethods.Contains(request.Method))
            throw new PaymentValidationException("INVALID_METHOD", "รูปแบบการชำระเงินไม่ถูกต้อง (transfer, credit_card, cash)");

        if (request.Amount <= 0)
            throw new PaymentValidationException("INVALID_AMOUNT", "จำนวนเงินต้องมากกว่า 0");

        var invoiceNo = await _repository.GenerateInvoiceNoAsync(ct);

        var payment = new Models.Payment
        {
            EnrollmentId = request.EnrollmentId,
            InvoiceNo = invoiceNo,
            Amount = request.Amount,
            Method = request.Method,
            SlipUrl = request.SlipUrl?.Trim(),
            PaidAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreatePaymentWithTransactionAsync(payment, ct);

        var receiptBytes = _receiptPdfService.Render(new ReceiptPdfData(
            invoiceNo,
            enrollment.Student.FullName,
            enrollment.Course.Name,
            created.Amount,
            created.Method,
            created.PaidAt));
        await using var receiptStream = new MemoryStream(receiptBytes);
        var receiptPdfUrl = await _fileStorageService.UploadAsync(
            receiptStream,
            $"receipts/{invoiceNo}.pdf",
            "application/pdf",
            ct);

        var parents = await _repository.GetParentsWithLineByStudentIdAsync(
            enrollment.StudentId, CancellationToken.None);
        foreach (var parent in parents)
        {
            if (parent.UserId is null || string.IsNullOrEmpty(parent.LineUserId))
                continue;

            await _notificationDispatcher.DispatchAsync(new BackgroundNotificationCandidate(
                parent.UserId.Value,
                enrollment.InstituteId,
                parent.LineUserId,
                enrollment.Student.FullName,
                parent.FullName,
                NotificationMessageFactory.PaymentReceived(
                    parent.FullName,
                    enrollment.Student.FullName,
                    enrollment.Course.Name,
                    created.Amount,
                    invoiceNo,
                    receiptPdfUrl),
                "payment_received",
                $"payment_received:{created.Id}:{parent.Id}"),
                CancellationToken.None);
        }

        return new CreatePaymentResponse(
            "success",
            "บันทึกการชำระเงินและส่งใบเสร็จสำเร็จ",
            new CreatePaymentData(created.Id, invoiceNo, receiptPdfUrl)
        );
    }

    public async Task<PaymentHistoryResponse> GetHistoryAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        int page, int limit, CancellationToken ct = default)
    {
        var paymentsTask = _repository.GetPaymentsAsync(startDate, endDate, method, page, limit, ct);
        var totalAmountTask = _repository.GetTotalAmountAsync(startDate, endDate, method, ct);
        var countTask = _repository.GetPaymentCountAsync(startDate, endDate, method, ct);

        var payments = await paymentsTask;
        var totalAmount = await totalAmountTask;
        var totalCount = await countTask;

        var totalPages = totalCount > 0
            ? (int)Math.Ceiling((double)totalCount / limit)
            : 1;

        var receiptBaseUrl = "https://storage.tiwhub.com/receipts";
        var items = payments.Select(p => new PaymentHistoryItem(
            p.Id,
            p.InvoiceNo,
            p.Enrollment?.Student?.FullName,
            p.Enrollment?.Course?.Name,
            p.Amount,
            p.Method,
            p.PaidAt,
            p.SlipUrl,
            $"{receiptBaseUrl}/{p.InvoiceNo}.pdf"
        )).ToList();

        return new PaymentHistoryResponse(
            "success",
            new PaymentHistoryData(
                items,
                new PaymentSummary(totalAmount),
                new PaymentPagination(page, totalPages)
            )
        );
    }

    public async Task<byte[]> ExportCsvAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default)
    {
        var payments = await _repository.GetPaymentsForExportAsync(startDate, endDate, method, ct);
        var csv = new StringBuilder();
        csv.AppendLine("invoice_no,student_name,course_name,amount,method,paid_at");
        foreach (var payment in payments)
        {
            csv.Append(EscapeCsv(payment.InvoiceNo)).Append(',')
                .Append(EscapeCsv(payment.Enrollment?.Student?.FullName)).Append(',')
                .Append(EscapeCsv(payment.Enrollment?.Course?.Name)).Append(',')
                .Append(payment.Amount.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(EscapeCsv(payment.Method)).Append(',')
                .Append(payment.PaidAt.ToString("O", CultureInfo.InvariantCulture)).AppendLine();
        }

        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
    }

    private static string EscapeCsv(string? value)
    {
        var text = value ?? string.Empty;
        return text.Contains(',') || text.Contains('"') || text.Contains('\n')
            ? $"\"{text.Replace("\"", "\"\"")}\""
            : text;
    }
}

public class PaymentValidationException : Exception
{
    public string ErrorCode { get; }
    public PaymentValidationException(string errorCode, string message) : base(message) => ErrorCode = errorCode;
}
