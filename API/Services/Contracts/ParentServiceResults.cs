using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Services.Contracts;

public sealed record ParentBindingResult(User User, Parent Parent, List<ChildSummary> Children);
public sealed record ParentProfileResult(Parent Parent, string Email, List<ChildSummary> Children);
public enum ParentBindingStatus { Success, NotFound, Conflict }
public sealed record ParentBindingOutcome(ParentBindingStatus Status, ParentBindingResult? Binding = null);