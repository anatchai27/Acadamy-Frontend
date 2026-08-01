namespace academy_API.Models;

public class Payment : IMultiTenantEntity
{
    public long Id { get; set; }
    public int EnrollmentId { get; set; }
    public int InstituteId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = null!;
    public DateTime PaidAt { get; set; }
    public string? SlipUrl { get; set; }
    public string InvoiceNo { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public decimal? DiscountAmount { get; set; }
    public string? Status { get; set; }
    public string? GatewayRefId { get; set; }
    public decimal? NetAmount { get; set; }
    public string? QrPayload { get; set; }
    public DateTime? QrExpiresAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public int? VerifiedBy { get; set; }
    public string? VerificationProvider { get; set; }
    public string? VerificationPayload { get; set; }
    public decimal? SlipAmount { get; set; }
    public string? SlipTransRef { get; set; }
    public DateTime? SlipVerifiedAt { get; set; }

    public Enrollment Enrollment { get; set; } = null!;
    public Institute Institute { get; set; } = null!;
}
