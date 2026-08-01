namespace academy_API.Models;

public class Parent : IMultiTenantEntity
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public int StudentId { get; set; }
    public int InstituteId { get; set; }
    public string FullName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string? LineUserId { get; set; }
    public string? Relationship { get; set; }
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; }

    public User? User { get; set; }
    public Student Student { get; set; } = null!;
    public Institute Institute { get; set; } = null!;
}
