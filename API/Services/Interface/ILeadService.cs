using academy_API.DTOs;

namespace academy_API.Services.Interface;

public interface ILeadService
{
    Task<CreateLeadResponse> CreateAsync(CreateLeadRequest request, CancellationToken ct = default);
    Task<LeadListResponse> ListAsync(string? status, string? search, CancellationToken ct = default);
    Task UpdateFollowUpAsync(long id, UpdateLeadFollowUpRequest request, int? actorId, CancellationToken ct = default);
    Task<PublicContentResponse> ListContentAsync(CancellationToken ct = default);
    Task<PublicContentItem> UpsertContentAsync(long? id, UpsertPublicContentRequest request, CancellationToken ct = default);
}