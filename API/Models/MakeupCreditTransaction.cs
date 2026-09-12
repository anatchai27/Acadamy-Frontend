namespace academy_API.Models;

public class MakeupCreditTransaction : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public long CreditId { get; set; }
    public int StudentId { get; set; }
    public string TransactionType { get; set; } = null!;
    public short Amount { get; set; }
    public string? ReferenceType { get; set; }
    public long? ReferenceId { get; set; }
    public string? Note { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}
