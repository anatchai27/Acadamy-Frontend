using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Services.Contracts;

public sealed record IssuedParentLineLinkCode(string Code, DateTime ExpiresAt);
public sealed record RedeemedParentLineLink(User User, Parent Parent, List<ChildSummary> Children);
public enum ParentLineLinkStatus { Success, NotFound, InvalidCode, Expired, AlreadyUsed, Conflict }
public sealed record ParentLineLinkOutcome(ParentLineLinkStatus Status, RedeemedParentLineLink? Binding = null);
