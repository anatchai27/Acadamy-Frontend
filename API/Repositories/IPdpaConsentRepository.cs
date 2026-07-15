using academy_API.Models;

namespace academy_API.Repositories;

public interface IPdpaConsentRepository
{
    Task<PdpaConsent> CreateAsync(PdpaConsent consent, CancellationToken cancellationToken = default);
}
