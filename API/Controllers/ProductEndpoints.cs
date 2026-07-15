using academy_API.Services.Contracts;
using academy_API.Utilities;

namespace academy_API.Controllers;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products")
            .WithTags("Products")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/", async (HttpContext httpContext, IProductService service, CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            var products = await service.GetByInstituteIdAsync(instituteId.Value, ct);
            return Results.Ok(products);
        });

        group.MapGet("/{id:int}", async (int id, IProductService service, CancellationToken ct) =>
        {
            var product = await service.GetByIdAsync(id, ct);
            return product is null ? Results.NotFound() : Results.Ok(product);
        });

        group.MapPost("/", async (HttpContext httpContext, DTOs.CreateProductRequest request, IProductService service, CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            var created = await service.CreateAsync(instituteId.Value, request, ct);
            return Results.Created($"/api/products/{created.Id}", created);
        });

        group.MapPut("/{id:int}", async (int id, DTOs.UpdateProductRequest request, IProductService service, CancellationToken ct) =>
        {
            var updated = await service.UpdateAsync(id, request, ct);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        });

        group.MapDelete("/{id:int}", async (int id, IProductService service, CancellationToken ct) =>
        {
            var deleted = await service.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        return app;
    }
}
