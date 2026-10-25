using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface IPaymentBatchService
{
    Task<PaymentBatchResponse> CreateAsync(CreatePaymentBatchRequest request, CancellationToken ct = default);
    Task<PaymentBatchResponse> CreateParentTransferAsync(int parentUserId, int studentId, int enrollmentId, CancellationToken ct = default, decimal? amount = null);
    Task<PaymentBatchSlipVerificationResponse> VerifySlipAsync(long batchId, int? actorId, CancellationToken ct = default);
    Task<string> IssueReceiptAsync(long batchId, CancellationToken ct = default);
}