using academy_API.Services;
using academy_API.Services.Interface;
using academy_API.Utilities;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace academy_API.Controllers;

public static class FileUploadEndpoints
{
    public static IEndpointRouteBuilder MapFileUploadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/uploads").WithTags("File Uploads").WithOpenApi().RequireAuthorization();

        group.MapPost("/payment-qr", async (HttpContext context, IFormFile file, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadPaymentQrAsync(instituteId, uploadedFile, ct)))
            .RequireAuthorization(policy => policy.RequireRole("admin"))
            .DisableAntiforgery();

        group.MapPost("/logo", async (HttpContext context, IFormFile file, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadLogoAsync(instituteId, uploadedFile, ct)))
            .DisableAntiforgery();
        MapPaymentSlipUploadEndpoint(group);
        MapPaymentBatchSlipUploadEndpoint(group);
        group.MapPost("/homework", async (HttpContext context, IFormFile file, int homeworkId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadHomeworkAsync(instituteId, homeworkId, uploadedFile, ct)))
            .DisableAntiforgery();
        group.MapPost("/homework-submission", async (HttpContext context, IFormFile file, int submissionId, IFileUploadService service, [FromServices] IParentService parentService, [FromServices] IHomeworkService homeworkService, CancellationToken ct) =>
        {
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userId, out var parsedUserId)) return Results.Unauthorized();
            var role = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (context.User.IsInRole("parent"))
            {
                if (!await parentService.IsParentOfHomeworkSubmissionAsync(parsedUserId, submissionId, ct))
                    return Results.Forbid();
            }
            else if (context.User.IsInRole("teacher"))
            {
                var instituteId = context.GetInstituteId();
                if (!instituteId.HasValue) return Results.BadRequest(new { error = "User not associated with any institute." });
                if (!await homeworkService.CanManageSubmissionAsync(submissionId, instituteId.Value, parsedUserId, ct))
                    return Results.Forbid();
            }
            else if (!context.User.IsInRole("admin")) return Results.Forbid();

            return await Execute(context, file, (instituteId, uploadedFile) =>
                service.UploadHomeworkSubmissionAsync(instituteId, submissionId, uploadedFile, ct, parsedUserId, role));
        }).DisableAntiforgery();
        group.MapPost("/student-photo", async (HttpContext context, IFormFile file, int studentId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadStudentPhotoAsync(instituteId, studentId, uploadedFile, ct)))
            .DisableAntiforgery();
        group.MapPost("/teacher-photo", async (HttpContext context, IFormFile file, int teacherId, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadTeacherPhotoAsync(instituteId, teacherId, uploadedFile, ct)))
            .DisableAntiforgery();
        group.MapPost("/website-media", async (HttpContext context, IFormFile file, IFileUploadService service, CancellationToken ct) =>
            await Execute(context, file, (instituteId, uploadedFile) => service.UploadWebsiteMediaAsync(instituteId, uploadedFile, ct)))
            .DisableAntiforgery();

        return app;
    }

    private static void MapPaymentSlipUploadEndpoint(RouteGroupBuilder group)
    {
        group.MapPost("/payment-slip", async (HttpContext context, IFormFile file, long paymentId, IFileUploadService service, [FromServices] IParentService parentService, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("admin"))
            {
                var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!context.User.IsInRole("parent")
                    || !int.TryParse(userId, out var parentUserId)
                    || !await parentService.IsParentOfPaymentAsync(parentUserId, paymentId, ct))
                    return Results.Forbid();
            }
            return await Execute(context, file, (instituteId, uploadedFile) => service.UploadPaymentSlipAsync(instituteId, paymentId, uploadedFile, ct));
        }).DisableAntiforgery();
    }

    private static void MapPaymentBatchSlipUploadEndpoint(RouteGroupBuilder group)
    {
        group.MapPost("/payment-batch-slip", async (HttpContext context, IFormFile file, long batchId, IFileUploadService service, [FromServices] IParentService parentService, CancellationToken ct) =>
        {
            if (!context.User.IsInRole("admin"))
            {
                var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!context.User.IsInRole("parent")
                    || !int.TryParse(userId, out var parentUserId)
                    || !await parentService.IsParentOfPaymentBatchAsync(parentUserId, batchId, ct))
                    return Results.Forbid();
            }
            return await Execute(context, file, (instituteId, uploadedFile) => service.UploadPaymentBatchSlipAsync(instituteId, batchId, uploadedFile, ct));
        }).DisableAntiforgery();
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
