namespace academy_API.Models;

public class User : IMultiTenantEntity
{
    public int Id { get; set; }
    public int InstituteId { get; set; }
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public string? LineUserId { get; set; }
    public string PasswordHash { get; set; } = null!;
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Institute? Institute { get; set; }
    public Student? Student { get; set; }
    public Teacher? Teacher { get; set; }
}

public class UserCreateRequest
{
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public string? LineUserId { get; set; }
    public string Password { get; set; } = null!;
    public bool AcceptPdpa { get; set; }
    public string PdpaConsentVersion { get; set; } = "1.0";
}

public class RegisterUserRequest
{
    public InstituteInfo? Institute { get; set; }
    public AdminInfo? Admin { get; set; }
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? Phone { get; set; }
    public UserRole Role { get; set; } = UserRole.student;
    public string? LineUserId { get; set; }
    public bool AcceptPdpa { get; set; }
    public string PdpaConsentVersion { get; set; } = "1.0";
}

public class InstituteInfo
{
    public string Name { get; set; } = null!;
    public string? ContactPhone { get; set; }
    public string? LogoBase64 { get; set; }
}

public class AdminInfo
{
    public string FullName { get; set; } = null!;
}
