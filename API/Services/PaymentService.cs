using academy_API.DTOs;
using academy_API.Models;
using System.Globalization;
using System.Text;

namespace academy_API.Services;

public interface IPaymentService
{
    Task<CreatePaymentResponse> CreateAsync(CreatePaymentRequest request, CancellationToken ct = default);
    Task<string> IssueReceiptAsync(long paymentId, CancellationToken ct = default);
    Task<PaymentHistoryResponse> GetHistoryAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        int page, int limit, CancellationToken ct = default);
    Task<byte[]> ExportCsvAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default);
}

public class PaymentService(
    Repositories.IPaymentRepository repository,
    IPaymentReceiptService paymentReceiptService) : IPaymentService
{
    private readonly Repositories.IPaymentRepository _repository = repository;
    private readonly IPaymentReceiptService _paymentReceiptService = paymentReceiptService;

    public async Task<CreatePaymentResponse> CreateAsync(CreatePaymentRequest request, CancellationToken ct = default)
    {
        var enrollment = await _repository.GetEnrollmentWithStudentAsync(request.EnrollmentId, ct)
            ?? throw new PaymentValidationException("ENROLLMENT_NOT_FOUND", "ไม่พบข้อมูลการลงทะเบียน");

        var validMethods = new HashSet<string> { "transfer", "credit_card", "cash" };
        if (!validMethods.Contains(request.Method))
            throw new PaymentValidationException("INVALID_METHOD", "รูปแบบการชำระเงินไม่ถูกต้อง (transfer, credit_card, cash)");

        if (request.Amount <= 0)
            throw new PaymentValidationException("INVALID_AMOUNT", "จำนวนเงินต้องมากกว่า 0");

        var succeededAmount = await _repository.GetSucceededAmountByEnrollmentAsync(request.EnrollmentId, ct);
        var pendingAmount = await _repository.GetPendingAmountByEnrollmentAsync(request.EnrollmentId, ct);
        var amountDue = enrollment.Course.Price - succeededAmount - pendingAmount;
        if (request.Amount > amountDue)
            throw new PaymentValidationException("AMOUNT_EXCEEDS_BALANCE", "ยอดชำระเกินยอดคงเหลือของการลงทะเบียน");

        var invoiceNo = await _repository.GenerateInvoiceNoAsync(ct);

        var payment = new Models.Payment
        {
            EnrollmentId = request.EnrollmentId,
            InstituteId = enrollment.InstituteId,
            InvoiceNo = invoiceNo,
            Amount = request.Amount,
            Method = request.Method,
            Status = request.Method == "transfer" ? PaymentStatus.Pending : PaymentStatus.Succeeded,
            NetAmount = request.Amount,
            SlipUrl = string.IsNullOrWhiteSpace(request.SlipUrl) ? null : request.SlipUrl.Trim(),
            PaidAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Enrollment = enrollment
        };

        var created = await _repository.CreatePaymentWithTransactionAsync(payment, ct);
        created.Enrollment = enrollment;
        string? receiptPdfUrl = null;
        if (created.Status == PaymentStatus.Succeeded)
        {
            try
            {
                receiptPdfUrl = await _paymentReceiptService.IssueAndNotifyAsync(created, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch
            {
                return new CreatePaymentResponse(
                    "success",
                    "รับชำระสำเร็จแล้ว แต่สร้างใบเสร็จไม่สำเร็จ สามารถกดออกใบเสร็จอีกครั้งจากประวัติการเงิน",
                    new CreatePaymentData(created.Id, invoiceNo, null));
            }
        }

        return new CreatePaymentResponse(
            "success",
            created.Status == PaymentStatus.Succeeded && receiptPdfUrl is not null
                ? "บันทึกการชำระเงินและส่งใบเสร็จสำเร็จ"
                : created.Status == PaymentStatus.Succeeded
                    ? "รับชำระสำเร็จแล้ว แต่สร้างใบเสร็จไม่สำเร็จ สามารถกดออกใบเสร็จอีกครั้งจากประวัติการเงิน"
                    : "บันทึกรายการแล้ว กรุณารอการตรวจสอบสลิป",
            new CreatePaymentData(created.Id, invoiceNo, receiptPdfUrl)
        );
    }

    public async Task<string> IssueReceiptAsync(long paymentId, CancellationToken ct = default)
    {
        var payment = await _repository.GetPaymentForReceiptAsync(paymentId, ct)
            ?? throw new PaymentValidationException("PAYMENT_NOT_FOUND", "ไม่พบรายการชำระเงิน");
        if (payment.Status != PaymentStatus.Succeeded)
            throw new PaymentValidationException("PAYMENT_NOT_SETTLED", "ยังออกใบเสร็จไม่ได้จนกว่าจะยืนยันการชำระเงินสำเร็จ");
        if (!string.IsNullOrWhiteSpace(payment.ReceiptPdfUrl))
            return payment.ReceiptPdfUrl;

        return await _paymentReceiptService.IssueAndNotifyAsync(payment, ct);
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

        var items = payments.Select(p => new PaymentHistoryItem(
            p.Id,
            p.InvoiceNo,
            p.Enrollment?.Student?.FullName,
            p.Enrollment?.Course?.Name,
            p.Amount,
            p.Method,
            p.Status ?? PaymentStatus.Pending,
            p.PaidAt,
            p.SlipUrl,
            p.ReceiptPdfUrl,
            p.Enrollment?.Course?.NameEn
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
        csv.AppendLine("invoice_no,student_name,course_name,amount,net_amount,method,status,paid_at");
        foreach (var payment in payments)
        {
            csv.Append(EscapeCsv(payment.InvoiceNo)).Append(',')
                .Append(EscapeCsv(payment.Enrollment?.Student?.FullName)).Append(',')
                .Append(EscapeCsv(payment.Enrollment?.Course?.Name)).Append(',')
                .Append(payment.Amount.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append((payment.NetAmount ?? payment.Amount).ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(EscapeCsv(payment.Method)).Append(',')
                .Append(EscapeCsv(payment.Status ?? PaymentStatus.Pending)).Append(',')
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
