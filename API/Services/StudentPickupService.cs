using System.Text.RegularExpressions;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Data;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Services;

public interface IStudentPickupService
{
    Task<IReadOnlyList<PickupAuthorizationResponse>> ListAsync(int studentId, CancellationToken ct);
    Task<PickupAuthorizationResponse> CreateAsync(int studentId, CreatePickupAuthorizationRequest request, int? actorId, CancellationToken ct);
    Task<PickupAuthorizationResponse> UpdateAsync(int studentId, long authorizationId, UpdatePickupAuthorizationRequest request, CancellationToken ct);
    Task DeleteAsync(int studentId, long authorizationId, CancellationToken ct);
}

public sealed class StudentPickupService(IStudentPickupRepository repository, TutoringDbContext db) : IStudentPickupService
{
    private readonly IStudentPickupRepository _repository = repository;
    private readonly TutoringDbContext _db = db;

    public async Task<IReadOnlyList<PickupAuthorizationResponse>> ListAsync(int studentId, CancellationToken ct)
    {
        EnsureStudent(await _repository.StudentExistsAsync(studentId, ct));
        return (await _repository.ListAsync(studentId, ct)).Select(ToResponse).ToList();
    }

    public async Task<PickupAuthorizationResponse> CreateAsync(int studentId, CreatePickupAuthorizationRequest request, int? actorId, CancellationToken ct)
    {
        Validate(request.FullName, request.Relationship, request.IdCardLast4);
        var student = await _db.Students.FirstOrDefaultAsync(x => x.Id == studentId, ct);
        if (student is null) throw new StudentPickupValidationException("NOT_FOUND", "Student not found.");
        var authorization = await _repository.AddAsync(new StudentPickupAuthorization
        {
            InstituteId = student.InstituteId,
            StudentId = studentId,
            FullName = request.FullName.Trim(),
            Phone = request.Phone?.Trim(),
            Relationship = request.Relationship.Trim(),
            IdCardLast4 = request.IdCardLast4,
            IsActive = true,
            CreatedBy = actorId,
            CreatedAt = DateTime.UtcNow
        }, ct);
        return ToResponse(authorization);
    }

    public async Task<PickupAuthorizationResponse> UpdateAsync(int studentId, long authorizationId, UpdatePickupAuthorizationRequest request, CancellationToken ct)
    {
        ValidateOptional(request.FullName, request.Relationship, request.IdCardLast4);
        var authorization = await _repository.GetAsync(studentId, authorizationId, ct);
        if (authorization is null) throw new StudentPickupValidationException("NOT_FOUND", "Pickup authorization not found.");
        if (request.FullName is not null) authorization.FullName = request.FullName.Trim();
        if (request.Phone is not null) authorization.Phone = request.Phone.Trim();
        if (request.Relationship is not null) authorization.Relationship = request.Relationship.Trim();
        if (request.IdCardLast4 is not null) authorization.IdCardLast4 = request.IdCardLast4;
        if (request.IsActive.HasValue) authorization.IsActive = request.IsActive.Value;
        await _repository.SaveAsync(ct);
        return ToResponse(authorization);
    }

    public async Task DeleteAsync(int studentId, long authorizationId, CancellationToken ct)
    {
        var authorization = await _repository.GetAsync(studentId, authorizationId, ct);
        if (authorization is null) throw new StudentPickupValidationException("NOT_FOUND", "Pickup authorization not found.");
        authorization.IsActive = false;
        authorization.RevokedAt = DateTime.UtcNow;
        await _repository.SaveAsync(ct);
    }

    private static void Validate(string fullName, string relationship, string? idCardLast4)
    {
        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(relationship))
            throw new StudentPickupValidationException("INVALID_INPUT", "fullName and relationship are required.");
        ValidateOptional(fullName, relationship, idCardLast4);
    }

    private static void ValidateOptional(string? fullName, string? relationship, string? idCardLast4)
    {
        if (idCardLast4 is not null && !Regex.IsMatch(idCardLast4, "^\\d{4}$"))
            throw new StudentPickupValidationException("INVALID_ID_CARD", "idCardLast4 must contain exactly four digits.");
    }

    private static void EnsureStudent(bool exists)
    {
        if (!exists) throw new StudentPickupValidationException("NOT_FOUND", "Student not found.");
    }

    private static PickupAuthorizationResponse ToResponse(StudentPickupAuthorization x) =>
        new(x.Id, x.StudentId, x.FullName, x.Phone, x.Relationship, x.IdCardLast4, x.IsActive);
}

public sealed class StudentPickupValidationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
