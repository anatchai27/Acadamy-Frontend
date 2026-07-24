namespace academy_API.Models;

public class StudentWallet : IMultiTenantEntity
{
    public int Id { get; set; }
    public int InstituteId { get; set; }
    public int StudentId { get; set; }
    public int Balance { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Institute Institute { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}