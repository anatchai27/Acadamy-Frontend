namespace academy_API.Utilities;

public static class TenantExtensions
{
    public static int? GetInstituteId(this HttpContext context)
    {
        if (context.Items.TryGetValue("InstituteId", out var value) && value is int instituteId)
            return instituteId;

        return null;
    }
}
