using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IPaymentSlipVerificationService
{
    Task<PaymentSlipVerificationResponse> VerifyAsync(long paymentId, int? actorId, CancellationToken ct = default);
}