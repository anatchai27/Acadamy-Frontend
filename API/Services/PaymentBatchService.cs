using System.Text.Json;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;

namespace academy_API.Services;

public interface IPaymentBatchService
{
    Task<PaymentBatchResponse> CreateAsync(CreatePaymentBatchRequest request, CancellationToken ct = default);
    Task<PaymentBatchSlipVerificationResponse> VerifySlipAsync(long batchId, int? actorId, CancellationToken ct = default);
    Task<string> IssueReceiptAsync(long batchId, CancellationToken ct = default);
}

public sealed class PaymentBatchService(
    IPaymentBatchRepository repository,
    IPaymentRepository paymentRepository,
    IPaymentBatchReceiptService receiptService,
    ISlipVerificationProvider verificationProvider) : IPaymentBatchService
{
    public async Task<PaymentBatchResponse> CreateAsync(CreatePaymentBatchRequest request, CancellationToken ct = default)
    {
        if (request.Allocations is null || request.Allocations.Count == 0)
            throw new PaymentValidationException("ALLOCATIONS_REQUIRED", "เลือกอย่างน้อยหนึ่งรายการคอร์สเพื่อรับชำระ");
        if (request.Allocations.Count > 100)
            throw new PaymentValidationException("TOO_MANY_ALLOCATIONS", "บิลหนึ่งใบรองรับได้ไม่เกิน 100 รายการ");

        var method = request.Method.Trim().ToLowerInvariant();
        if (method is not ("cash" or "transfer"))
            throw new PaymentValidationException("INVALID_METHOD", "บิลรวมรองรับการชำระด้วยเงินสดหรือโอนเงิน");

        if (request.Allocations.Any(allocation => allocation.EnrollmentId <= 0 || allocation.Amount <= 0))
            throw new PaymentValidationException("INVALID_ALLOCATION", "ยอดจัดสรรแต่ละรายการต้องมากกว่า 0");
        if (request.Allocations.Select(allocation => allocation.EnrollmentId).Distinct().Count() != request.Allocations.Count)
            throw new PaymentValidationException("DUPLICATE_ENROLLMENT", "มีรายการลงทะเบียนซ้ำในบิล");

        var allocations = new List<PaymentBatchAllocation>();
        int? instituteId = null;
        foreach (var requestAllocation in request.Allocations)
        {
            var enrollment = await repository.GetEnrollmentAsync(requestAllocation.EnrollmentId, ct)
                ?? throw new PaymentValidationException("ENROLLMENT_NOT_FOUND", "ไม่พบรายการลงทะเบียนที่เลือก");

            if (instituteId.HasValue && instituteId.Value != enrollment.InstituteId)
                throw new PaymentValidationException("MIXED_INSTITUTES", "รวมรายการจากคนละสถาบันในบิลเดียวไม่ได้");
            instituteId = enrollment.InstituteId;

            var succeeded = await paymentRepository.GetSucceededAmountByEnrollmentAsync(enrollment.Id, ct);
            var pending = await paymentRepository.GetPendingAmountByEnrollmentAsync(enrollment.Id, ct);
            var due = Math.Max(enrollment.Course.Price - succeeded - pending, 0m);
            if (requestAllocation.Amount > due + 0.001m)
                throw new PaymentValidationException("AMOUNT_EXCEEDS_BALANCE", $"ยอดชำระของคอร์ส {enrollment.Course.Name} เกินยอดคงเหลือ");

            allocations.Add(new PaymentBatchAllocation
            {
                EnrollmentId = enrollment.Id,
                Enrollment = enrollment,
                Amount = decimal.Round(requestAllocation.Amount, 2, MidpointRounding.AwayFromZero),
            });
        }

        var now = DateTime.UtcNow;
        var batch = await repository.CreateAsync(new PaymentBatch
        {
            InstituteId = instituteId!.Value,
            InvoiceNo = await repository.GenerateInvoiceNoAsync(ct),
            Amount = allocations.Sum(allocation => allocation.Amount),
            Method = method,
            Status = method == "transfer" ? PaymentStatus.Pending : PaymentStatus.Succeeded,
            PaidAt = now,
            CreatedAt = now,
            Allocations = allocations,
        }, ct);

        string? receiptUrl = null;
        var message = method == "transfer" ? "สร้างบิลรวมแล้ว กรุณาแนบสลิปยอดรวม" : "รับชำระและจัดสรรยอดเรียบร้อยแล้ว";
        if (batch.Status == PaymentStatus.Succeeded)
        {
            try
            {
                receiptUrl = await receiptService.IssueAndNotifyAsync(batch, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch
            {
                message = "รับชำระแล้ว แต่สร้างใบเสร็จไม่สำเร็จ สามารถออกใบเสร็จใหม่จากประวัติการเงิน";
            }
        }

        batch.ReceiptPdfUrl = receiptUrl;
        return ToResponse(batch, message);
    }

    public async Task<PaymentBatchSlipVerificationResponse> VerifySlipAsync(long batchId, int? actorId, CancellationToken ct = default)
    {
        var batch = await repository.GetForVerificationAsync(batchId, ct)
            ?? throw new PaymentValidationException("PAYMENT_BATCH_NOT_FOUND", "ไม่พบบิลรวม");

        if (batch.Status == PaymentStatus.Succeeded)
        {
            var existingReceipt = string.IsNullOrWhiteSpace(batch.ReceiptPdfUrl)
                ? await receiptService.IssueAndNotifyAsync(batch, ct)
                : batch.ReceiptPdfUrl;
            return new PaymentBatchSlipVerificationResponse(batch.Id, true, batch.SlipAmount, batch.SlipTransRef, existingReceipt);
        }
        if (batch.Method != "transfer")
            throw new PaymentValidationException("INVALID_METHOD", "บิลนี้ไม่ได้ใช้การโอนเงิน");
        if (string.IsNullOrWhiteSpace(batch.SlipUrl))
            throw new PaymentValidationException("SLIP_NOT_FOUND", "บิลนี้ยังไม่มีสลิป");

        var result = await verificationProvider.VerifyAsync(batch.SlipUrl, batch.Amount, ct);
        if (result.IsDuplicate)
            throw new PaymentValidationException("DUPLICATE_SLIP", "สลิปนี้ถูกใช้แล้ว");
        if (!result.IsVerified)
            throw new PaymentValidationException("VERIFICATION_UNAVAILABLE", result.Reason);
        if (!result.Amount.HasValue || Math.Abs(result.Amount.Value - batch.Amount) > 0.01m)
            throw new PaymentValidationException("AMOUNT_MISMATCH", "ยอดในสลิปไม่ตรงกับยอดบิลรวม");

        batch.VerifiedAt = DateTime.UtcNow;
        batch.PaidAt = batch.VerifiedAt.Value;
        batch.VerifiedBy = actorId;
        batch.VerificationProvider = result.Provider;
        batch.VerificationPayload = JsonSerializer.Serialize(new { result.Provider, result.Reference, result.Amount });
        batch.SlipAmount = result.Amount;
        batch.SlipTransRef = result.Reference;
        if (!await repository.SaveVerifiedSlipAsync(batch, ct))
            throw new PaymentValidationException("ALREADY_VERIFIED", "บิลรวมนี้ถูกตรวจสอบแล้ว");

        batch.Status = PaymentStatus.Succeeded;
        string? receiptPdfUrl = null;
        try
        {
            receiptPdfUrl = await receiptService.IssueAndNotifyAsync(batch, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // Settlement is final even if receipt storage or notification needs a retry.
        }
        return new PaymentBatchSlipVerificationResponse(batch.Id, true, result.Amount, result.Reference, receiptPdfUrl);
    }

    public async Task<string> IssueReceiptAsync(long batchId, CancellationToken ct = default)
    {
        var batch = await repository.GetForVerificationAsync(batchId, ct)
            ?? throw new PaymentValidationException("PAYMENT_BATCH_NOT_FOUND", "ไม่พบบิลรวม");
        if (batch.Status != PaymentStatus.Succeeded)
            throw new PaymentValidationException("PAYMENT_NOT_SETTLED", "ยังออกใบเสร็จไม่ได้จนกว่าจะยืนยันการชำระเงินสำเร็จ");
        return string.IsNullOrWhiteSpace(batch.ReceiptPdfUrl)
            ? await receiptService.IssueAndNotifyAsync(batch, ct)
            : batch.ReceiptPdfUrl;
    }

    private static PaymentBatchResponse ToResponse(PaymentBatch batch, string message) => new(
        "success",
        message,
        new PaymentBatchData(
            batch.Id,
            batch.InvoiceNo,
            batch.Amount,
            batch.Status,
            batch.ReceiptPdfUrl,
            batch.Allocations.Select(allocation => new PaymentBatchAllocationResponse(
                allocation.EnrollmentId,
                allocation.Enrollment.StudentId,
                allocation.Enrollment.Student.FullName,
                allocation.Enrollment.Course.Name,
                allocation.Amount)).ToList()));
}
