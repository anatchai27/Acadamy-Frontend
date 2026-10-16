using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;

namespace academy_API.Services;

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
        if (!string.IsNullOrWhiteSpace(email))
        {
            if (string.IsNullOrWhiteSpace(request.UserPassword))
                throw new TeacherValidationException("PASSWORD_REQUIRED", "กรุณากรอกรหัสผ่านบัญชีครู");

            var existingUser = await repository.GetUserByEmailAsync(email, ct);
            if (existingUser is not null)
            {
                if (existingUser.Role != UserRole.teacher ||
                    !BCrypt.Net.BCrypt.Verify(request.UserPassword, existingUser.PasswordHash))
                    throw new TeacherValidationException("EMAIL_CONFLICT", "บัญชีนี้ไม่ใช่บัญชีครู หรือรหัสผ่านไม่ถูกต้อง");
                if (await repository.HasMembershipAsync(existingUser.Id, ct))
                    throw new TeacherValidationException("MEMBERSHIP_EXISTS", "ครูบัญชีนี้มีข้อมูลในสถาบันนี้อยู่แล้ว");
                user = existingUser;
            }
            else
            {
                user = new User
                {
                    InstituteId = instituteId,
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.UserPassword),
                    Role = UserRole.teacher,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
            }
        }

        var teacher = new Teacher
        {
            InstituteId = instituteId,
            FullName = request.FullName.Trim(),
            Specialization = Clean(request.Specialization),
            SpecializationEn = Clean(request.SpecializationEn),
            Bio = Clean(request.Bio),
            BioEn = Clean(request.BioEn),
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
        if (request.SpecializationEn is not null) teacher.SpecializationEn = Clean(request.SpecializationEn);
        if (request.Bio is not null) teacher.Bio = Clean(request.Bio);
        if (request.BioEn is not null) teacher.BioEn = Clean(request.BioEn);
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
        teacher.Status, teacher.User?.Email, teacher.SpecializationEn, teacher.BioEn);

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
