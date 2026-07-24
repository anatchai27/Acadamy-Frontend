namespace academy_API.Models;

public class WalletTransaction
{
    public int Id { get; set; }
    public int InstituteId { get; set; }
    public int WalletId { get; set; }
    public int Amount { get; set; }
    public string Reason { get; set; } = null!;
    public int? SessionId { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }

    public Institute Institute { get; set; } = null!;
    public StudentWallet Wallet { get; set; } = null!;
    public Session? Session { get; set; }
}