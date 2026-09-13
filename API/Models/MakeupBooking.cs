namespace academy_API.Models;

public class MakeupBooking : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public int SlotId { get; set; }
    public int StudentId { get; set; }
    public long CreditId { get; set; }
    public string? IdempotencyKey { get; set; }
    public string Status { get; set; } = null!;
    public byte? ActiveMarker { get; set; }
    public DateTime BookedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }
    public DateTime? CheckedInAt { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
}
