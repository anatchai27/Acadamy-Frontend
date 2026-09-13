using System.Text.Json;

namespace academy_API.Services;

public interface ISlipVerificationProvider
{
    Task<SlipVerificationResult> VerifyAsync(string slipUrl, CancellationToken ct = default);
}

public sealed record SlipVerificationResult(
    bool IsVerified,
    decimal? Amount,
    string? Reference,
    string Reason,
    string Provider,
    JsonElement? RawPayload = null);

public sealed class UnconfiguredSlipVerificationProvider : ISlipVerificationProvider
{
    public Task<SlipVerificationResult> VerifyAsync(string slipUrl, CancellationToken ct = default) =>
        Task.FromResult(new SlipVerificationResult(
            false,
            null,
            null,
            "Slip verification provider is not configured.",
            "unconfigured"));
}
