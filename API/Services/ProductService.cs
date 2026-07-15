using academy_API.Services.Contracts;

namespace academy_API.Services;

public class ProductService(Repositories.IProductRepository repository) : IProductService
{
    private readonly Repositories.IProductRepository _repository = repository;

    public async Task<IEnumerable<DTOs.ProductResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var products = await _repository.GetAllAsync(cancellationToken);
        return products.Select(MapToResponse);
    }

    public async Task<DTOs.ProductResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _repository.GetByIdAsync(id, cancellationToken);
        return product is null ? null : MapToResponse(product);
    }

    public async Task<DTOs.ProductResponse> CreateAsync(DTOs.CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = new Models.Product
        {
            Name = request.Name,
            Price = request.Price
        };

        var created = await _repository.CreateAsync(product, cancellationToken);
        return MapToResponse(created);
    }

    public async Task<DTOs.ProductResponse?> UpdateAsync(int id, DTOs.UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = new Models.Product
        {
            Name = request.Name,
            Price = request.Price
        };

        var updated = await _repository.UpdateAsync(id, product, cancellationToken);
        return updated is null ? null : MapToResponse(updated);
    }

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        return _repository.DeleteAsync(id, cancellationToken);
    }

    private static DTOs.ProductResponse MapToResponse(Models.Product product) =>
        new(product.Id, product.Name, product.Price);
}
