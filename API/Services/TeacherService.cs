using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;

namespace academy_API.Services;

public interface ITeacherService
{
    Task<List<TeacherResponse>> ListAsync(string? search, CancellationToken ct = default);
    Task<TeacherResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TeacherResponse> CreateAsync(CreateTeacherRequest request, int instituteId, CancellationToken ct = default);
    Task<PatchTeacherResult> PatchAsync(int id, PatchTeacherRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}

public sealed class TeacherService(ITeacherRepository repository) : ITeacherService
{
    public Task<List<TeacherResponse>> ListAsync(string? search, CancellationToken ct = default) =>
        repository.ListAsync(search, ct);

    public async Task<TeacherResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var teacher = await repository.GetByIdAsync(id, ct);
        return teacher is null ? null : Map(teacher);
    }

    public async Task<TeacherResponse> CreateAsync(CreateTeacherRequest request, int instituteId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new TeacherValidationException("FULL_NAME_REQUIRED", "FullName is required.");

        User? user = null;
        var email = request.UserEmail?.Trim();
        if (!string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(request.UserPassword))
        {
            if (await repository.GetUserByEmailAsync(email, ct) is not null)
                throw new TeacherValidationException("EMAIL_CONFLICT", "อีเมลนี้มีผู้ใช้อยู่ในระบบแล้ว");

            user = new User
            {
                InstituteId = instituteId,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.UserPassword),
                Role = Enum.TryParse<UserRole>(request.UserRole, true, out var role) ? role : UserRole.teacher,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        var teacher = new Teacher
        {
            InstituteId = instituteId,
            FullName = request.FullName.Trim(),
            Specialization = Clean(request.Specialization),
            Bio = Clean(request.Bio),
            HourlyRate = request.HourlyRate,
            PhotoUrl = Clean(request.PhotoUrl),
            BankAccountInfo = Clean(request.BankAccountInfo),
            TaxId = Clean(request.TaxId),
            Status = Clean(request.Status) ?? "active"
        };

        return Map(await repository.CreateAsync(teacher, user, ct));
    }

    public async Task<PatchTeacherResult> PatchAsync(int id, PatchTeacherRequest request, CancellationToken ct = default)
    {
        var teacher = await repository.GetByIdAsync(id, ct);
        if (teacher is null) return PatchTeacherResult.NotFound;

        if (request.FullName is not null)
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                throw new TeacherValidationException("FULL_NAME_EMPTY", "FullName cannot be empty.");
            teacher.FullName = request.FullName.Trim();
        }

        if (request.Specialization is not null) teacher.Specialization = Clean(request.Specialization);
        if (request.Bio is not null) teacher.Bio = Clean(request.Bio);
        if (request.HourlyRate is not null) teacher.HourlyRate = request.HourlyRate;
        if (request.PhotoUrl is not null) teacher.PhotoUrl = Clean(request.PhotoUrl);
        if (request.BankAccountInfo is not null) teacher.BankAccountInfo = Clean(request.BankAccountInfo);
        if (request.TaxId is not null) teacher.TaxId = Clean(request.TaxId);
        if (request.Status is not null) teacher.Status = Clean(request.Status);

        await repository.SaveAsync(ct);
        return PatchTeacherResult.Updated;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var teacher = await repository.GetByIdAsync(id, ct);
        if (teacher is null) return false;
        await repository.DeleteAsync(teacher, ct);
        return true;
    }

    private static TeacherResponse Map(Teacher teacher) => new(
        teacher.Id, teacher.InstituteId, teacher.UserId, teacher.FullName, teacher.Specialization,
        teacher.Bio, teacher.HourlyRate, teacher.PhotoUrl, teacher.BankAccountInfo, teacher.TaxId,
        teacher.Status, teacher.User?.Email);

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public enum PatchTeacherResult
{
    Updated,
    NotFound
}

public sealed class TeacherValidationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
