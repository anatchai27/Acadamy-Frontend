using academy_API.Services.Interface;

namespace academy_API.Tests;

public class MockTenantProvider : ITenantProvider
{
    // Unit tests opt into tenant filtering explicitly when testing isolation.
    // Zero mirrors the DbContext convention for an unscoped test fixture.
    public int InstituteId { get; set; }
}