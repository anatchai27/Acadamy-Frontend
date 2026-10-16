using academy_API.Models;

namespace academy_API.Services.Interface;

public interface IPaymentReceiptService
{
    Task<string> IssueAndNotifyAsync(Payment payment, CancellationToken ct = default);
}