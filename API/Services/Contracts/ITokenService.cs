using academy_API.Models;

namespace academy_API.Services.Contracts;

public interface ITokenService
{
    string GenerateToken(User user, int? instituteId = null);
    string GenerateRefreshToken(User user, int? instituteId = null);
    (string Token, int UserId, string Email, string Role, int InstituteId)? ValidateAndRefresh(string expiredToken, User user, int? instituteId = null);
    bool VerifyPassword(string password, string passwordHash);
    string HashPassword(string password);
}
