namespace academy_API.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly List<Models.Product> _products = [];
    private int _nextId = 1;

    public Task<IEnumerable<Models.Product>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_products.AsEnumerable());
    }

    public Task<Models.Product?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_products.FirstOrDefault(p => p.Id == id));
    }

    public Task<Models.Product> CreateAsync(Models.Product product, CancellationToken cancellationToken = default)
    {
        product.Id = _nextId++;
        _products.Add(product);
        return Task.FromResult(product);
    }

    public Task<Models.Product?> UpdateAsync(int id, Models.Product product, CancellationToken cancellationToken = default)
    {
        var existing = _products.FirstOrDefault(p => p.Id == id);
        if (existing is null)
        {
            return Task.FromResult<Models.Product?>(null);
        }

        existing.Name = product.Name;
        existing.Price = product.Price;
        return Task.FromResult<Models.Product?>(existing);
    }

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var existing = _products.FirstOrDefault(p => p.Id == id);
        if (existing is null)
        {
            return Task.FromResult(false);
        }

        _products.Remove(existing);
        return Task.FromResult(true);
    }
}
