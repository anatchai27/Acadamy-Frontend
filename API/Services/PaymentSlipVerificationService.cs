using System.Text.Json;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;

namespace academy_API.Services;

public sealed class PaymentSlipVerificationService(
    IPaymentRepository repository,
    ISlipVerificationProvider provider,
    IPaymentReceiptService paymentReceiptService) : IPaymentSlipVerificationService
{
    public async Task<PaymentSlipVerificationResponse> VerifyAsync(long paymentId, int? actorId, CancellationToken ct = default)
    {
        var payment = await repository.GetPaymentForVerificationAsync(paymentId, ct)
            ?? throw new PaymentValidationException("PAYMENT_NOT_FOUND", "ไม่พบรายการชำระเงิน");
        if (payment.Status == PaymentStatus.Succeeded)
        {
            var existingReceiptUrl = string.IsNullOrWhiteSpace(payment.ReceiptPdfUrl)
                ? await paymentReceiptService.IssueAndNotifyAsync(payment, ct)
                : payment.ReceiptPdfUrl;
            return new PaymentSlipVerificationResponse(
                payment.Id,
                true,
                payment.SlipAmount,
                payment.SlipTransRef,
                null,
                payment.VerificationProvider ?? "already-settled",
                payment.VerifiedAt,
                existingReceiptUrl);
        }
        if (string.IsNullOrWhiteSpace(payment.SlipUrl))
            throw new PaymentValidationException("SLIP_NOT_FOUND", "รายการชำระเงินยังไม่มีสลิป");

        var result = await provider.VerifyAsync(payment.SlipUrl, payment.Amount, ct);
        if (result.IsDuplicate)
            throw new PaymentValidationException("DUPLICATE_SLIP", "สลิปนี้ถูกใช้แล้ว");
        if (!result.IsVerified)
            throw new PaymentValidationException("VERIFICATION_UNAVAILABLE", result.Reason);
        if (!result.Amount.HasValue || Math.Abs(result.Amount.Value - payment.Amount) > 0.01m)
            throw new PaymentValidationException("AMOUNT_MISMATCH", "ยอดในสลิปไม่ตรงกับยอดชำระเงิน");

        payment.Status = PaymentStatus.Succeeded;
        payment.VerifiedAt = DateTime.UtcNow;
        payment.PaidAt = payment.VerifiedAt.Value;
        payment.VerifiedBy = actorId;
        payment.VerificationProvider = result.Provider;
        payment.VerificationPayload = JsonSerializer.Serialize(new
        {
            result.Provider,
            result.Reference,
            result.Amount,
            result.IsDuplicate
        });
        payment.SlipAmount = result.Amount;
        payment.SlipTransRef = result.Reference;
        payment.SlipVerifiedAt = payment.VerifiedAt;
        if (!await repository.SaveVerifiedSlipAsync(payment, ct))
            throw new PaymentValidationException("ALREADY_VERIFIED", "รายการชำระเงินนี้ถูกตรวจสอบแล้ว");

        var receiptPdfUrl = await paymentReceiptService.IssueAndNotifyAsync(payment, ct);

        return new PaymentSlipVerificationResponse(payment.Id, true, result.Amount, result.Reference, null, result.Provider, payment.VerifiedAt, receiptPdfUrl);
    }

    public async Task<PaymentSlipVerificationResponse> ConfirmManuallyAsync(long paymentId, int? actorId, CancellationToken ct = default)
    {
        var payment = await repository.GetPaymentForVerificationAsync(paymentId, ct)
            ?? throw new PaymentValidationException("PAYMENT_NOT_FOUND", "ไม่พบรายการชำระเงิน");
        if (payment.Status is not null && payment.Status != PaymentStatus.Pending)
            throw new PaymentValidationException("ALREADY_VERIFIED", "รายการชำระเงินนี้ไม่ได้อยู่ในสถานะรอตรวจสอบแล้ว");
        if (payment.Method != "transfer")
            throw new PaymentValidationException("INVALID_METHOD", "ยืนยันด้วยตนเองได้เฉพาะรายการโอนเงิน");
        if (string.IsNullOrWhiteSpace(payment.SlipUrl))
            throw new PaymentValidationException("SLIP_NOT_FOUND", "รายการชำระเงินยังไม่มีสลิป");

        var verifiedAt = DateTime.UtcNow;
        payment.Status = PaymentStatus.Succeeded;
        payment.PaidAt = verifiedAt;
        payment.VerifiedAt = verifiedAt;
        payment.VerifiedBy = actorId;
        payment.VerificationProvider = "manual";
        payment.VerificationPayload = JsonSerializer.Serialize(new
        {
            provider = "manual",
            method = "bank_statement",
            confirmedAmount = payment.Amount,
            verifiedBy = actorId,
            verifiedAt
        });
        payment.SlipAmount = null;
        payment.SlipTransRef = null;
        payment.SlipVerifiedAt = verifiedAt;

        if (!await repository.SaveVerifiedSlipAsync(payment, ct))
            throw new PaymentValidationException("ALREADY_VERIFIED", "รายการชำระเงินนี้ถูกตรวจสอบแล้ว");

        string? receiptPdfUrl = null;
        try
        {
            receiptPdfUrl = await paymentReceiptService.IssueAndNotifyAsync(payment, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // Settlement is final even if receipt storage or notification needs a retry.
        }

        return new PaymentSlipVerificationResponse(payment.Id, true, null, null, null, "manual", verifiedAt, receiptPdfUrl);
    }
}
