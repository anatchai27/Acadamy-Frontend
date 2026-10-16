using academy_API.Data;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public sealed class StudentPickupRepository(TutoringDbContext db) : IStudentPickupRepository
{
    public Task<bool> StudentExistsAsync(int studentId, CancellationToken ct) => db.Students.AnyAsync(x => x.Id == studentId, ct);

    public Task<List<StudentPickupAuthorization>> ListAsync(int studentId, CancellationToken ct) =>
        db.StudentPickupAuthorizations.AsNoTracking()
            .Where(x => x.StudentId == studentId && x.RevokedAt == null)
            .OrderBy(x => x.FullName)
            .ToListAsync(ct);

    public async Task<StudentPickupAuthorization> AddAsync(StudentPickupAuthorization authorization, CancellationToken ct)
    {
        db.StudentPickupAuthorizations.Add(authorization);
        await db.SaveChangesAsync(ct);
        return authorization;
    }

    public Task<StudentPickupAuthorization?> GetAsync(int studentId, long authorizationId, CancellationToken ct) =>
        db.StudentPickupAuthorizations.FirstOrDefaultAsync(x => x.Id == authorizationId && x.StudentId == studentId && x.RevokedAt == null, ct);

    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
