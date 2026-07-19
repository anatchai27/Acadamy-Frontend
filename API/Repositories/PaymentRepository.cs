using academy_API.Data;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface IPaymentRepository
{
    Task<Enrollment?> GetEnrollmentWithStudentAsync(int enrollmentId, CancellationToken ct = default);
    Task<string> GenerateInvoiceNoAsync(CancellationToken ct = default);
    Task<List<Parent>> GetParentsWithLineByStudentIdAsync(int studentId, CancellationToken ct = default);
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
            enrollment.PaidAmount += payment.Amount;

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
        var query = _context.Payments.AsQueryable();

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
}
