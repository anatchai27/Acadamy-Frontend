namespace academy_API.Services.Interface;

public interface IOmisePromptPayGateway
{
    bool IsConfigured { get; }
    bool InstallmentsEnabled { get; }
    bool IsInstallmentPlanAvailable(decimal amount, string bankType, int installmentTerm);
    Task<OmiseCharge> CreateChargeAsync(decimal amount, string referenceId, string description, CancellationToken ct = default);
    Task<OmiseCharge> CreateInstallmentChargeAsync(decimal amount, string referenceId, string description, string bankType, int installmentTerm, int childId, long batchId, CancellationToken ct = default);
    Task<OmiseCharge> GetChargeAsync(string chargeId, CancellationToken ct = default);
    bool VerifyWebhookSignature(string timestamp, string signatures, byte[] rawBody);
}