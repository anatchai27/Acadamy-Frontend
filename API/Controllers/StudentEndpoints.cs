using academy_API.DTOs;
using academy_API.Services;
using academy_API.Services.Contracts;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class StudentEndpoints
{
    public static IEndpointRouteBuilder MapStudentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/students")
            .WithTags("Students")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapGet("/", async (
            IStudentService service,
            HttpContext httpContext,
            string? search,
            int page = 1,
            int limit = 20,
            CancellationToken ct = default) =>
        {
            var result = await service.GetAllAsync(search, page, limit, ct);
            return Results.Ok(result);
        });

        group.MapGet("/export", async (IStudentExportService service, CancellationToken ct) =>
        {
            var csv = await service.ExportCsvAsync(ct);
            return Results.File(csv, "text/csv; charset=utf-8", $"students-{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        });

        group.MapGet("/{id:int}", async (
            int id,
            IStudentService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var profile = await service.GetByIdAsync(id, ct);
            return profile is null
                ? Results.NotFound(new { Status = "error", Message = "ไม่พบข้อมูลนักเรียน" })
                : Results.Ok(profile);
        });

        group.MapPost("/", async (
            CreateStudentRequest request,
            IStudentService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var instituteIdClaim = httpContext.User.FindFirst("institute_id")?.Value;
                if (string.IsNullOrEmpty(instituteIdClaim) || !int.TryParse(instituteIdClaim, out var instituteId))
                    return Results.BadRequest(new { Status = "error", Message = "Institute not identified." });

                var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();

                var result = await service.CreateAsync(request, instituteId, ipAddress, ct);
                return Results.Created($"/api/students/{result.Data.StudentId}", result);
            }
            catch (StudentValidationException ex)
            {
                return Results.BadRequest(new StudentErrorResponse(
                    "error",
                    ex.ErrorCode,
                    ex.Message
                ));
            }
            catch (DbUpdateException)
            {
                return Results.Problem("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง", statusCode: 500);
            }
        });

        group.MapPut("/{id:int}", async (
            int id,
            UpdateStudentRequest request,
            IStudentService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var result = await service.UpdateAsync(id, request, ct);
                return Results.Ok(result);
            }
            catch (StudentValidationException ex) when (ex.ErrorCode == "NOT_FOUND")
            {
                return Results.NotFound(new StudentErrorResponse("error", ex.ErrorCode, ex.Message));
            }
            catch (StudentValidationException ex) when (ex.ErrorCode == "FORBIDDEN")
            {
                return Results.Json(new StudentErrorResponse("error", ex.ErrorCode, ex.Message), statusCode: 403);
            }
            catch (StudentValidationException ex)
            {
                return Results.BadRequest(new StudentErrorResponse("error", ex.ErrorCode, ex.Message));
            }
            catch (DbUpdateException)
            {
                return Results.Problem("เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง", statusCode: 500);
            }
        });

        group.MapGet("/{id:int}/qr", async (
            int id,
            IStudentService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var result = await service.GetQrTokenAsync(id, ct);
                return Results.Ok(result);
            }
            catch (StudentValidationException ex) when (ex.ErrorCode == "NOT_FOUND")
            {
                return Results.NotFound(new StudentErrorResponse("error", ex.ErrorCode, ex.Message));
            }
            catch (StudentValidationException ex) when (ex.ErrorCode == "FORBIDDEN")
            {
                return Results.Json(new StudentErrorResponse("error", ex.ErrorCode, ex.Message), statusCode: 403);
            }
            catch (DbUpdateException)
            {
                return Results.Problem("เกิดข้อผิดพลาดในการสร้าง QR Token กรุณาลองใหม่อีกครั้ง", statusCode: 500);
            }
        });

        group.MapGet("/{id:int}/card.pdf", async (
            int id,
            IStudentCardService service,
            CancellationToken ct) =>
        {
            try
            {
                var url = await service.GenerateAsync(id, ct);
                return Results.Ok(new { status = "success", data = new { cardPdfUrl = url } });
            }
            catch (StudentValidationException ex) when (ex.ErrorCode == "NOT_FOUND")
            { return Results.NotFound(new StudentErrorResponse("error", ex.ErrorCode, ex.Message)); }
            catch (StudentValidationException ex)
            { return Results.BadRequest(new StudentErrorResponse("error", ex.ErrorCode, ex.Message)); }
        });

        group.MapGet("/{studentId:int}/pickup-authorizations", async (int studentId, IStudentPickupService service, CancellationToken ct) =>
            await Execute(() => service.ListAsync(studentId, ct), Results.Ok));

        group.MapPost("/{studentId:int}/pickup-authorizations", async (int studentId, CreatePickupAuthorizationRequest request, IStudentPickupService service, HttpContext context, CancellationToken ct) =>
            await Execute(() => service.CreateAsync(studentId, request, GetActorId(context), ct), result => Results.Created($"/api/students/{studentId}/pickup-authorizations/{result.Id}", result)));

        group.MapPatch("/{studentId:int}/pickup-authorizations/{authorizationId:long}", async (int studentId, long authorizationId, UpdatePickupAuthorizationRequest request, IStudentPickupService service, CancellationToken ct) =>
            await Execute(() => service.UpdateAsync(studentId, authorizationId, request, ct), Results.Ok));

        group.MapDelete("/{studentId:int}/pickup-authorizations/{authorizationId:long}", async (int studentId, long authorizationId, IStudentPickupService service, CancellationToken ct) =>
            await Execute(async () => { await service.DeleteAsync(studentId, authorizationId, ct); return Results.NoContent(); }, result => result));

        return app;
    }

    private static int? GetActorId(HttpContext context)
    {
        var value = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    private static async Task<IResult> Execute<T>(Func<Task<T>> action, Func<T, IResult> success)
    {
        try { return success(await action()); }
        catch (StudentPickupValidationException ex) when (ex.Code == "NOT_FOUND") { return Results.NotFound(new { error = ex.Message }); }
        catch (StudentPickupValidationException ex) { return Results.BadRequest(new { error = ex.Message, code = ex.Code }); }
    }
}