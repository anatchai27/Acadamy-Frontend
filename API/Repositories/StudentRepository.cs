using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public class StudentRepository(TutoringDbContext context) : IStudentRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<IEnumerable<Student>> GetAllWithUserAsync(CancellationToken ct = default)
    {
        return await _context.Students
            .Include(s => s.User)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<Student?> GetByIdWithUserAsync(int id, CancellationToken ct = default)
    {
        return await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
    }

    public async Task<Student?> GetByIdWithParentsAsync(int id, CancellationToken ct = default)
    {
        return await _context.Students
            .Include(s => s.Parents)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
    }

    public async Task<Student> CreateAsync(Student student, CancellationToken ct = default)
    {
        _context.Students.Add(student);
        await _context.SaveChangesAsync(ct);
        return student;
    }

    public async Task<Student> CreateWithTransactionAsync(
        Student student,
        List<Parent> parents,
        PdpaConsent pdpa,
        CancellationToken ct = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);

            _context.Students.Add(student);
            await _context.SaveChangesAsync(ct);

            foreach (var parent in parents)
            {
                parent.StudentId = student.Id;
                _context.Parents.Add(parent);
            }

            _context.PdpaConsents.Add(pdpa);

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return student;
        });
    }

    public async Task<Student?> UpdateAsync(int id, int? instituteId, UpdateStudentRequest request, CancellationToken ct = default)
    {
        var student = await _context.Students
            .Include(s => s.Parents)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (student is null)
            return null;

        if (instituteId.HasValue && student.InstituteId != instituteId.Value)
            throw new InvalidOperationException("FORBIDDEN");

        if (request.Student is not null)
        {
            var s = request.Student;
            if (s.FullName is not null) student.FullName = s.FullName.Trim();
            if (s.Nickname is not null) student.Nickname = s.Nickname.Trim();
            if (s.Grade is not null) student.Grade = s.Grade.Trim();
            if (s.School is not null) student.School = s.School.Trim();
            if (s.PhotoUrl is not null) student.PhotoUrl = s.PhotoUrl.Trim();
            if (s.MedicalInfo is not null) student.MedicalInfo = s.MedicalInfo.Trim();
        }

        if (request.Parents is not null)
        {
            foreach (var parentUpdate in request.Parents)
            {
                var parent = student.Parents.FirstOrDefault(p => p.Id == parentUpdate.Id);
                if (parent is null)
                    continue;

                if (parentUpdate.FullName is not null) parent.FullName = parentUpdate.FullName.Trim();
                if (parentUpdate.Phone is not null) parent.Phone = parentUpdate.Phone.Trim();
                if (parentUpdate.Relationship is not null) parent.Relationship = parentUpdate.Relationship.Trim();
                if (parentUpdate.LineUserId is not null) parent.LineUserId = parentUpdate.LineUserId.Trim();
            }
        }

        await _context.SaveChangesAsync(ct);
        return student;
    }

    public async Task<Student?> RotateQrTokenAsync(int id, CancellationToken ct = default)
    {
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (student is null)
            return null;

        var random = Guid.NewGuid().ToString("N")[..8];
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        student.QrToken = $"tiwhub_{student.Id}_{random}_{timestamp}";

        await _context.SaveChangesAsync(ct);
        return student;
    }

    public async Task<(List<StudentListItem> Items, int TotalCount)> SearchAsync(
        int? instituteId,
        string? search,
        int page,
        int limit,
        CancellationToken ct = default)
    {
        var query = _context.Students
            .Include(s => s.Parents)
            .AsQueryable();

        if (instituteId.HasValue)
            query = query.Where(s => s.InstituteId == instituteId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var isNumeric = int.TryParse(term, out var studentId);

            query = query.Where(s =>
                s.FullName.Contains(term) ||
                (s.Nickname != null && s.Nickname.Contains(term)) ||
                (isNumeric && s.Id == studentId) ||
                s.Parents.Any(p => p.Phone != null && p.Phone.Contains(term)));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(s => new StudentListItem(
                s.Id,
                s.FullName,
                s.Nickname,
                s.Grade,
                s.PhotoUrl,
                s.Parents.OrderBy(p => p.Id).Select(p => p.FullName).FirstOrDefault(),
                s.Parents.OrderBy(p => p.Id).Select(p => p.Phone).FirstOrDefault()
            ))
            .ToListAsync(ct);

        return (items, totalCount);
    }
}
