using academy_API.DTOs;
using academy_API.Services;
using academy_API.Utilities;

namespace academy_API.Controllers;

public static class TeacherEndpoints
{
    public static IEndpointRouteBuilder MapTeacherEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/teachers")
            .WithTags("Teachers")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/", async (HttpContext httpContext, ITeacherService service, CancellationToken ct) =>
        {
            var search = httpContext.Request.Query["search"].FirstOrDefault();
            return Results.Ok(new { status = "success", data = await service.ListAsync(search, ct) });
        });

        group.MapGet("/{id:int}", async (int id, ITeacherService service, CancellationToken ct) =>
        {
            var teacher = await service.GetByIdAsync(id, ct);
            return teacher is null
                ? Results.NotFound(new { status = "error", message = "Teacher not found." })
                : Results.Ok(new { status = "success", data = teacher });
        });

        group.MapPost("/", async (CreateTeacherRequest request, HttpContext httpContext, ITeacherService service, CancellationToken ct) =>
        {
            var instituteId = httpContext.GetInstituteId();
            if (instituteId is null)
                return Results.BadRequest(new { status = "error", message = "User not associated with any institute." });

            try
            {
                var teacher = await service.CreateAsync(request, instituteId.Value, ct);
                return Results.Created($"/api/teachers/{teacher.Id}", new
                {
                    status = "success",
                    message = "เพิ่มครูผู้สอนสำเร็จ",
                    data = teacher
                });
            }
            catch (TeacherValidationException ex) when (ex.Code == "EMAIL_CONFLICT")
            {
                return Results.Conflict(new { status = "error", message = ex.Message });
            }
            catch (TeacherValidationException ex)
            {
                return Results.BadRequest(new { status = "error", message = ex.Message });
            }
        });

        group.MapPatch("/{id:int}", async (int id, PatchTeacherRequest request, ITeacherService service, CancellationToken ct) =>
        {
            try
            {
                var result = await service.PatchAsync(id, request, ct);
                return result == PatchTeacherResult.NotFound
                    ? Results.NotFound(new { status = "error", message = "Teacher not found." })
                    : Results.Ok(new { status = "success", message = "แก้ไขข้อมูลครูสำเร็จ" });
            }
            catch (TeacherValidationException ex)
            {
                return Results.BadRequest(new { status = "error", message = ex.Message });
            }
        });

        group.MapDelete("/{id:int}", async (int id, ITeacherService service, CancellationToken ct) =>
        {
            return await service.DeleteAsync(id, ct)
                ? Results.Ok(new { status = "success", message = "ลบครูผู้สอนสำเร็จ" })
                : Results.NotFound(new { status = "error", message = "Teacher not found." });
        });

        return app;
    }
}
