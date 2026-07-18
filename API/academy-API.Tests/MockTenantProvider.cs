using academy_API.Services.Interface;

namespace academy_API.Tests;

public class MockTenantProvider : ITenantProvider
{
    public int InstituteId { get; set; } = 1;
}