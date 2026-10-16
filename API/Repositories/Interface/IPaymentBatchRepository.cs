using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IPaymentBatchRepository
{
    Task<Enrollment?> GetEnrollmentAsync(int enrollmentId, CancellationToken ct = default);
    Task<decimal> GetSucceededAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default);
    Task<decimal> GetPendingAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default);
    Task<string> GenerateInvoiceNoAsync(CancellationToken ct = default);
    Task<PaymentBatch> CreateAsync(PaymentBatch batch, CancellationToken ct = default);
    Task<PaymentBatch?> GetForSlipUploadAsync(long batchId, CancellationToken ct = default);
    Task<PaymentBatch?> GetForVerificationAsync(long batchId, CancellationToken ct = default);
    Task<bool> SaveVerifiedSlipAsync(PaymentBatch batch, CancellationToken ct = default);
    Task SaveReceiptPdfUrlAsync(PaymentBatch batch, CancellationToken ct = default);
    Task<List<PaymentBatch>> GetHistoryAsync(DateTime? startDate, DateTime? endDate, string? method, int limit, CancellationToken ct = default);
    Task<decimal> GetTotalAmountAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default);
    Task<int> GetBatchCountAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default);
    Task<List<PaymentBatch>> GetBatchesForExportAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default);
}