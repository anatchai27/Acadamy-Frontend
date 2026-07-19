namespace academy_API.DTOs;

public record CreateProductRequest(string Name, decimal Price, string? Description);
public record UpdateProductRequest(string Name, decimal Price, string? Description, bool IsActive = true);
public record ProductResponse(int Id, string Name, decimal Price, string? Description);
