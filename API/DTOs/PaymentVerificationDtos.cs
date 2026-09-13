namespace academy_API.DTOs;

public sealed record PaymentSlipVerificationResponse(
    long PaymentId,
    bool Verified,
    decimal? Amount,
    string? Reference,
    string? Reason,
    string Provider,
    DateTime? VerifiedAt);
