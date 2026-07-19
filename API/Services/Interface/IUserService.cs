using academy_API.Models;

namespace academy_API.Services.Contracts;

public interface IUserService
{
    Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> GetByInstituteIdAsync(int instituteId, CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);
    Task<User> CreateWithConsentAsync(UserCreateRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<bool> IsDuplicateAsync(string email, string? phone, CancellationToken cancellationToken = default);
    Task<UserLoginResult?> LoginAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<bool> ForgetPasswordAsync(string email, string resetLink, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default);
    Task<CurrentUserResponse?> GetCurrentUserAsync(int userId, CancellationToken ct = default);
    Task<bool> UpdateRoleAsync(int id, UserRole role, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(int id, CancellationToken cancellationToken = default);
}

public record UserLoginResult(string Token, int UserId, string Email, string Role, int InstituteId);
public record CurrentUserResponse(string Status, CurrentUserData Data);
public record CurrentUserData(int UserId, string Email, string? Phone, string Role, int InstituteId, CurrentUserProfile Profile);
public record CurrentUserProfile(string FullName, string? PhotoUrl, string? Subjects);
