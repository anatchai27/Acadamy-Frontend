namespace academy_API.DTOs;

public record UpdateInstituteRequest(
    string? Name,
    string? ContactPhone,
    string? Email = null,
    string? Address = null,
    string? TaxId = null,
    string? ReceiptNote = null,
    string? BankName = null,
    string? BankAccountName = null,
    string? BankAccountNumber = null,
    string? PromptPayId = null,
    string? PaymentInstructions = null,
    string? PaymentQrImageUrl = null);

public record InstituteResponse(
    int Id,
    string Name,
    string? LogoUrl,
    string? ContactPhone,
    bool IsActive,
    string? Email = null,
    string? Address = null,
    string? TaxId = null,
    string? ReceiptNote = null,
    string? BankName = null,
    string? BankAccountName = null,
    string? BankAccountNumber = null,
    string? PromptPayId = null,
    string? PaymentInstructions = null,
    string? PaymentQrImageUrl = null);
