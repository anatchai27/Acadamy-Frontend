using academy_API.Data;
using academy_API.Utilities;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class InstituteEndpoints
{
    public static IEndpointRouteBuilder MapInstituteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/institutes")
            .WithTags("Institute Settings")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/me", async (HttpContext httpContext, TutoringDbContext db, CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            var institute = await db.Institutes
                .Where(i => i.Id == instituteId)
                .Select(i => new
                {
                    i.Id,
                    i.Name,
                    i.LogoUrl,
                    i.ContactPhone,
                    i.Address,
                    i.TaxId,
                    i.ReceiptNote,
                    i.Email,
                    i.IsActive
                })
                .FirstOrDefaultAsync(ct);

            return institute is null
                ? Results.NotFound(new { error = "Institute not found." })
                : Results.Ok(new { status = "success", data = institute });
        });

        group.MapPut("/me", async (HttpContext httpContext, TutoringDbContext db, UpdateInstituteRequest request, CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            var institute = await db.Institutes.FirstOrDefaultAsync(i => i.Id == instituteId, ct);
            if (institute is null)
                return Results.NotFound(new { error = "Institute not found." });

            if (request.Name is not null) institute.Name = request.Name;
            if (request.ContactPhone is not null) institute.ContactPhone = request.ContactPhone;
            if (request.Address is not null) institute.Address = request.Address;
            if (request.TaxId is not null) institute.TaxId = request.TaxId;
            if (request.ReceiptNote is not null) institute.ReceiptNote = request.ReceiptNote;
            if (request.Email is not null) institute.Email = request.Email;
            institute.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync(ct);

            return Results.Ok(new { status = "success", message = "บันทึกข้อมูลสถาบันสำเร็จ" });
        });

        return app;
    }
}

public record UpdateInstituteRequest
{
    public string? Name { get; init; }
    public string? ContactPhone { get; init; }
    public string? Address { get; init; }
    public string? TaxId { get; init; }
    public string? ReceiptNote { get; init; }
    public string? Email { get; init; }
}
