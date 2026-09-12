using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface ILeaveRequestRepository
{
    Task<(List<LeaveRequestItem> Items, int TotalCount)> SearchAsync(string? status, int page, int limit, CancellationToken ct = default);
    Task<LeaveRequest?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<Session?> GetSessionForStudentAsync(int studentId, int sessionId, CancellationToken ct = default);
    Task<LeaveRequest?> CreateAsync(LeaveRequest request, CancellationToken ct = default);
    Task<(LeaveRequest Request, MakeupCredit? Credit)> ApproveAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default);
    Task RejectAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default);
}

public class LeaveRequestRepository(TutoringDbContext context) : ILeaveRequestRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<(List<LeaveRequestItem> Items, int TotalCount)> SearchAsync(string? status, int page, int limit, CancellationToken ct = default)
    {
        var query = _context.LeaveRequests
            .Include(l => l.Student)
            .Include(l => l.Session)
                .ThenInclude(s => s.Course)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(l => l.Status == status);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(l => l.RequestedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(l => new LeaveRequestItem(
                l.Id,
                l.StudentId,
                l.Student.FullName,
                l.SessionId,
                l.Session.ScheduledAt,
                l.Reason,
                l.Type,
                l.Status,
                l.RequestedAt
            ))
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<LeaveRequest?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        return await _context.LeaveRequests
            .Include(l => l.Student)
            .Include(l => l.Session)
                .ThenInclude(s => s.Course)
            .FirstOrDefaultAsync(l => l.Id == id, ct);
    }

    public Task<Session?> GetSessionForStudentAsync(int studentId, int sessionId, CancellationToken ct = default) =>
        _context.Sessions
            .Include(s => s.Course)
            .Where(s => s.Id == sessionId && _context.Enrollments.Any(e =>
                e.StudentId == studentId && e.CourseId == s.CourseId))
            .FirstOrDefaultAsync(ct);

    public async Task<LeaveRequest?> CreateAsync(LeaveRequest request, CancellationToken ct = default)
    {
        _context.LeaveRequests.Add(request);
        await _context.SaveChangesAsync(ct);
        return request;
    }

    public async Task<(LeaveRequest Request, MakeupCredit? Credit)> ApproveAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);

            request.Status = "approved";
            request.ApprovedBy = approvedByUserId;

            var makeup = new MakeupCredit
            {
                StudentId = request.StudentId,
                CourseId = request.Session.CourseId,
                InstituteId = request.InstituteId,
                GrantedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMonths(3).Date,
                CreatedAt = DateTime.UtcNow,
                Status = "available"
            };
            _context.MakeupCredits.Add(makeup);

            await _context.SaveChangesAsync(ct);
            if (makeup is not null)
            {
                _context.MakeupCreditTransactions.Add(new MakeupCreditTransaction
                {
                    InstituteId = request.InstituteId,
                    CreditId = makeup.Id,
                    StudentId = request.StudentId,
                    TransactionType = "grant",
                    Amount = 1,
                    ReferenceType = "leave_request",
                    ReferenceId = request.Id,
                    Note = "Credit granted after leave approval",
                    CreatedBy = approvedByUserId,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync(ct);
            }
            await transaction.CommitAsync(ct);
            return (request, makeup);
        });

        // ExecutionStrategy's callback result is not available on all EF providers; re-read state.
        var latest = await _context.LeaveRequests
            .Include(l => l.Student)
            .Include(l => l.Session)
            .FirstAsync(l => l.Id == request.Id, ct);
        var credit = await _context.MakeupCredits
            .Where(c => c.StudentId == request.StudentId && c.CourseId == request.Session.CourseId && c.GrantedAt >= request.CreatedAt)
            .OrderByDescending(c => c.Id)
            .FirstOrDefaultAsync(ct);
        return (latest, credit);
    }

    public async Task RejectAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default)
    {
        request.Status = "rejected";
        request.ApprovedBy = approvedByUserId;
        await _context.SaveChangesAsync(ct);
    }

}
