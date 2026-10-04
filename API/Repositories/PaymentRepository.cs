using academy_API.Data;
using academy_API.Models;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IPaymentRepository
{
    Task<Enrollment?> GetEnrollmentWithStudentAsync(int enrollmentId, CancellationToken ct = default);
    Task<string> GenerateInvoiceNoAsync(CancellationToken ct = default);
    Task<List<Parent>> GetParentsWithLineByStudentIdAsync(int studentId, CancellationToken ct = default);
    Task<decimal> GetSucceededAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default);
    Task<decimal> GetPendingAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default);
    Task<Payment> CreatePaymentWithTransactionAsync(
        Payment payment, CancellationToken ct = default);
    Task<List<Payment>> GetPaymentsAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        int page, int limit, CancellationToken ct = default);
    Task<decimal> GetTotalAmountAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default);
    Task<int> GetPaymentCountAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default);
    Task<List<Payment>> GetPaymentsForExportAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default);
    Task<Payment?> GetPaymentForReceiptAsync(long paymentId, CancellationToken ct = default);
    Task SaveReceiptPdfUrlAsync(Payment payment, CancellationToken ct = default);
    Task<Payment?> GetPaymentForVerificationAsync(long paymentId, CancellationToken ct = default);
    Task<bool> SaveVerifiedSlipAsync(Payment payment, CancellationToken ct = default);
}

