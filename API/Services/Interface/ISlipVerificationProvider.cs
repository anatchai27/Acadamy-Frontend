namespace academy_API.Services.Interface;

public interface ISlipVerificationProvider
{
    Task<SlipVerificationResult> VerifyAsync(string slipUrl, decimal expectedAmount, CancellationToken ct = default);
}