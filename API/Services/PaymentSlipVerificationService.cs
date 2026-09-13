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
    ISlipVerificationProvider provider) : IPaymentSlipVerificationService
{
    public async Task<PaymentSlipVerificationResponse> VerifyAsync(long paymentId, int? actorId, CancellationToken ct = default)
    {
        var payment = await repository.GetPaymentForVerificationAsync(paymentId, ct)
            ?? throw new PaymentValidationException("PAYMENT_NOT_FOUND", "ไม่พบรายการชำระเงิน");
        if (string.IsNullOrWhiteSpace(payment.SlipUrl))
            throw new PaymentValidationException("SLIP_NOT_FOUND", "รายการชำระเงินยังไม่มีสลิป");
        if (payment.Status == PaymentStatus.Succeeded)
            throw new PaymentValidationException("ALREADY_VERIFIED", "รายการชำระเงินนี้ถูกตรวจสอบแล้ว");

        var result = await provider.VerifyAsync(payment.SlipUrl, ct);
        if (!result.IsVerified)
            throw new PaymentValidationException("VERIFICATION_UNAVAILABLE", result.Reason);
        if (!result.Amount.HasValue || Math.Abs(result.Amount.Value - payment.Amount) > 0.01m)
            throw new PaymentValidationException("AMOUNT_MISMATCH", "ยอดในสลิปไม่ตรงกับยอดชำระเงิน");

        payment.Status = PaymentStatus.Succeeded;
        payment.VerifiedAt = DateTime.UtcNow;
        payment.VerifiedBy = actorId;
        payment.VerificationProvider = result.Provider;
        payment.VerificationPayload = result.RawPayload?.GetRawText();
        payment.SlipAmount = result.Amount;
        payment.SlipTransRef = result.Reference;
        payment.SlipVerifiedAt = payment.VerifiedAt;
        await repository.SaveVerifiedSlipAsync(payment, ct);

        return new PaymentSlipVerificationResponse(payment.Id, true, result.Amount, result.Reference, null, result.Provider, payment.VerifiedAt);
    }
}
