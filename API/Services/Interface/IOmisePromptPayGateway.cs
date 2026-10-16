namespace academy_API.Services.Interface;

public interface IOmisePromptPayGateway
{
    Task<OmiseCharge> CreateChargeAsync(decimal amount, string referenceId, string description, CancellationToken ct = default);
    Task<OmiseCharge> GetChargeAsync(string chargeId, CancellationToken ct = default);
    bool VerifyWebhookSignature(string timestamp, string signatures, byte[] rawBody);
}