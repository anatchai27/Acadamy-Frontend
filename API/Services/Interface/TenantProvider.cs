using academy_API.Utilities;

namespace academy_API.Services.Interface;

public class TenantProvider(IHttpContextAccessor httpContextAccessor) : ITenantProvider
{
    public int InstituteId
    {
        get
        {
            var context = httpContextAccessor.HttpContext;
            if (context?.Items["InstituteId"] is int instituteId)
                return instituteId;

            return 0;
        }
    }
}