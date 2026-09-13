using System.Net.Mail;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;

namespace academy_API.Services;

public interface ILeadService
{
    Task<CreateLeadResponse> CreateAsync(CreateLeadRequest request, CancellationToken ct = default);
    Task<LeadListResponse> ListAsync(string? status, string? search, CancellationToken ct = default);
    Task UpdateFollowUpAsync(long id, UpdateLeadFollowUpRequest request, CancellationToken ct = default);
}

public sealed class LeadService(ILeadRepository repository) : ILeadService
{
    public async Task<CreateLeadResponse> CreateAsync(CreateLeadRequest request, CancellationToken ct = default)
    {
        var slug = Required(request.InstituteSlug, "INSTITUTE_SLUG_REQUIRED");
        var contactName = Required(request.ContactName, "CONTACT_NAME_REQUIRED");
        var phone = Required(request.Phone, "PHONE_REQUIRED");

        ValidateLength(slug, 64, "INSTITUTE_SLUG_TOO_LONG");
        ValidateLength(contactName, 255, "CONTACT_NAME_TOO_LONG");
        ValidateLength(phone, 50, "PHONE_TOO_LONG");
        ValidateOptionalLength(request.Email, 255, "EMAIL_TOO_LONG");
        ValidateOptionalLength(request.StudentName, 255, "STUDENT_NAME_TOO_LONG");
        ValidateOptionalLength(request.CourseInterest, 500, "COURSE_INTEREST_TOO_LONG");

        var email = request.Email?.Trim();
        if (!string.IsNullOrWhiteSpace(email))
        {
            try
            {
                _ = new MailAddress(email);
            }
            catch (FormatException)
            {
                throw new LeadValidationException("EMAIL_INVALID", "Email is invalid.");
            }
        }

        var institute = await repository.GetActiveInstituteBySlugAsync(slug, ct)
            ?? throw new LeadValidationException("INSTITUTE_NOT_FOUND", "Institute was not found.");

        var lead = new Lead
        {
            InstituteId = institute.Id,
            FullName = contactName,
            Phone = phone,
            Email = email,
            StudentName = Optional(request.StudentName),
            InterestedSubjects = Optional(request.CourseInterest),
            Source = "public_trial_class",
            Status = "new",
            Notes = Optional(request.Message),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await repository.CreateAsync(lead, ct);
        return new CreateLeadResponse(created.Id, "created");
    }

    public async Task<LeadListResponse> ListAsync(string? status, string? search, CancellationToken ct = default) =>
        new("success", await repository.ListAsync(status, search, ct));

    public async Task UpdateFollowUpAsync(long id, UpdateLeadFollowUpRequest request, CancellationToken ct = default)
    {
        var allowed = new[] { "new", "contacted", "qualified", "converted", "lost" };
        if (!allowed.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
            throw new LeadValidationException("STATUS_INVALID", "Lead status is invalid.");
        var lead = await repository.GetByIdAsync(id, ct)
            ?? throw new LeadValidationException("LEAD_NOT_FOUND", "Lead was not found.");
        lead.Status = request.Status.Trim().ToLowerInvariant();
        lead.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        lead.AssignedTo = request.AssignedTo;
        await repository.UpdateAsync(lead, ct);
    }

    private static string Required(string? value, string code) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new LeadValidationException(code, "Required value is missing.")
            : value.Trim();

    private static string? Optional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void ValidateLength(string value, int maxLength, string code)
    {
        if (value.Length > maxLength)
            throw new LeadValidationException(code, "Value is too long.");
    }

    private static void ValidateOptionalLength(string? value, int maxLength, string code)
    {
        if (value is not null && value.Trim().Length > maxLength)
            throw new LeadValidationException(code, "Value is too long.");
    }
}

public sealed class LeadValidationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
