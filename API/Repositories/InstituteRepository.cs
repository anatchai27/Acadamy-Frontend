using academy_API.Data;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public sealed class InstituteRepository(TutoringDbContext context) : IInstituteRepository
{
    private readonly TutoringDbContext _context = context;

    public Task<Models.Institute?> GetByIdAsync(int instituteId, CancellationToken cancellationToken = default) =>
        _context.Institutes.FirstOrDefaultAsync(i => i.Id == instituteId, cancellationToken);

    public async Task<bool> UpdateAsync(Models.Institute institute, CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
