namespace academy_API.Models;

public class PdpaConsent
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string ConsentVersion { get; set; } = null!;
    public bool IsAccepted { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public string? IpAddress { get; set; }

    public User? User { get; set; }
}
