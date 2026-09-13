namespace academy_API.Models;

public static class PaymentStatus
{
    public const string Pending = "pending";
    public const string Succeeded = "succeeded";
    public const string Failed = "failed";
    public const string Cancelled = "cancelled";
    public const string PartiallyRefunded = "partially_refunded";
    public const string Refunded = "refunded";
}
