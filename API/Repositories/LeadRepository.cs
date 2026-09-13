using academy_API.Data;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface ILeadRepository
{
    Task<Institute?> GetActiveInstituteBySlugAsync(string slug, CancellationToken ct = default);
    Task<Lead> CreateAsync(Lead lead, CancellationToken ct = default);
}

public sealed class LeadRepository(TutoringDbContext context) : ILeadRepository
{
    private readonly TutoringDbContext _context = context;

    public Task<Institute?> GetActiveInstituteBySlugAsync(string slug, CancellationToken ct = default) =>
        _context.Institutes
            .AsNoTracking()
            .FirstOrDefaultAsync(institute => institute.Slug == slug && institute.IsActive, ct);

    public async Task<Lead> CreateAsync(Lead lead, CancellationToken ct = default)
    {
        _context.Leads.Add(lead);
        await _context.SaveChangesAsync(ct);
        return lead;
    }
}
