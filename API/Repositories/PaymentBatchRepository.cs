using academy_API.Data;
using academy_API.Models;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

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

public sealed class PaymentBatchRepository(TutoringDbContext context) : IPaymentBatchRepository
{
    private readonly TutoringDbContext _context = context;

    public Task<Enrollment?> GetEnrollmentAsync(int enrollmentId, CancellationToken ct = default) =>
        _context.Enrollments
            .Include(enrollment => enrollment.Student).ThenInclude(student => student.Parents)
            .Include(enrollment => enrollment.Course)
            .FirstOrDefaultAsync(enrollment => enrollment.Id == enrollmentId, ct);

    public async Task<decimal> GetSucceededAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default) =>
        await _context.PaymentBatchAllocations
            .Where(allocation => allocation.EnrollmentId == enrollmentId && allocation.PaymentBatch.Status == PaymentStatus.Succeeded)
            .SumAsync(allocation => (decimal?)allocation.Amount, ct) ?? 0m;

    public async Task<decimal> GetPendingAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default) =>
        await _context.PaymentBatchAllocations
            .Where(allocation => allocation.EnrollmentId == enrollmentId && allocation.PaymentBatch.Status == PaymentStatus.Pending)
            .SumAsync(allocation => (decimal?)allocation.Amount, ct) ?? 0m;

    public async Task<string> GenerateInvoiceNoAsync(CancellationToken ct = default)
    {
        var yearMonth = DateTime.UtcNow.ToString("yyyyMM");
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var invoiceNo = $"INV-{yearMonth}-B{Guid.NewGuid():N}"[..22].ToUpperInvariant();
            if (!await _context.PaymentBatches.AnyAsync(batch => batch.InvoiceNo == invoiceNo, ct)
                && !await _context.Payments.AnyAsync(payment => payment.InvoiceNo == invoiceNo, ct))
                return invoiceNo;
        }

        throw new InvalidOperationException("Could not generate a unique invoice number.");
    }

    public async Task<PaymentBatch> CreateAsync(PaymentBatch batch, CancellationToken ct = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            _context.PaymentBatches.Add(batch);
            await _context.SaveChangesAsync(ct);

            if (batch.Status == PaymentStatus.Succeeded)
                await RefreshEnrollmentPaidAmountsAsync(batch.Allocations.Select(allocation => allocation.EnrollmentId), ct);

            await transaction.CommitAsync(ct);
            return batch;
        });
    }

    public Task<PaymentBatch?> GetForSlipUploadAsync(long batchId, CancellationToken ct = default) =>
        _context.PaymentBatches.FirstOrDefaultAsync(batch => batch.Id == batchId, ct);

    public Task<PaymentBatch?> GetForVerificationAsync(long batchId, CancellationToken ct = default) =>
        BatchQuery().FirstOrDefaultAsync(batch => batch.Id == batchId, ct);

    public async Task<bool> SaveVerifiedSlipAsync(PaymentBatch batch, CancellationToken ct = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            if (!string.IsNullOrWhiteSpace(batch.SlipTransRef)
                && (await _context.Payments.AnyAsync(payment => payment.SlipTransRef == batch.SlipTransRef, ct)
                    || await _context.PaymentBatches.AnyAsync(existing => existing.Id != batch.Id && existing.SlipTransRef == batch.SlipTransRef, ct)))
                throw new PaymentValidationException("DUPLICATE_SLIP", "สลิปนี้ถูกใช้กับรายการชำระเงินอื่นแล้ว");

            var updated = await _context.PaymentBatches
                .Where(existing => existing.Id == batch.Id && existing.Status == PaymentStatus.Pending)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(existing => existing.Status, PaymentStatus.Succeeded)
                    .SetProperty(existing => existing.PaidAt, batch.PaidAt)
                    .SetProperty(existing => existing.VerifiedAt, batch.VerifiedAt)
                    .SetProperty(existing => existing.VerifiedBy, batch.VerifiedBy)
                    .SetProperty(existing => existing.VerificationProvider, batch.VerificationProvider)
                    .SetProperty(existing => existing.VerificationPayload, batch.VerificationPayload)
                    .SetProperty(existing => existing.SlipAmount, batch.SlipAmount)
                    .SetProperty(existing => existing.SlipTransRef, batch.SlipTransRef), ct);

            if (updated == 0) return false;

            await RefreshEnrollmentPaidAmountsAsync(batch.Allocations.Select(allocation => allocation.EnrollmentId), ct);
            await transaction.CommitAsync(ct);
            return true;
        });
    }

    public Task SaveReceiptPdfUrlAsync(PaymentBatch batch, CancellationToken ct = default) =>
        _context.SaveChangesAsync(ct);

    public Task<List<PaymentBatch>> GetHistoryAsync(DateTime? startDate, DateTime? endDate, string? method, int limit, CancellationToken ct = default) =>
        ApplyFilters(BatchQuery(), startDate, endDate, method)
            .OrderByDescending(batch => batch.PaidAt)
            .Take(limit)
            .ToListAsync(ct);

    public async Task<decimal> GetTotalAmountAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default) =>
        await ApplyFilters(_context.PaymentBatches.Where(batch => batch.Status == PaymentStatus.Succeeded), startDate, endDate, method)
            .SumAsync(batch => (decimal?)batch.Amount, ct) ?? 0m;

    public Task<int> GetBatchCountAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default) =>
        ApplyFilters(_context.PaymentBatches, startDate, endDate, method).CountAsync(ct);

    public Task<List<PaymentBatch>> GetBatchesForExportAsync(DateTime? startDate, DateTime? endDate, string? method, CancellationToken ct = default) =>
        ApplyFilters(BatchQuery(), startDate, endDate, method)
            .OrderByDescending(batch => batch.PaidAt)
            .ToListAsync(ct);

    private IQueryable<PaymentBatch> BatchQuery() => _context.PaymentBatches
        .Include(batch => batch.Allocations)
            .ThenInclude(allocation => allocation.Enrollment)
                .ThenInclude(enrollment => enrollment.Student)
                    .ThenInclude(student => student.Parents)
        .Include(batch => batch.Allocations)
            .ThenInclude(allocation => allocation.Enrollment)
                .ThenInclude(enrollment => enrollment.Course)
        .AsSplitQuery();

    private static IQueryable<PaymentBatch> ApplyFilters(
        IQueryable<PaymentBatch> query,
        DateTime? startDate,
        DateTime? endDate,
        string? method)
    {
        if (startDate.HasValue) query = query.Where(batch => batch.PaidAt >= startDate.Value);
        if (endDate.HasValue) query = query.Where(batch => batch.PaidAt <= endDate.Value);
        if (!string.IsNullOrEmpty(method)) query = query.Where(batch => batch.Method == method);
        return query;
    }

    private async Task RefreshEnrollmentPaidAmountsAsync(IEnumerable<int> enrollmentIds, CancellationToken ct)
    {
        var ids = enrollmentIds.Distinct().ToList();
        var enrollments = await _context.Enrollments.Where(enrollment => ids.Contains(enrollment.Id)).ToListAsync(ct);
        var paymentTotals = await _context.Payments
            .Where(payment => ids.Contains(payment.EnrollmentId) && payment.Status == PaymentStatus.Succeeded)
            .GroupBy(payment => payment.EnrollmentId)
            .Select(group => new { EnrollmentId = group.Key, Amount = group.Sum(payment => payment.Amount) })
            .ToDictionaryAsync(item => item.EnrollmentId, item => item.Amount, ct);
        var batchTotals = await _context.PaymentBatchAllocations
            .Where(allocation => ids.Contains(allocation.EnrollmentId) && allocation.PaymentBatch.Status == PaymentStatus.Succeeded)
            .GroupBy(allocation => allocation.EnrollmentId)
            .Select(group => new { EnrollmentId = group.Key, Amount = group.Sum(allocation => allocation.Amount) })
            .ToDictionaryAsync(item => item.EnrollmentId, item => item.Amount, ct);

        foreach (var enrollment in enrollments)
            enrollment.PaidAmount = paymentTotals.GetValueOrDefault(enrollment.Id) + batchTotals.GetValueOrDefault(enrollment.Id);

        await _context.SaveChangesAsync(ct);
    }
}
