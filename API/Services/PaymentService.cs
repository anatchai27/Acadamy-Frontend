using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories.Interface;
using System.Globalization;
using System.Text;

namespace academy_API.Services;

public class PaymentService(
    IPaymentRepository repository,
    IPaymentReceiptService paymentReceiptService,
    IPaymentBatchRepository? batchRepository = null) : IPaymentService
{
    private const int PendingSlipPreviewLimit = 50;
    private readonly IPaymentRepository _repository = repository;
    private readonly IPaymentReceiptService _paymentReceiptService = paymentReceiptService;
    private readonly IPaymentBatchRepository? _batchRepository = batchRepository;

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
        var fetchLimit = Math.Max(page * limit, limit);

        // Both repositories share the request-scoped EF Core DbContext. Do not
        // run these queries concurrently: DbContext does not support parallel operations.
        var payments = await _repository.GetPaymentsAsync(startDate, endDate, method, 1, fetchLimit, ct);
        var paymentTotalAmount = await _repository.GetTotalAmountAsync(startDate, endDate, method, ct);
        var paymentCount = await _repository.GetPaymentCountAsync(startDate, endDate, method, ct);
        var batches = _batchRepository is null
            ? new List<PaymentBatch>()
            : await _batchRepository.GetHistoryAsync(startDate, endDate, method, fetchLimit, ct);
        var batchTotalAmount = _batchRepository is null
            ? 0m
            : await _batchRepository.GetTotalAmountAsync(startDate, endDate, method, ct);
        var batchCount = _batchRepository is null
            ? 0
            : await _batchRepository.GetBatchCountAsync(startDate, endDate, method, ct);

        var totalAmount = paymentTotalAmount + batchTotalAmount;
        var totalCount = paymentCount + batchCount;

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
        )).Concat(batches.Select(batch => new PaymentHistoryItem(
            -batch.Id,
            batch.InvoiceNo,
            string.Join(", ", batch.Allocations.Select(allocation => allocation.Enrollment.Student.FullName).Distinct()),
            string.Join(", ", batch.Allocations.Select(allocation => allocation.Enrollment.Course.Name).Distinct()),
            batch.Amount,
            batch.Method,
            batch.Status,
            batch.PaidAt,
            batch.SlipUrl,
            batch.ReceiptPdfUrl,
            null,
            true,
            batch.Id
        )))
            .OrderByDescending(item => item.PaidAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToList();

        return new PaymentHistoryResponse(
            "success",
            new PaymentHistoryData(
                items,
                new PaymentSummary(totalAmount),
                new PaymentPagination(page, totalPages)
            )
        );
    }

    public async Task<PendingSlipReviewResponse> GetPendingSlipReviewsAsync(CancellationToken ct = default)
    {
        var paymentCount = await _repository.CountPendingSlipPaymentsAsync(ct);
        var payments = await _repository.GetPendingSlipPaymentsAsync(PendingSlipPreviewLimit, ct);
        var batches = _batchRepository is null
            ? new List<PaymentBatch>()
            : await _batchRepository.GetPendingSlipBatchesAsync(PendingSlipPreviewLimit, ct);
        var batchCount = _batchRepository is null
            ? 0
            : await _batchRepository.CountPendingSlipBatchesAsync(ct);

        var items = payments.Select(payment => new PaymentHistoryItem(
            payment.Id,
            payment.InvoiceNo,
            payment.Enrollment?.Student?.FullName,
            payment.Enrollment?.Course?.Name,
            payment.Amount,
            payment.Method,
            payment.Status ?? PaymentStatus.Pending,
            payment.CreatedAt,
            payment.SlipUrl,
            payment.ReceiptPdfUrl))
            .Concat(batches.Select(batch => new PaymentHistoryItem(
                -batch.Id,
                batch.InvoiceNo,
                string.Join(", ", batch.Allocations.Select(allocation => allocation.Enrollment.Student.FullName).Distinct()),
                string.Join(", ", batch.Allocations.Select(allocation => allocation.Enrollment.Course.Name).Distinct()),
                batch.Amount,
                batch.Method,
                batch.Status,
                batch.CreatedAt,
                batch.SlipUrl,
                batch.ReceiptPdfUrl,
                null,
                true,
                batch.Id)))
            .OrderByDescending(item => item.PaidAt)
            .Take(PendingSlipPreviewLimit)
            .ToList();

        return new PendingSlipReviewResponse(paymentCount + batchCount, items);
    }

    public async Task<byte[]> ExportCsvAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default)
    {
        var payments = await _repository.GetPaymentsForExportAsync(startDate, endDate, method, ct);
        var batches = _batchRepository is null
            ? new List<PaymentBatch>()
            : await _batchRepository.GetBatchesForExportAsync(startDate, endDate, method, ct);
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

        foreach (var batch in batches)
        {
            var studentNames = string.Join("; ", batch.Allocations.Select(allocation => allocation.Enrollment.Student.FullName).Distinct());
            var courseNames = string.Join("; ", batch.Allocations.Select(allocation => allocation.Enrollment.Course.Name).Distinct());
            csv.Append(EscapeCsv(batch.InvoiceNo)).Append(',')
                .Append(EscapeCsv(studentNames)).Append(',')
                .Append(EscapeCsv(courseNames)).Append(',')
                .Append(batch.Amount.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(batch.Amount.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(EscapeCsv(batch.Method)).Append(',')
                .Append(EscapeCsv(batch.Status)).Append(',')
                .Append(batch.PaidAt.ToString("O", CultureInfo.InvariantCulture)).AppendLine();
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

