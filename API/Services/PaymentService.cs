using academy_API.DTOs;

namespace academy_API.Services;

public interface IPaymentService
{
    Task<CreatePaymentResponse> CreateAsync(CreatePaymentRequest request, int? instituteId, CancellationToken ct = default);
    Task<PaymentHistoryResponse> GetHistoryAsync(
        int? instituteId, DateTime? startDate, DateTime? endDate, string? method,
        int page, int limit, CancellationToken ct = default);
}

public class PaymentService(
    Repositories.IPaymentRepository repository,
    Contracts.ILineNotificationService lineService) : IPaymentService
{
    private readonly Repositories.IPaymentRepository _repository = repository;
    private readonly Contracts.ILineNotificationService _lineService = lineService;

    public async Task<CreatePaymentResponse> CreateAsync(CreatePaymentRequest request, int? instituteId, CancellationToken ct = default)
    {
        var enrollment = await _repository.GetEnrollmentWithStudentAsync(request.EnrollmentId, instituteId, ct)
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

        var receiptPdfUrl = $"https://storage.tiwhub.com/receipts/{invoiceNo}.pdf";

        _ = Task.Run(async () =>
        {
            try
            {
                var parents = await _repository.GetParentsWithLineByStudentIdAsync(
                    enrollment.StudentId, CancellationToken.None);
                foreach (var parent in parents)
                {
                    if (!string.IsNullOrEmpty(parent.LineUserId))
                    {
                        await _lineService.SendPaymentNotificationAsync(
                            parent.LineUserId,
                            parent.FullName,
                            enrollment.Student.FullName,
                            enrollment.Course.Name,
                            request.Amount,
                            invoiceNo,
                            receiptPdfUrl,
                            CancellationToken.None);
                    }
                }
            }
            catch { }
        });

        return new CreatePaymentResponse(
            "success",
            "บันทึกการชำระเงินและส่งใบเสร็จสำเร็จ",
            new CreatePaymentData(created.Id, invoiceNo, receiptPdfUrl)
        );
    }

    public async Task<PaymentHistoryResponse> GetHistoryAsync(
        int? instituteId, DateTime? startDate, DateTime? endDate, string? method,
        int page, int limit, CancellationToken ct = default)
    {
        var paymentsTask = _repository.GetPaymentsAsync(instituteId, startDate, endDate, method, page, limit, ct);
        var totalAmountTask = _repository.GetTotalAmountAsync(instituteId, startDate, endDate, method, ct);
        var countTask = _repository.GetPaymentCountAsync(instituteId, startDate, endDate, method, ct);

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
}

public class PaymentValidationException : Exception
{
    public string ErrorCode { get; }
    public PaymentValidationException(string errorCode, string message) : base(message) => ErrorCode = errorCode;
}
