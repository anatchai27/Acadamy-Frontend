using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface ITeacherRepository
{
    Task<List<TeacherResponse>> ListAsync(string? search, CancellationToken ct = default);
    Task<Teacher?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default);
    Task<Teacher> CreateAsync(Teacher teacher, User? user, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
    Task DeleteAsync(Teacher teacher, CancellationToken ct = default);
}

public sealed class TeacherRepository(TutoringDbContext context) : ITeacherRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<List<TeacherResponse>> ListAsync(string? search, CancellationToken ct = default)
    {
        var query = _context.Teachers.AsNoTracking().Include(t => t.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(t =>
                t.FullName.Contains(term) ||
                (t.Specialization != null && t.Specialization.Contains(term)) ||
                (t.User != null && t.User.Email.Contains(term)));
        }

        return await query
            .OrderBy(t => t.FullName)
            .Select(MapExpression)
            .ToListAsync(ct);
    }

    public Task<Teacher?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _context.Teachers.Include(t => t.User).FirstOrDefaultAsync(t => t.Id == id, ct);

    public Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default) =>
        _context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public async Task<Teacher> CreateAsync(Teacher teacher, User? user, CancellationToken ct = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(ct);
        if (user is not null)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync(ct);
            teacher.UserId = user.Id;
        }

        _context.Teachers.Add(teacher);
        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        teacher.User = user;
        return teacher;
    }

    public Task SaveAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);

    public async Task DeleteAsync(Teacher teacher, CancellationToken ct = default)
    {
        _context.Teachers.Remove(teacher);
        await _context.SaveChangesAsync(ct);
    }

    private static readonly System.Linq.Expressions.Expression<Func<Teacher, TeacherResponse>> MapExpression =
        teacher => new TeacherResponse(
            teacher.Id,
            teacher.InstituteId,
            teacher.UserId,
            teacher.FullName,
            teacher.Specialization,
            teacher.Bio,
            teacher.HourlyRate,
            teacher.PhotoUrl,
            teacher.BankAccountInfo,
            teacher.TaxId,
            teacher.Status,
            teacher.User != null ? teacher.User.Email : null);
}
