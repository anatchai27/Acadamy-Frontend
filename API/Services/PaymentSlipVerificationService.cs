using System.Text.Json;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;

namespace academy_API.Services;

public interface IPaymentSlipVerificationService
{
    Task<PaymentSlipVerificationResponse> VerifyAsync(long paymentId, int? actorId, CancellationToken ct = default);
}

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
}
