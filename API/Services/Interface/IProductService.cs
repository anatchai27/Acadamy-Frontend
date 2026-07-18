namespace academy_API.Services.Contracts;

public interface IProductService
{
    Task<IEnumerable<DTOs.ProductResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<DTOs.ProductResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<DTOs.ProductResponse> CreateAsync(DTOs.CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<DTOs.ProductResponse?> UpdateAsync(int id, DTOs.UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
