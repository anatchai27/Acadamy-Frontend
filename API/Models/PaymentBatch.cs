namespace academy_API.Models;

public class PaymentBatch : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public string InvoiceNo { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Method { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? SlipUrl { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public int? VerifiedBy { get; set; }
    public string? VerificationProvider { get; set; }
    public string? VerificationPayload { get; set; }
    public decimal? SlipAmount { get; set; }
    public string? SlipTransRef { get; set; }
    public string? ReceiptPdfUrl { get; set; }

    public Institute Institute { get; set; } = null!;
    public ICollection<PaymentBatchAllocation> Allocations { get; set; } = new List<PaymentBatchAllocation>();
}

public class PaymentBatchAllocation
{
    public long Id { get; set; }
    public long PaymentBatchId { get; set; }
    public int EnrollmentId { get; set; }
    public decimal Amount { get; set; }
    public string? ReceiptPdfUrl { get; set; }

    public PaymentBatch PaymentBatch { get; set; } = null!;
    public Enrollment Enrollment { get; set; } = null!;
}
