using System.Security.Claims;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace academy_API.Data.Interceptors;

public class AuditTenantSaveChangesInterceptor(IHttpContextAccessor httpContextAccessor) : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        ApplyAudit(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ApplyAudit(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void ApplyAudit(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var instituteId = ResolveInstituteId();
        var userId = ResolveUserId();

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                ApplyTenantOnAdd(entry, instituteId);
                ApplyIntPropertyIfExists(entry, "CreatedBy", userId);
                ApplyIntPropertyIfExists(entry, "UpdatedBy", userId);
            }
            else if (entry.State == EntityState.Modified)
            {
                ApplyIntPropertyIfExists(entry, "UpdatedBy", userId);
            }
            else if (entry.State == EntityState.Deleted)
            {
                // Soft-delete only when entity supports DeletedAt.
                if (TryGetDateTimeProperty(entry, "DeletedAt", out var deletedAtProperty))
                {
                    deletedAtProperty.CurrentValue = DateTime.UtcNow;
                    entry.State = EntityState.Modified;
                    ApplyIntPropertyIfExists(entry, "UpdatedBy", userId);
                }
            }
        }
    }

    private void ApplyTenantOnAdd(EntityEntry entry, int? instituteId)
    {
        if (entry.Entity is not IMultiTenantEntity tenantEntity)
        {
            return;
        }

        if (instituteId.HasValue)
        {
            tenantEntity.InstituteId = instituteId.Value;
            return;
        }

        if (tenantEntity.InstituteId <= 0)
        {
            throw new InvalidOperationException("Missing institute context for multi-tenant write operation.");
        }
    }

    private int? ResolveInstituteId()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return null;
        }

        if (httpContext.Items.TryGetValue("InstituteId", out var instituteObj) && instituteObj is int instituteId)
        {
            return instituteId;
        }

        var claimValue = httpContext.User.FindFirst("institute_id")?.Value;
        if (int.TryParse(claimValue, out instituteId))
        {
            return instituteId;
        }

        return null;
    }

    private int? ResolveUserId()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return null;
        }

        var userIdClaim =
            httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            httpContext.User.FindFirstValue("sub") ??
            httpContext.User.FindFirstValue("user_id");

        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private static void ApplyIntPropertyIfExists(EntityEntry entry, string propertyName, int? value)
    {
        if (!value.HasValue)
        {
            return;
        }

        var property = entry.Metadata.FindProperty(propertyName);
        if (property is null)
        {
            return;
        }

        var propertyEntry = entry.Property(propertyName);
        if (propertyEntry.Metadata.ClrType == typeof(int?) || propertyEntry.Metadata.ClrType == typeof(int))
        {
            propertyEntry.CurrentValue = value.Value;
        }
    }

    private static bool TryGetDateTimeProperty(EntityEntry entry, string propertyName, out PropertyEntry propertyEntry)
    {
        propertyEntry = null!;

        var property = entry.Metadata.FindProperty(propertyName);
        if (property is null)
        {
            return false;
        }

        propertyEntry = entry.Property(propertyName);
        var clrType = propertyEntry.Metadata.ClrType;
        return clrType == typeof(DateTime?) || clrType == typeof(DateTime);
    }
}
