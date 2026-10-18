using academy_API.Services.Contracts;

namespace academy_API.Services.Interface;

public interface IParentLineLinkService
{
    Task<IssuedParentLineLinkCode?> IssueAsync(int parentId, int instituteId, int actorUserId, CancellationToken ct = default);
    Task<ParentLineLinkOutcome> RedeemAsync(string code, string verifiedLineUserId, CancellationToken ct = default);
}
