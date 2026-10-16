using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface IPaymentRepository
{
    Task<Enrollment?> GetEnrollmentWithStudentAsync(int enrollmentId, CancellationToken ct = default);
    Task<string> GenerateInvoiceNoAsync(CancellationToken ct = default);
    Task<List<Parent>> GetParentsWithLineByStudentIdAsync(int studentId, CancellationToken ct = default);
    Task<decimal> GetSucceededAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default);
    Task<decimal> GetPendingAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default);
    Task<Payment> CreatePaymentWithTransactionAsync(Payment payment, CancellationToken ct = default);
    Task<List<Payment>> GetPaymentsAsync(DateTime? startDate, DateTime? endDate, string? method, int page, int limit, CancellationToken ct = default);
    Task<decimal> GetTotalAmountAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default);
    Task<int> GetPaymentCountAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default);
    Task<List<Payment>> GetPaymentsForExportAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default);
    Task<Payment?> GetPaymentForReceiptAsync(long paymentId, CancellationToken ct = default);
    Task SaveReceiptPdfUrlAsync(Payment payment, CancellationToken ct = default);
    Task<Payment?> GetPaymentForVerificationAsync(long paymentId, CancellationToken ct = default);
    Task<bool> SaveVerifiedSlipAsync(Payment payment, CancellationToken ct = default);
}