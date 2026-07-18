using academy_API.DTOs;
using academy_API.Services;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Controllers;

public static class EnrollmentEndpoints
{
    public static IEndpointRouteBuilder MapEnrollmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/enrollments")
            .WithTags("Enrollments")
            .WithOpenApi()
            .RequireAuthorization();

        group.MapPost("/", async (
            EnrollStudentRequest request,
            IEnrollmentService service,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            try
            {
                var result = await service.EnrollAsync(request, ct);
                return Results.Created($"/api/enrollments/{result.Data.EnrollmentId}", result);
            }
            catch (EnrollmentValidationException ex)
            {
                return Results.BadRequest(new AttendanceErrorResponse("error", ex.ErrorCode, ex.Message));
            }
            catch (DbUpdateException)
            {
                return Results.Problem("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง", statusCode: 500);
            }
        });

        return app;
    }
}