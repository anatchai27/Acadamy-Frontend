using academy_API.DTOs;
using academy_API.Models;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class ProductServiceTests
{
    private static Mock<academy_API.Repositories.IProductRepository> CreateMockRepo() => new();

    private static Product CreateTestProduct(int id = 1, int instituteId = 5, string name = "เสื้อสถาบัน", decimal price = 300m, string? desc = null) => new()
    {
        Id = id,
        InstituteId = instituteId,
        Name = name,
        Price = price,
        Description = desc,
        IsActive = true,
        CreatedAt = DateTime.UtcNow
    };

    // 1 ──────────────────── GetByInstituteIdAsync ────────────────────

    [Fact]
    public async Task GetByInstituteIdAsync_ReturnsProductsForInstitute()
    {
        var mockRepo = CreateMockRepo();
        var products = new List<Product>
        {
            CreateTestProduct(id: 1, instituteId: 5, name: "Product A"),
            CreateTestProduct(id: 2, instituteId: 5, name: "Product B")
        };
        mockRepo.Setup(r => r.GetByInstituteIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(products);

        var sut = new ProductService(mockRepo.Object);
        var result = await sut.GetByInstituteIdAsync(5);

        Assert.Equal(2, result.Count());
        Assert.Contains(result, p => p.Name == "Product A");
    }

    [Fact]
    public async Task GetByInstituteIdAsync_EmptyInstitute_ReturnsEmpty()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.GetByInstituteIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var sut = new ProductService(mockRepo.Object);
        var result = await sut.GetByInstituteIdAsync(99);

        Assert.Empty(result);
    }

    // 3 ──────────────────── GetByIdAsync ────────────────────

    [Fact]
    public async Task GetByIdAsync_Existing_ReturnsProduct()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(CreateTestProduct(id: 1));

        var sut = new ProductService(mockRepo.Object);
        var result = await sut.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("เสื้อสถาบัน", result!.Name);
    }

    [Fact]
    public async Task GetByIdAsync_NotFound_ReturnsNull()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((Product?)null);

        var sut = new ProductService(mockRepo.Object);
        Assert.Null(await sut.GetByIdAsync(999));
    }

    // 5 ──────────────────── CreateAsync ────────────────────

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesAndReturnsProduct()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.CreateAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product p, CancellationToken _) =>
            {
                p.Id = 42;
                p.CreatedAt = DateTime.UtcNow;
                return p;
            });

        var sut = new ProductService(mockRepo.Object);
        var result = await sut.CreateAsync(5, new CreateProductRequest("หนังสือเรียน", 500m, "คณิตศาสตร์ ม.1"));

        Assert.NotNull(result);
        Assert.Equal(42, result.Id);
        Assert.Equal("หนังสือเรียน", result.Name);
        Assert.Equal(500m, result.Price);
        Assert.Equal("คณิตศาสตร์ ม.1", result.Description);
    }

    [Fact]
    public async Task CreateAsync_WithoutDescription_SetsNull()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.CreateAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product p, CancellationToken _) => { p.Id = 10; return p; });

        var sut = new ProductService(mockRepo.Object);
        var result = await sut.CreateAsync(5, new CreateProductRequest("สินค้า", 100m, null));

        Assert.Null(result.Description);
    }

    // 7 ──────────────────── UpdateAsync ────────────────────

    [Fact]
    public async Task UpdateAsync_Existing_UpdatesAndReturns()
    {
        var existing = CreateTestProduct(id: 1, name: "Old Name", price: 100m);
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.UpdateAsync(1, It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((int id, Product p, CancellationToken _) =>
            {
                existing.Name = p.Name;
                existing.Price = p.Price;
                existing.Description = p.Description;
                existing.IsActive = p.IsActive;
                return existing;
            });

        var sut = new ProductService(mockRepo.Object);
        var result = await sut.UpdateAsync(1, new UpdateProductRequest("New Name", 250m, "Updated desc", true));

        Assert.NotNull(result);
        Assert.Equal("New Name", result!.Name);
        Assert.Equal(250m, result.Price);
        Assert.Equal("Updated desc", result.Description);
    }

    [Fact]
    public async Task UpdateAsync_NotFound_ReturnsNull()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.UpdateAsync(999, It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        var sut = new ProductService(mockRepo.Object);
        Assert.Null(await sut.UpdateAsync(999, new UpdateProductRequest("X", 1m, null)));
    }

    // 9 ──────────────────── DeleteAsync ────────────────────

    [Fact]
    public async Task DeleteAsync_Existing_ReturnsTrue()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.DeleteAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = new ProductService(mockRepo.Object);
        Assert.True(await sut.DeleteAsync(1));
    }

    [Fact]
    public async Task DeleteAsync_NotFound_ReturnsFalse()
    {
        var mockRepo = CreateMockRepo();
        mockRepo.Setup(r => r.DeleteAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var sut = new ProductService(mockRepo.Object);
        Assert.False(await sut.DeleteAsync(999));
    }
}
