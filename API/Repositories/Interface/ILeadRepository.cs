using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Repositories.Interface;

public interface ILeadRepository
{
    Task<Institute?> GetActiveInstituteBySlugAsync(string slug, CancellationToken ct = default);
    Task<Lead> CreateAsync(Lead lead, CancellationToken ct = default);
    Task<List<LeadListItem>> ListAsync(string? status, string? search, CancellationToken ct = default);
    Task<Lead?> GetByIdAsync(long id, CancellationToken ct = default);
    Task UpdateAsync(Lead lead, AuditLog audit, CancellationToken ct = default);
    Task<bool> UserBelongsToTenantAsync(int userId, CancellationToken ct = default);
    Task<List<PublicContentItem>> ListContentAsync(CancellationToken ct = default);
    Task<PublicWebsiteContent> UpsertContentAsync(long? id, UpsertPublicContentRequest request, CancellationToken ct = default);
}