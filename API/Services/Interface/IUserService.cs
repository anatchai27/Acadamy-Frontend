using academy_API.Models;
using academy_API.DTOs;

namespace academy_API.Services.Contracts;

public interface IUserService
{
    Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> GetByInstituteIdAsync(int instituteId, CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<User?> GetActiveUserForRefreshAsync(int id, int? instituteId = null, CancellationToken cancellationToken = default);
    Task<bool> CanAccessInstituteAsync(int userId, int instituteId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InstituteAccessResponse>> GetInstituteAccessAsync(int userId, CancellationToken cancellationToken = default);
    Task<User> CreateStaffAsync(CreateStaffRequest request, int instituteId, CancellationToken cancellationToken = default);
    Task<(User User, Institute? Institute)> RegisterAsync(RegisterUserRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);
    Task<User> CreateWithConsentAsync(UserCreateRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<bool> IsDuplicateAsync(string email, string? phone, CancellationToken cancellationToken = default);
    Task<UserLoginResult?> LoginAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<bool> ForgetPasswordAsync(string email, string resetLink, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default);
    Task<CurrentUserResponse?> GetCurrentUserAsync(int userId, int? instituteId = null, CancellationToken ct = default);
    Task<bool> UpdateRoleAsync(int id, UserRole role, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(int id, CancellationToken cancellationToken = default);
    Task<UserManagementResult> UpdateRoleForManagementAsync(int id, UserRole role, CancellationToken cancellationToken = default);
    Task<UserManagementResult> UpdatePasswordForManagementAsync(int id, string newPassword, CancellationToken cancellationToken = default);
    Task<UserManagementResult> DeleteForManagementAsync(int id, CancellationToken cancellationToken = default);
}

public record UserLoginResult(string Token, int UserId, string Email, string Role, int InstituteId);
public record CurrentUserResponse(string Status, CurrentUserData Data);
public record CurrentUserData(int UserId, string Email, string? Phone, string Role, int InstituteId, CurrentUserProfile Profile, InstituteAccessResponse? CurrentInstitute = null, IReadOnlyList<InstituteAccessResponse>? Institutes = null);
public record CurrentUserProfile(string FullName, string? PhotoUrl, string? Subjects);
public record InstituteAccessResponse(int Id, string Name, string? LogoUrl);

public enum UserManagementResult
{
    Updated,
    Deleted,
    NotFound,
    PrimaryAdmin
}
