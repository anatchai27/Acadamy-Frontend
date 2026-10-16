using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IPaymentService
{
    Task<CreatePaymentResponse> CreateAsync(CreatePaymentRequest request, CancellationToken ct = default);
    Task<string> IssueReceiptAsync(long paymentId, CancellationToken ct = default);
    Task<PaymentHistoryResponse> GetHistoryAsync(DateTime? startDate, DateTime? endDate, string? method, int page, int limit, CancellationToken ct = default);
    Task<byte[]> ExportCsvAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default);
}