public class PaymentRepository(TutoringDbContext context) : IPaymentRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<Enrollment?> GetEnrollmentWithStudentAsync(int enrollmentId, CancellationToken ct = default)
    {
        return await _context.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId, ct);
    }

    public async Task<string> GenerateInvoiceNoAsync(CancellationToken ct = default)
    {
        var yearMonth = DateTime.UtcNow.ToString("yyyyMM");
        var count = await _context.Payments.CountAsync(p => p.InvoiceNo.StartsWith($"INV-{yearMonth}-"), ct);
        return $"INV-{yearMonth}-{(count + 1):D4}";
    }

    public async Task<List<Parent>> GetParentsWithLineByStudentIdAsync(int studentId, CancellationToken ct = default)
    {
        return await _context.Parents
            .Where(p => p.StudentId == studentId && p.LineUserId != null)
            .ToListAsync(ct);
    }

    public async Task<Payment> CreatePaymentWithTransactionAsync(
        Payment payment, CancellationToken ct = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync(ct);

            var enrollment = await _context.Enrollments
                .FirstAsync(e => e.Id == payment.EnrollmentId, ct);
            enrollment.PaidAmount = await GetSucceededAmountByEnrollmentAsync(payment.EnrollmentId, ct);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return payment;
        });
    }

    public async Task<List<Payment>> GetPaymentsAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        int page, int limit, CancellationToken ct = default)
    {
        var query = _context.Payments
            .Include(p => p.Enrollment)
                .ThenInclude(e => e.Student)
            .Include(p => p.Enrollment)
                .ThenInclude(e => e.Course)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(p => p.PaidAt >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(p => p.PaidAt <= endDate.Value);
        if (!string.IsNullOrEmpty(method))
            query = query.Where(p => p.Method == method);

        return await query
            .OrderByDescending(p => p.PaidAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);
    }

    public async Task<decimal> GetTotalAmountAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default)
    {
        var query = _context.Payments
            .Where(p => p.Status == PaymentStatus.Succeeded)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(p => p.PaidAt >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(p => p.PaidAt <= endDate.Value);
        if (!string.IsNullOrEmpty(method))
            query = query.Where(p => p.Method == method);

        return await query.SumAsync(p => p.Amount, ct);
    }

    public async Task<int> GetPaymentCountAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default)
    {
        var query = _context.Payments.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(p => p.PaidAt >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(p => p.PaidAt <= endDate.Value);
        if (!string.IsNullOrEmpty(method))
            query = query.Where(p => p.Method == method);

        return await query.CountAsync(ct);
    }

    public async Task<List<Payment>> GetPaymentsForExportAsync(
        DateTime? startDate, DateTime? endDate, string? method,
        CancellationToken ct = default)
    {
        var query = BuildFilteredPaymentsQuery(startDate, endDate, method);
        return await query
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync(ct);
    }

    public Task<Payment?> GetPaymentForReceiptAsync(long paymentId, CancellationToken ct = default) =>
        _context.Payments
            .Include(p => p.Enrollment)
                .ThenInclude(e => e.Student)
            .Include(p => p.Enrollment)
                .ThenInclude(e => e.Course)
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct);

    public Task SaveReceiptPdfUrlAsync(Payment payment, CancellationToken ct = default) =>
        _context.SaveChangesAsync(ct);

    public async Task<decimal> GetPendingAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default)
    {
        var paymentAmount = await _context.Payments
            .Where(p => p.EnrollmentId == enrollmentId && p.Status == PaymentStatus.Pending)
            .SumAsync(p => (decimal?)p.Amount, ct);
        var batchAmount = await _context.PaymentBatchAllocations
            .Where(allocation => allocation.EnrollmentId == enrollmentId && allocation.PaymentBatch.Status == PaymentStatus.Pending)
            .SumAsync(allocation => (decimal?)allocation.Amount, ct);
        return (paymentAmount ?? 0m) + (batchAmount ?? 0m);
    }

    public async Task<decimal> GetSucceededAmountByEnrollmentAsync(int enrollmentId, CancellationToken ct = default)
    {
        var paymentAmount = await _context.Payments
            .Where(p => p.EnrollmentId == enrollmentId && p.Status == PaymentStatus.Succeeded)
            .SumAsync(p => (decimal?)p.Amount, ct);
        var batchAmount = await _context.PaymentBatchAllocations
            .Where(allocation => allocation.EnrollmentId == enrollmentId && allocation.PaymentBatch.Status == PaymentStatus.Succeeded)
            .SumAsync(allocation => (decimal?)allocation.Amount, ct);
        return (paymentAmount ?? 0m) + (batchAmount ?? 0m);
    }

    public Task<Payment?> GetPaymentForVerificationAsync(long paymentId, CancellationToken ct = default) =>
        _context.Payments
            .Include(p => p.Enrollment)
                .ThenInclude(e => e.Student)
            .Include(p => p.Enrollment)
                .ThenInclude(e => e.Course)
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct);

    public async Task<bool> SaveVerifiedSlipAsync(Payment payment, CancellationToken ct = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            if (!string.IsNullOrWhiteSpace(payment.SlipTransRef)
                && await _context.Payments.AnyAsync(
                    p => p.Id != payment.Id && p.SlipTransRef == payment.SlipTransRef,
                    ct))
            {
                throw new PaymentValidationException("DUPLICATE_SLIP", "สลิปนี้ถูกใช้กับรายการชำระเงินอื่นแล้ว");
            }

            var updated = await _context.Payments
                .Where(p => p.Id == payment.Id && p.Status == PaymentStatus.Pending)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.Status, PaymentStatus.Succeeded)
                    .SetProperty(p => p.VerifiedAt, payment.VerifiedAt)
                    .SetProperty(p => p.VerifiedBy, payment.VerifiedBy)
                    .SetProperty(p => p.VerificationProvider, payment.VerificationProvider)
                    .SetProperty(p => p.VerificationPayload, payment.VerificationPayload)
                    .SetProperty(p => p.SlipAmount, payment.SlipAmount)
                    .SetProperty(p => p.SlipTransRef, payment.SlipTransRef)
                    .SetProperty(p => p.SlipVerifiedAt, payment.SlipVerifiedAt), ct);

            if (updated == 0)
                return false;

            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.Id == payment.EnrollmentId, ct);
            if (enrollment is null)
                throw new PaymentValidationException("ENROLLMENT_NOT_FOUND", "ไม่พบข้อมูลการลงทะเบียน");

            enrollment.PaidAmount = await GetSucceededAmountByEnrollmentAsync(payment.EnrollmentId, ct);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return true;
        });
    }

    private IQueryable<Payment> BuildFilteredPaymentsQuery(
        DateTime? startDate, DateTime? endDate, string? method)
    {
        var query = _context.Payments
            .Include(p => p.Enrollment)
                .ThenInclude(e => e.Student)
            .Include(p => p.Enrollment)
                .ThenInclude(e => e.Course)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(p => p.PaidAt >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(p => p.PaidAt <= endDate.Value);
        if (!string.IsNullOrEmpty(method))
            query = query.Where(p => p.Method == method);

        return query;
    }
}
