namespace academy_API.Models;

public class Student : IMultiTenantEntity
{
    public int Id { get; set; }
    public int InstituteId { get; set; }
    public int? UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string? Nickname { get; set; }
    public string? Grade { get; set; }
    public string? School { get; set; }
    public string? QrToken { get; set; }
    public string? PhotoUrl { get; set; }
    public string? MedicalInfo { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public string? Status { get; set; }
    public DateTime? QrTokenExpiresAt { get; set; }
    public int QrTokenVersion { get; set; }

    public Institute? Institute { get; set; }
    public User? User { get; set; }
    public ICollection<Parent> Parents { get; set; } = new List<Parent>();
}
