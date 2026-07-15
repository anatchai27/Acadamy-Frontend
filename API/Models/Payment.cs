namespace academy_API.Models;

public class Payment
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = null!;
    public DateTime PaidAt { get; set; }
    public string? SlipUrl { get; set; }
    public string InvoiceNo { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    public Enrollment Enrollment { get; set; } = null!;
}
