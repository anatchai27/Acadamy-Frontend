namespace academy_API.Models;

public class Institute
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? LogoUrl { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? TaxId { get; set; }
    public string? ReceiptNote { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
