using System.Text.Json;

namespace academy_API.Services;

public interface ISlipVerificationProvider
{
    Task<SlipVerificationResult> VerifyAsync(string slipUrl, decimal expectedAmount, CancellationToken ct = default);
}

public sealed record SlipVerificationResult(
    bool IsVerified,
    decimal? Amount,
    string? Reference,
    string Reason,
    string Provider,
    JsonElement? RawPayload = null,
    bool IsDuplicate = false);

public sealed class UnconfiguredSlipVerificationProvider : ISlipVerificationProvider
{
    public Task<SlipVerificationResult> VerifyAsync(string slipUrl, decimal expectedAmount, CancellationToken ct = default) =>
        Task.FromResult(new SlipVerificationResult(
            false,
            null,
            null,
            "Slip verification provider is not configured.",
            "unconfigured"));
}
