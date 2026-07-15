using academy_API.Data;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public class PdpaConsentRepository(TutoringDbContext context) : IPdpaConsentRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<PdpaConsent> CreateAsync(PdpaConsent consent, CancellationToken cancellationToken = default)
    {
        _context.PdpaConsents.Add(consent);
        await _context.SaveChangesAsync(cancellationToken);
        return consent;
    }
}
