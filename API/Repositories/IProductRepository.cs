namespace academy_API.Repositories;

public interface IProductRepository
{
    Task<IEnumerable<Models.Product>> GetByInstituteIdAsync(int instituteId, CancellationToken cancellationToken = default);
    Task<Models.Product?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Models.Product> CreateAsync(Models.Product product, CancellationToken cancellationToken = default);
    Task<Models.Product?> UpdateAsync(int id, Models.Product product, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
