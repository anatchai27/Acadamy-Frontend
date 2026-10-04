using academy_API.Services;
using academy_API.Utilities;
using Microsoft.AspNetCore.Mvc;

namespace academy_API.Controllers;

public static class FileUploadEndpoints
{
    public static IEndpointRouteBuilder MapFileUploadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/uploads").WithTags("File Uploads").WithOpenApi().RequireAuthorization();

        group.MapPost("/logo", async (HttpContext context, IFormFile file, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadLogoAsync(instituteId, uploadedFile, ct)));
        MapPaymentSlipUploadEndpoint(group);
        group.MapPost("/homework", async (HttpContext context, IFormFile file, int homeworkId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadHomeworkAsync(instituteId, homeworkId, uploadedFile, ct)));
        group.MapPost("/homework-submission", async (HttpContext context, IFormFile file, int submissionId, IFileUploadService service, [FromServices] IParentService parentService, CancellationToken ct) =>
        {
            if (context.User.IsInRole("parent"))
            {
                var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userId, out var parsedUserId) || !await parentService.IsParentOfHomeworkSubmissionAsync(parsedUserId, submissionId, ct))
                    return Results.Forbid();
            }
            return await Execute(context, file, (instituteId, uploadedFile) => service.UploadHomeworkSubmissionAsync(instituteId, submissionId, uploadedFile, ct));
        });
        group.MapPost("/student-photo", async (HttpContext context, IFormFile file, int studentId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadStudentPhotoAsync(instituteId, studentId, uploadedFile, ct)));
        group.MapPost("/teacher-photo", async (HttpContext context, IFormFile file, int teacherId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadTeacherPhotoAsync(instituteId, teacherId, uploadedFile, ct)));
        group.MapPost("/website-media", async (HttpContext context, IFormFile file, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadWebsiteMediaAsync(instituteId, uploadedFile, ct)));

        return app;
    }

    public static IEndpointRouteBuilder MapPaymentSlipUploadEndpoint(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/uploads").WithTags("File Uploads").WithOpenApi().RequireAuthorization();
        MapPaymentSlipUploadEndpoint(group);
        return app;
    }

    private static void MapPaymentSlipUploadEndpoint(RouteGroupBuilder group)
    {
        group.MapPost("/payment-slip", async (HttpContext context, IFormFile file, int paymentId, IFileUploadService service, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("admin")) return Results.Forbid();
            return await Execute(context, file, (instituteId, uploadedFile) => service.UploadPaymentSlipAsync(instituteId, paymentId, uploadedFile, ct));
        });
    }

    private static async Task<IResult> Execute(HttpContext context, IFormFile file, Func<int, IFormFile, Task<DTOs.FileUploadResponse>> action)
    {
        var instituteId = context.GetInstituteId();
        if (!instituteId.HasValue) return Results.BadRequest(new { error = "User not associated with any institute." });
        try { return Results.Ok(await action(instituteId.Value, file)); }
        catch (FileUploadValidationException ex) when (ex.Code == "NOT_FOUND") { return Results.NotFound(new { error = ex.Message }); }
        catch (FileUploadValidationException ex) { return Results.BadRequest(new { error = ex.Message, code = ex.Code }); }
    }
}
