namespace academy_API.Models;

public class WalletTransaction : IMultiTenantEntity
{
    public long Id { get; set; }
    public int InstituteId { get; set; }
    public int WalletId { get; set; }
    public int Amount { get; set; }
    public string TransactionType { get; set; } = null!;
    public int RunningBalance { get; set; }
    public string? ReferenceType { get; set; }
    public long? ReferenceId { get; set; }
    public string? Description { get; set; }
    public bool IsReversed { get; set; }
    public DateTime CreatedAt { get; set; }

    public Institute Institute { get; set; } = null!;
    public StudentWallet Wallet { get; set; } = null!;
}