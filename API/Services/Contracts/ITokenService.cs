using academy_API.Models;

namespace academy_API.Services.Contracts;

public interface ITokenService
{
    string GenerateToken(User user);
    string GenerateRefreshToken(User user);
    (string Token, int UserId, string Email, string Role, int InstituteId)? ValidateAndRefresh(string expiredToken, User user);
    bool VerifyPassword(string password, string passwordHash);
    string HashPassword(string password);
}
