using academy_API.Models;

namespace academy_API.DTOs;

public record CreateStaffRequest(string Email, string Password, string? Phone, UserRole Role, string FullName);
public record UpdateRoleRequest(UserRole Role);
public record UpdatePasswordRequest(string NewPassword);
public record PermissionActions(bool Read, bool Edit, bool Delete);
public record UpdatePermissionsRequest(UserRole Role, Dictionary<string, PermissionActions> Permissions);
public record ForgetPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
