using System.Collections.Concurrent;
using academy_API.DTOs;
using academy_API.Models;

namespace academy_API.Services;

// Temporary process store until role permissions have a dedicated database table.
public static class PermissionPolicyStore
{
    private static readonly string[] DefaultPages =
    [
        "/admin/dashboard", "/admin/students", "/admin/teachers", "/admin/courses",
        "/admin/attendance", "/admin/leads", "/admin/makeup-slots", "/admin/requests",
        "/admin/academics", "/admin/finance", "/admin/products", "/admin/users", "/admin/settings"
    ];

    private static readonly ConcurrentDictionary<(int InstituteId, UserRole Role), Dictionary<string, PermissionActions>> Policies = new();

    public static void Set(int instituteId, UserRole role, Dictionary<string, PermissionActions> permissions) =>
        Policies[(instituteId, role)] = new Dictionary<string, PermissionActions>(permissions);

    public static Dictionary<string, PermissionActions>? Get(int instituteId, UserRole role) =>
        Policies.TryGetValue((instituteId, role), out var permissions) ? new(permissions) : null;

    public static Dictionary<string, PermissionActions> GetOrDefault(int instituteId, UserRole role) =>
        Get(instituteId, role) ?? DefaultPages.ToDictionary(
            page => page,
            _ => role == UserRole.admin
                ? new PermissionActions(true, true, true)
                : new PermissionActions(false, false, false));
}
