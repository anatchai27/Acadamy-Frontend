using academy_API.DTOs;
using academy_API.Services;
using academy_API.Utilities;

namespace academy_API.Controllers;

public static class InstituteEndpoints
{
    public static IEndpointRouteBuilder MapInstituteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/institutes")
            .WithTags("Institute Settings")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/me", async (HttpContext httpContext, IInstituteService service, CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            var institute = await service.GetMeAsync(instituteId.Value, ct);

            return institute is null
                ? Results.NotFound(new { error = "Institute not found." })
                : Results.Ok(new { status = "success", data = institute });
        });

        group.MapPut("/me", async (HttpContext httpContext, IInstituteService service, UpdateInstituteRequest request, CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { error = "User not associated with any institute." });

            if (!await service.UpdateMeAsync(instituteId.Value, request, ct))
                return Results.NotFound(new { error = "Institute not found." });

            return Results.Ok(new { status = "success", message = "บันทึกข้อมูลสถาบันสำเร็จ" });
        });

        return app;
    }
}
