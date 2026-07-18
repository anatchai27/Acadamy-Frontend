using academy_API.Data;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Tests;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Tests.unitTest;

public class ProductRepositoryTests
{
    private static TutoringDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TutoringDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new TutoringDbContext(options, new MockTenantProvider());
    }

    // 1 ──────────────────── GetByInstituteIdAsync ────────────────────

    [Fact]
    public async Task GetByInstituteIdAsync_ReturnsOnlyActiveProductsForInstitute()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        context.Products.AddRange(
            new Product { InstituteId = 5, Name = "A", Price = 100, IsActive = true, CreatedAt = DateTime.UtcNow },
            new Product { InstituteId = 5, Name = "B", Price = 200, IsActive = true, CreatedAt = DateTime.UtcNow },
            new Product { InstituteId = 5, Name = "C", Price = 300, IsActive = false, CreatedAt = DateTime.UtcNow },
            new Product { InstituteId = 10, Name = "D", Price = 400, IsActive = true, CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var repo = new ProductRepository(context);
        var results = await repo.GetByInstituteIdAsync(5);

        Assert.Equal(2, results.Count());
        Assert.DoesNotContain(results, p => p.Name == "C");
        Assert.DoesNotContain(results, p => p.Name == "D");
    }

    [Fact]
    public async Task GetByInstituteIdAsync_NoProducts_ReturnsEmpty()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);

        var repo = new ProductRepository(context);
        Assert.Empty(await repo.GetByInstituteIdAsync(1));
    }

    // 3 ──────────────────── GetByIdAsync ────────────────────

    [Fact]
    public async Task GetByIdAsync_Existing_ReturnsProduct()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var product = new Product { InstituteId = 1, Name = "P1", Price = 100, IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var repo = new ProductRepository(context);
        var result = await repo.GetByIdAsync(product.Id);

        Assert.NotNull(result);
        Assert.Equal("P1", result!.Name);
    }

    [Fact]
    public async Task GetByIdAsync_NotFound_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);

        var repo = new ProductRepository(context);
        Assert.Null(await repo.GetByIdAsync(999));
    }

    // 5 ──────────────────── CreateAsync ────────────────────

    [Fact]
    public async Task CreateAsync_PersistsProduct()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var product = new Product { InstituteId = 5, Name = "NewItem", Price = 150m, Description = "desc", IsActive = true };

        var repo = new ProductRepository(context);
        var created = await repo.CreateAsync(product);

        Assert.True(created.Id > 0);
        Assert.Equal("NewItem", created.Name);
        Assert.Equal(5, created.InstituteId);
        Assert.Equal(150m, created.Price);
        Assert.Equal("desc", created.Description);
        Assert.True(created.IsActive);
        Assert.True(created.CreatedAt > DateTime.MinValue);
        Assert.Equal(1, await context.Products.CountAsync());
    }

    // 6 ──────────────────── UpdateAsync ────────────────────

    [Fact]
    public async Task UpdateAsync_Existing_UpdatesFields()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var product = new Product { InstituteId = 5, Name = "Old", Price = 100m, IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var repo = new ProductRepository(context);
        var updated = await repo.UpdateAsync(product.Id, new Product
        {
            Name = "Updated",
            Price = 200m,
            Description = "new desc",
            IsActive = false
        });

        Assert.NotNull(updated);
        Assert.Equal("Updated", updated!.Name);
        Assert.Equal(200m, updated.Price);
        Assert.Equal("new desc", updated.Description);
        Assert.False(updated.IsActive);

        var saved = await context.Products.FirstAsync(p => p.Id == product.Id);
        Assert.Equal("Updated", saved.Name);
        Assert.Equal(200m, saved.Price);
        Assert.False(saved.IsActive);
    }

    [Fact]
    public async Task UpdateAsync_NotFound_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);

        var repo = new ProductRepository(context);
        Assert.Null(await repo.UpdateAsync(999, new Product { Name = "X", Price = 1m }));
    }

    // 8 ──────────────────── DeleteAsync ────────────────────

    [Fact]
    public async Task DeleteAsync_Existing_RemovesAndReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var product = new Product { InstituteId = 5, Name = "ToDelete", Price = 50m, IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var repo = new ProductRepository(context);
        var result = await repo.DeleteAsync(product.Id);

        Assert.True(result);
        Assert.Empty(await context.Products.ToListAsync());
    }

    [Fact]
    public async Task DeleteAsync_NotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);

        var repo = new ProductRepository(context);
        Assert.False(await repo.DeleteAsync(999));
    }
}
