namespace academy_API.Controllers;

using academy_API.Services.Contracts;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products")
            .WithTags("Products")
            .WithOpenApi();

        group.MapGet("/", async (IProductService service, CancellationToken cancellationToken) =>
        {
            var products = await service.GetAllAsync(cancellationToken);
            return Results.Ok(products);
        });

        group.MapGet("/{id:int}", async (int id, IProductService service, CancellationToken cancellationToken) =>
        {
            var product = await service.GetByIdAsync(id, cancellationToken);
            return product is null ? Results.NotFound() : Results.Ok(product);
        });

        group.MapPost("/", async (DTOs.CreateProductRequest request, IProductService service, CancellationToken cancellationToken) =>
        {
            var created = await service.CreateAsync(request, cancellationToken);
            return Results.Created($"/api/products/{created.Id}", created);
        });

        group.MapPut("/{id:int}", async (int id, DTOs.UpdateProductRequest request, IProductService service, CancellationToken cancellationToken) =>
        {
            var updated = await service.UpdateAsync(id, request, cancellationToken);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        });

        group.MapDelete("/{id:int}", async (int id, IProductService service, CancellationToken cancellationToken) =>
        {
            var deleted = await service.DeleteAsync(id, cancellationToken);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        return app;
    }
}
