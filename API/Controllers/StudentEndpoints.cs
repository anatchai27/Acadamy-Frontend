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

        return app;
    }
}