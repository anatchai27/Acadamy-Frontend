namespace academy_API.Models;

public class RolePermission
{
    public int Id { get; set; }
    public int InstituteId { get; set; }
    public UserRole Role { get; set; }
    public string PageKey { get; set; } = string.Empty;
    public bool CanRead { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
