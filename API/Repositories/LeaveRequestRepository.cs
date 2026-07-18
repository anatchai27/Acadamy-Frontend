using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface ILeaveRequestRepository
{
    Task<(List<LeaveRequestItem> Items, int TotalCount)> SearchAsync(string? status, int page, int limit, CancellationToken ct = default);
    Task<LeaveRequest?> GetByIdAsync(int id, CancellationToken ct = default);
    Task ApproveAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default);
    Task RejectAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default);
    Task InsertMakeupCreditAsync(int studentId, int courseId, CancellationToken ct = default);
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

    public async Task<LeaveRequest?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.LeaveRequests
            .Include(l => l.Student)
            .Include(l => l.Session)
                .ThenInclude(s => s.Course)
            .FirstOrDefaultAsync(l => l.Id == id, ct);
    }

    public async Task ApproveAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default)
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
                GrantedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMonths(3)
            };

            _context.MakeupCredits.Add(makeup);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        });
    }

    public async Task RejectAsync(LeaveRequest request, int approvedByUserId, CancellationToken ct = default)
    {
        request.Status = "rejected";
        request.ApprovedBy = approvedByUserId;
        await _context.SaveChangesAsync(ct);
    }

    public async Task InsertMakeupCreditAsync(int studentId, int courseId, CancellationToken ct = default)
    {
        var makeup = new MakeupCredit
        {
            StudentId = studentId,
            CourseId = courseId,
            GrantedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMonths(3)
        };
        _context.MakeupCredits.Add(makeup);
        await _context.SaveChangesAsync(ct);
    }
}
