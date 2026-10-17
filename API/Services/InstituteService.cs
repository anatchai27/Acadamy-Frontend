using academy_API.DTOs;
using academy_API.Repositories;

namespace academy_API.Services;

public sealed class InstituteService(IInstituteRepository repository) : IInstituteService
{
    public async Task<InstituteResponse?> GetMeAsync(int instituteId, CancellationToken cancellationToken = default)
    {
        var institute = await repository.GetByIdAsync(instituteId, cancellationToken);
        return institute is null ? null : MapToResponse(institute);
    }

    public async Task<bool> UpdateMeAsync(int instituteId, UpdateInstituteRequest request, CancellationToken cancellationToken = default)
    {
        var institute = await repository.GetByIdAsync(instituteId, cancellationToken);
        if (institute is null) return false;

        if (request.Name is not null) institute.Name = request.Name;
        if (request.ContactPhone is not null) institute.ContactPhone = request.ContactPhone;
        if (request.Email is not null) institute.Email = Clean(request.Email);
        if (request.Address is not null) institute.Address = Clean(request.Address);
        if (request.TaxId is not null) institute.TaxId = Clean(request.TaxId);
        if (request.ReceiptNote is not null) institute.ReceiptNote = Clean(request.ReceiptNote);
        if (request.BankName is not null) institute.BankName = Clean(request.BankName);
        if (request.BankAccountName is not null) institute.BankAccountName = Clean(request.BankAccountName);
        if (request.BankAccountNumber is not null) institute.BankAccountNumber = Clean(request.BankAccountNumber);
        if (request.PromptPayId is not null) institute.PromptPayId = Clean(request.PromptPayId);
        if (request.PaymentInstructions is not null) institute.PaymentInstructions = Clean(request.PaymentInstructions);
        if (request.PaymentQrImageUrl is not null) institute.PaymentQrImageUrl = Clean(request.PaymentQrImageUrl);
        institute.UpdatedAt = DateTime.UtcNow;

        return await repository.UpdateAsync(institute, cancellationToken);
    }

    private static InstituteResponse MapToResponse(Models.Institute institute) =>
        new(
            institute.Id,
            institute.Name,
            institute.LogoUrl,
            institute.ContactPhone,
            institute.IsActive,
            institute.Email,
            institute.Address,
            institute.TaxId,
            institute.ReceiptNote,
            institute.BankName,
            institute.BankAccountName,
            institute.BankAccountNumber,
            institute.PromptPayId,
            institute.PaymentInstructions,
            institute.PaymentQrImageUrl);

        private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
