using academy_API.Data;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public class ProductRepository(TutoringDbContext context) : IProductRepository
{
    private readonly TutoringDbContext _context = context;

    public async Task<IEnumerable<Models.Product>> GetByInstituteIdAsync(int instituteId, CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .Where(p => p.InstituteId == instituteId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Models.Product?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Models.Product> CreateAsync(Models.Product product, CancellationToken cancellationToken = default)
    {
        product.CreatedAt = DateTime.UtcNow;
        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);
        return product;
    }

    public async Task<Models.Product?> UpdateAsync(int id, Models.Product product, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (existing is null) return null;

        existing.Name = product.Name;
        existing.Price = product.Price;
        existing.Description = product.Description;
        existing.IsActive = product.IsActive;
        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (existing is null) return false;

        _context.Products.Remove(existing);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
