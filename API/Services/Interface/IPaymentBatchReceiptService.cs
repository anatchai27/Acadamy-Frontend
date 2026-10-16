using academy_API.Models;

namespace academy_API.Services.Interface;

public interface IPaymentBatchReceiptService
{
    Task<string> IssueAndNotifyAsync(PaymentBatch batch, CancellationToken ct = default);
}