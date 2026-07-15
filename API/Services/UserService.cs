using System.Security.Cryptography;
using academy_API.Data;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Services.Contracts;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Services;

public class UserService(
    IUserRepository repository,
    IPdpaConsentRepository pdpaRepository,
    ITokenService tokenService,
    TutoringDbContext context) : IUserService
{
    private readonly IUserRepository _repository = repository;
    private readonly IPdpaConsentRepository _pdpaRepository = pdpaRepository;
    private readonly ITokenService _tokenService = tokenService;
    private readonly TutoringDbContext _context = context;

    public async Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default)
        => await _repository.GetAllAsync(ct);

    public async Task<IEnumerable<User>> GetByInstituteIdAsync(int instituteId, CancellationToken ct = default)
        => await _repository.GetByInstituteIdAsync(instituteId, ct);

    public async Task<User?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _repository.GetByIdAsync(id, ct);

    public async Task<User> CreateAsync(User user, CancellationToken ct = default)
        => await _repository.CreateAsync(user, ct);

    public async Task<bool> IsDuplicateAsync(string email, string? phone, CancellationToken ct = default)
        => await _context.Users.AnyAsync(u => u.Email == email || (phone != null && u.Phone == phone), ct);

    public async Task<User> CreateWithConsentAsync(UserCreateRequest request, string? ipAddress, CancellationToken ct = default)
    {
        ValidateRequest(request);

        var passwordHash = _tokenService.HashPassword(request.Password);
        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            try
            {
                await ValidateUniqueAsync(request, ct);

                var user = new User
                {
                    Email = request.Email,
                    Phone = request.Phone,
                    Role = request.Role,
                    LineUserId = request.LineUserId,
                    PasswordHash = passwordHash,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync(ct);

                _context.PdpaConsents.Add(new PdpaConsent
                {
                    UserId = user.Id,
                    ConsentVersion = string.IsNullOrWhiteSpace(request.PdpaConsentVersion) ? "1.0" : request.PdpaConsentVersion,
                    IsAccepted = true,
                    IpAddress = ipAddress,
                    AcceptedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                return user;
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        });
    }

    private void ValidateRequest(UserCreateRequest request)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        if (_tokenService == null)
            throw new InvalidOperationException("Token service is not configured.");

        if (_context == null)
            throw new InvalidOperationException("Database context is not configured.");

        if (!request.AcceptPdpa)
            throw new InvalidOperationException("PDPA consent must be accepted to create an account.");

        if (string.IsNullOrEmpty(request.Password))
            throw new ArgumentException("Password cannot be null or empty.", nameof(request.Password));

        if (string.IsNullOrEmpty(request.Email))
            throw new ArgumentException("Email cannot be null or empty.", nameof(request.Email));
    }

    private async Task ValidateUniqueAsync(UserCreateRequest request, CancellationToken ct)
    {
        if (await _context.Users.AnyAsync(
            u => u.Email == request.Email || (request.Phone != null && u.Phone == request.Phone), ct))
        {
            throw new InvalidOperationException("Email or phone number is already registered.");
        }
    }

    public async Task<UserLoginResult?> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !_tokenService.VerifyPassword(password, user.PasswordHash))
        {
            return null;
        }

        var token = _tokenService.GenerateToken(user);

        return new UserLoginResult(
            Token: token,
            UserId: user.Id,
            Email: user.Email,
            Role: user.Role.ToString(),
            InstituteId: user.InstituteId
        );
    }

    public async Task<bool> ForgetPasswordAsync(string email, string resetLink, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null) return false;

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        user.ResetToken = _tokenService.HashPassword(token);
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || string.IsNullOrEmpty(user.ResetToken) || !user.ResetTokenExpiry.HasValue || user.ResetTokenExpiry < DateTime.UtcNow)
            return false;

        if (!_tokenService.VerifyPassword(token, user.ResetToken))
            return false;

        user.PasswordHash = _tokenService.HashPassword(newPassword);
        user.ResetToken = null;
        user.ResetTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<CurrentUserResponse?> GetCurrentUserAsync(int userId, CancellationToken ct = default)
    {
        var user = await _repository.GetByIdWithProfileAsync(userId, ct);
        if (user is null) return null;

        var profile = new CurrentUserProfile(
            FullName: user.Teacher?.FullName ?? user.Email,
            PhotoUrl: user.Teacher?.PhotoUrl,
            Subjects: user.Teacher?.Specialization
        );

        return new CurrentUserResponse(
            "success",
            new CurrentUserData(
                UserId: user.Id,
                Email: user.Email,
                Phone: user.Phone,
                Role: user.Role.ToString(),
                InstituteId: user.InstituteId,
                Profile: profile
            )
        );
    }

    public async Task<bool> UpdateRoleAsync(int id, UserRole role, CancellationToken ct = default)
        => await _repository.UpdateRoleAsync(id, role, ct);

    public async Task<bool> DeleteUserAsync(int id, CancellationToken ct = default)
        => await _repository.DeleteAsync(id, ct);
}
