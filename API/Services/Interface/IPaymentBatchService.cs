using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IPaymentBatchService
{
    Task<PaymentBatchResponse> CreateAsync(CreatePaymentBatchRequest request, CancellationToken ct = default);
    Task<PaymentBatchResponse> CreateParentTransferAsync(int parentUserId, int studentId, int enrollmentId, CancellationToken ct = default, decimal? amount = null);
    Task<PaymentBatchResponse> CreateParentOnlinePaymentAsync(int parentUserId, int studentId, int enrollmentId, decimal amount, string method, string? installmentBank = null, int? installmentTerm = null, CancellationToken ct = default);
    Task<PaymentBatchResponse> RefreshParentOnlinePaymentAsync(int parentUserId, int studentId, long batchId, CancellationToken ct = default);
    Task<PaymentBatchSlipVerificationResponse> VerifySlipAsync(long batchId, int? actorId, CancellationToken ct = default);
    Task<PaymentBatchSlipVerificationResponse> ConfirmManuallyAsync(long batchId, int? actorId, CancellationToken ct = default);
    Task<string> IssueReceiptAsync(long batchId, CancellationToken ct = default);
}