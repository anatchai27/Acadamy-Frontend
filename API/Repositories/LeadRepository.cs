using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public interface ILeadRepository
{
    Task<Institute?> GetActiveInstituteBySlugAsync(string slug, CancellationToken ct = default);
    Task<Lead> CreateAsync(Lead lead, CancellationToken ct = default);
    Task<List<LeadListItem>> ListAsync(string? status, string? search, CancellationToken ct = default);
    Task<Lead?> GetByIdAsync(long id, CancellationToken ct = default);
    Task UpdateAsync(Lead lead, CancellationToken ct = default);
    Task<List<PublicContentItem>> ListContentAsync(CancellationToken ct = default);
    Task<PublicWebsiteContent> UpsertContentAsync(long? id, UpsertPublicContentRequest request, CancellationToken ct = default);
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

    public async Task<List<LeadListItem>> ListAsync(string? status, string? search, CancellationToken ct = default)
    {
        var query = _context.Leads.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status.Trim());
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.FullName.Contains(term) || x.Phone.Contains(term) || (x.StudentName != null && x.StudentName.Contains(term)));
        }
        return await query.OrderByDescending(x => x.UpdatedAt)
            .Select(x => new LeadListItem(x.Id, x.FullName, x.Phone, x.Email, x.StudentName, x.Status, x.AssignedTo, x.Notes, x.CreatedAt, x.UpdatedAt))
            .ToListAsync(ct);
    }

    public Task<Lead?> GetByIdAsync(long id, CancellationToken ct = default) => _context.Leads.FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task UpdateAsync(Lead lead, CancellationToken ct = default)
    {
        lead.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task<List<PublicContentItem>> ListContentAsync(CancellationToken ct = default) =>
        await _context.PublicWebsiteContents.AsNoTracking().OrderBy(x => x.SortOrder)
            .Select(x => new PublicContentItem(x.Id, x.SectionKey, x.ContentType, x.ContentValue, x.Metadata, x.SortOrder, x.IsActive, x.UpdatedAt))
            .ToListAsync(ct);

    public async Task<PublicWebsiteContent> UpsertContentAsync(long? id, UpsertPublicContentRequest request, CancellationToken ct = default)
    {
        var content = id.HasValue
            ? await _context.PublicWebsiteContents.FirstOrDefaultAsync(x => x.Id == id.Value, ct)
            : null;
        if (id.HasValue && content is null) throw new LeadValidationException("CONTENT_NOT_FOUND", "Content was not found.");
        content ??= new PublicWebsiteContent { InstituteId = _context.TenantInstituteId, CreatedAt = DateTime.UtcNow };
        content.SectionKey = request.SectionKey.Trim();
        content.ContentType = request.ContentType.Trim();
        content.ContentValue = request.ContentValue;
        content.Metadata = request.Metadata;
        content.SortOrder = request.SortOrder;
        content.IsActive = request.IsActive;
        content.UpdatedAt = DateTime.UtcNow;
        if (content.Id == 0) _context.PublicWebsiteContents.Add(content);
        await _context.SaveChangesAsync(ct);
        return content;
    }
}
